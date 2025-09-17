import { NextRequest, NextResponse } from "next/server";
import { TimelogEntry } from "@/lib/types";

interface GitLabTimelogEntry {
  id: string;
  timeSpent: number;
  user: {
    id: string;
    username: string;
    name: string;
  };
  spentAt: string;
  summary: string;
  issue: {
    id: string;
    iid: number;
    projectId: number;
    title: string;
    webUrl: string;
  };
}

interface GitLabError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
}

interface GitLabResponse {
  data: {
    group: {
      timelogs: {
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string;
        };
        nodes: GitLabTimelogEntry[];
      };
    };
  };
  errors?: GitLabError[];
}

function getWorkDate(spentAt: string): string {
  const date = new Date(spentAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function convertTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const { targetDates, selectedUsers, dataSource } = await request.json();

    if (!targetDates || !Array.isArray(targetDates)) {
      return NextResponse.json(
        { error: "Missing or invalid targetDates parameter" },
        { status: 400 }
      );
    }

    if (!selectedUsers || !Array.isArray(selectedUsers)) {
      return NextResponse.json(
        { error: "Missing or invalid selectedUsers parameter" },
        { status: 400 }
      );
    }

    if (!dataSource || !["gitlab", "jira"].includes(dataSource)) {
      return NextResponse.json(
        {
          error:
            'Missing or invalid dataSource parameter. Must be "gitlab" or "jira".',
        },
        { status: 400 }
      );
    }

    if (dataSource === "jira") {
      const jiraUrl = process.env.JIRA_API_URL;
      const accessToken = process.env.JIRA_ACCESS_TOKEN;
      const email = process.env.JIRA_EMAIL;

      if (!jiraUrl || !accessToken || !email) {
        return NextResponse.json(
          {
            error:
              "Jira configuration not found. Please check environment variables JIRA_API_URL, JIRA_ACCESS_TOKEN, and JIRA_EMAIL.",
          },
          { status: 500 }
        );
      }

      return await fetchJiraData(
        jiraUrl,
        email,
        accessToken,
        targetDates,
        selectedUsers
      );
    } else {
      const gitlabUrl = process.env.GITLAB_API_URL;
      const accessToken = process.env.GITLAB_ACCESS_TOKEN;

      if (!gitlabUrl || !accessToken) {
        return NextResponse.json(
          {
            error:
              "GitLab configuration not found. Please check environment variables GITLAB_API_URL and GITLAB_ACCESS_TOKEN.",
          },
          { status: 500 }
        );
      }

      return await fetchGitLabData(
        gitlabUrl,
        accessToken,
        targetDates,
        selectedUsers
      );
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

async function fetchJiraData(
  jiraUrl: string,
  email: string,
  accessToken: string,
  targetDates: string[],
  selectedUsers: string[]
) {
  const timelogGroups: Record<string, TimelogEntry[]> = {};
  const userTotals: Record<string, number> = {};

  targetDates.forEach((date: string) => {
    timelogGroups[date] = [];
  });

  const auth = Buffer.from(`${email}:${accessToken}`).toString("base64");

  function extractCommentText(comment: any): string {
    if (!comment) return "No description";
    if (typeof comment === "string") return comment;
    if (comment.content && Array.isArray(comment.content)) {
      let text = "";
      const walk = (nodes: any[]) => {
        for (const node of nodes) {
          if (typeof node.text === "string") text += node.text;
          if (node.type === "hardBreak") text += " ";
          if (node.content) walk(node.content);
        }
      };
      walk(comment.content);
      return text || "No description";
    }
    return "No description";
  }

  for (const date of targetDates) {
    // Use JQL to search for issues with worklogs on the specific date
    const jql = `worklogDate = "${date}"`;
    let startAt = 0;
    const maxResults = 100;
    let hasMoreIssues = true;

    while (hasMoreIssues) {
      const searchUrl = `${jiraUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(
        jql
      )}&fields=key,summary&startAt=${startAt}&maxResults=${maxResults}`;

      const searchResp = await fetch(searchUrl, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (!searchResp.ok) {
        const body = await searchResp.text();
        throw new Error(
          `Jira API error: ${searchResp.status} ${searchResp.statusText} - ${body}`
        );
      }

      const searchData = await searchResp.json();
      const issues = searchData.issues || [];

      for (const issue of issues) {
        const issueKey = issue.key;
        const issueSummary = issue.fields?.summary || "";

        // Fetch worklogs for this issue
        const worklogUrl = `${jiraUrl}/rest/api/3/issue/${encodeURIComponent(
          issueKey
        )}/worklog`;

        const worklogResp = await fetch(worklogUrl, {
          method: "GET",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        });

        if (!worklogResp.ok) {
          console.warn(
            `Failed to fetch worklogs for ${issueKey}: ${worklogResp.status}`
          );
          continue;
        }

        const worklogData = await worklogResp.json();
        const worklogs = worklogData.worklogs || [];

        for (const worklog of worklogs) {
          const worklogDate = getWorkDate(worklog.started);
          const authorName = worklog.author?.displayName || "";

          // Filter by date and selected users
          if (worklogDate === date && selectedUsers.includes(authorName)) {
            const timeSpentSeconds = worklog.timeSpentSeconds || 0;
            const humanTimeSpent = convertTime(timeSpentSeconds);
            const issueWebUrl = `${jiraUrl}/browse/${issueKey}`;
            const commentText = extractCommentText(worklog.comment)
              .replace(/\"/g, '\\"')
              .replace(/\n/g, " ");

            timelogGroups[date].push({
              issueTitle: `${issueKey}: ${issueSummary}`,
              summary: commentText,
              timeSpent: humanTimeSpent,
              userName: authorName,
              issueWebUrl,
            });

            if (!userTotals[authorName]) userTotals[authorName] = 0;
            userTotals[authorName] += timeSpentSeconds;
          }
        }
      }

      startAt += issues.length;
      hasMoreIssues = issues.length === maxResults;
    }
  }

  return NextResponse.json({ timelogGroups, userTotals });
}

async function fetchGitLabData(
  gitlabUrl: string,
  accessToken: string,
  targetDates: string[],
  selectedUsers: string[]
) {
  let cursor = "";
  let hasNextPage = true;
  const timelogGroups: Record<string, TimelogEntry[]> = {};
  const userTotals: Record<string, number> = {};

  targetDates.forEach((date: string) => {
    timelogGroups[date] = [];
  });

  while (hasNextPage) {
    const query = {
      query: `
        query {
          group(fullPath: "btv-applications") {
            timelogs(first: 100, after: "${cursor}", sort: SPENT_AT_DESC) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                id
                timeSpent
                user {
                  id
                  username
                  name
                }
                spentAt
                summary
                issue {
                  id
                  iid
                  projectId
                  title
                  webUrl
                }
              }
            }
          }
        }
      `,
    };

    const response = await fetch(gitlabUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.status}`);
    }

    const result: GitLabResponse = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const timelogs = result.data.group.timelogs.nodes;
    hasNextPage = result.data.group.timelogs.pageInfo.hasNextPage;
    cursor = result.data.group.timelogs.pageInfo.endCursor;

    for (const timelog of timelogs) {
      const workDate = getWorkDate(timelog.spentAt);

      if (
        targetDates.includes(workDate) &&
        selectedUsers.includes(timelog.user.name)
      ) {
        const {
          timeSpent,
          summary,
          user: { name: userName },
          issue: { title: issueTitle, webUrl: issueWebUrl },
        } = timelog;

        const cleanSummary = (summary || "No description")
          .replace(/"/g, '\\"')
          .replace(/\n/g, " ");

        const humanTimeSpent = convertTime(timeSpent);

        timelogGroups[workDate].push({
          issueTitle,
          summary: cleanSummary,
          timeSpent: humanTimeSpent,
          userName,
          issueWebUrl,
        });

        if (!userTotals[userName]) {
          userTotals[userName] = 0;
        }
        userTotals[userName] += timeSpent;
      }
    }
  }

  return NextResponse.json({ timelogGroups, userTotals });
}
