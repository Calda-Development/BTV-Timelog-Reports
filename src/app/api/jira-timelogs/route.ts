import { NextRequest, NextResponse } from "next/server";
import { TimelogEntry } from "@/lib/types";

interface JiraWorklogEntry {
  id: string;
  timeSpentSeconds: number;
  comment: string;
  started: string;
  author: {
    displayName: string;
    emailAddress: string;
  };
  issue: {
    id: string;
    key: string;
    summary: string;
    self: string;
  };
}

interface JiraWorklogResponse {
  worklogs: JiraWorklogEntry[];
  total: number;
  maxResults: number;
  startAt: number;
}

function getWorkDate(started: string): string {
  const date = new Date(started);
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

async function fetchJiraWorklogs(
  jiraUrl: string,
  email: string,
  accessToken: string,
  targetDates: string[],
  selectedUsers: string[]
): Promise<{
  timelogGroups: Record<string, TimelogEntry[]>;
  userTotals: Record<string, number>;
}> {
  const timelogGroups: Record<string, TimelogEntry[]> = {};
  const userTotals: Record<string, number> = {};

  targetDates.forEach((date: string) => {
    timelogGroups[date] = [];
  });

  const auth = Buffer.from(`${email}:${accessToken}`).toString("base64");

  for (const date of targetDates) {
    const startDate = `${date}T00:00:00.000+0000`;
    const endDate = `${date}T23:59:59.999+0000`;

    let startAt = 0;
    const maxResults = 1000;
    let hasMore = true;

    while (hasMore) {
      const url = `${jiraUrl}/rest/api/3/worklog/updated?since=${startDate}&until=${endDate}&startAt=${startAt}&maxResults=${maxResults}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Jira API error: ${response.status} ${response.statusText}`
        );
      }

      const result: JiraWorklogResponse = await response.json();

      for (const worklog of result.worklogs) {
        const workDate = getWorkDate(worklog.started);

        if (
          targetDates.includes(workDate) &&
          selectedUsers.includes(worklog.author.displayName)
        ) {
          const {
            timeSpentSeconds,
            comment,
            author: { displayName: userName },
            issue: { key: issueKey, summary: issueTitle, self: issueSelf },
          } = worklog;

          const cleanComment = (comment || "No description")
            .replace(/"/g, '\\"')
            .replace(/\n/g, " ");

          const humanTimeSpent = convertTime(timeSpentSeconds);
          const issueWebUrl = issueSelf.replace(
            "/rest/api/3/issue/",
            "/browse/"
          );

          timelogGroups[workDate].push({
            issueTitle: `${issueKey}: ${issueTitle}`,
            summary: cleanComment,
            timeSpent: humanTimeSpent,
            userName,
            issueWebUrl,
          });

          if (!userTotals[userName]) {
            userTotals[userName] = 0;
          }
          userTotals[userName] += timeSpentSeconds;
        }
      }

      hasMore = result.worklogs.length === maxResults;
      startAt += maxResults;
    }
  }

  return { timelogGroups, userTotals };
}

export async function POST(request: NextRequest) {
  try {
    const { targetDates, selectedUsers } = await request.json();

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

    const { timelogGroups, userTotals } = await fetchJiraWorklogs(
      jiraUrl,
      email,
      accessToken,
      targetDates,
      selectedUsers
    );

    return NextResponse.json({ timelogGroups, userTotals });
  } catch (error) {
    console.error("Error fetching Jira data:", error);
    return NextResponse.json(
      { error: "Failed to fetch Jira data" },
      { status: 500 }
    );
  }
}

