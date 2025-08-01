import { NextRequest, NextResponse } from 'next/server';
import { TimelogEntry } from '@/lib/types';

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
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function convertTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const { targetDates } = await request.json();

    const gitlabUrl = process.env.GITLAB_API_URL;
    const accessToken = process.env.GITLAB_ACCESS_TOKEN;

    if (!gitlabUrl || !accessToken) {
      return NextResponse.json(
        { error: 'GitLab configuration not found. Please check environment variables GITLAB_API_URL and GITLAB_ACCESS_TOKEN.' },
        { status: 500 }
      );
    }

    if (!targetDates || !Array.isArray(targetDates)) {
      return NextResponse.json(
        { error: 'Missing or invalid targetDates parameter' },
        { status: 400 }
      );
    }

    let cursor = '';
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
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
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

        if (targetDates.includes(workDate)) {
          const {
            timeSpent,
            summary,
            user: { name: userName },
            issue: { title: issueTitle, webUrl: issueWebUrl },
          } = timelog;

          const cleanSummary = (summary || 'No description')
            .replace(/"/g, '\\"')
            .replace(/\n/g, ' ');

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
  } catch (error) {
    console.error('Error fetching GitLab data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitLab data' },
      { status: 500 }
    );
  }
} 