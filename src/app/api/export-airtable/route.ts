import { NextRequest, NextResponse } from 'next/server';
import { TimelogData, TimelogEntry } from '@/lib/types';

interface AirtableRecord {
  fields: {
    'Team Member': string;
    'Project': string;
    'Project Tasks': string;
    'Start Time': string;
    'End Time': string;
    'Notes': string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { timelogData, selectedUser, confirmedBy } = await request.json();

    if (!timelogData || !selectedUser || !confirmedBy) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    const personalAccessToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME;

    if (!personalAccessToken || !baseId || !tableName) {
      return NextResponse.json(
        { error: 'Airtable configuration missing' },
        { status: 500 }
      );
    }

    const records = transformTimelogToAirtable(timelogData, selectedUser);

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'No records found for the selected user' },
        { status: 400 }
      );
    }

    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${personalAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records }),
      }
    );

    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.json();
      console.error('Airtable API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to export to Airtable', details: errorData },
        { status: airtableResponse.status }
      );
    }

    const result = await airtableResponse.json();

    return NextResponse.json({
      success: true,
      message: `Successfully exported ${records.length} records to Airtable`,
      recordsCreated: result.records?.length || 0,
      confirmedBy,
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function transformTimelogToAirtable(timelogData: TimelogData, selectedUser: string): AirtableRecord[] {
  const records: AirtableRecord[] = [];
  
  Object.entries(timelogData.timelogGroups).forEach(([date, entries]) => {
    entries
      .filter(entry => entry.userName === selectedUser)
      .forEach(entry => {
        records.push({
          fields: {
            'Team Member': entry.userName,
            'Project': extractProjectFromIssue(entry.issueTitle),
            'Project Tasks': entry.issueTitle,
            'Start Time': formatDateTime(date, '09:00'),
            'End Time': formatDateTime(date, '17:00'),
            'Notes': `${entry.summary}\n\nTime Spent: ${entry.timeSpent}\nIssue: ${entry.issueWebUrl}`,
          },
        });
      });
  });

  return records;
}

function extractProjectFromIssue(issueTitle: string): string {
  const projectMatch = issueTitle.match(/^([A-Z]+[-_][A-Z0-9]+)/);
  return projectMatch ? projectMatch[1] : 'General';
}

function formatDateTime(date: string, time: string): string {
  return `${date}T${time}:00.000Z`;
} 