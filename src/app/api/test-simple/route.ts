import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const personalAccessToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!personalAccessToken || !baseId) {
      return NextResponse.json(
        { error: 'Airtable configuration missing' },
        { status: 500 }
      );
    }

    const commonTableNames = [
      'tblgKk1JD3RRJCkiT',
      'tasks time log',
      'Tasks',
      'Time Log',
      'Team Time Log', 
      'Task Time Log',
      'Time Tracking',
      'Timelogs',
      'Table 1',
      'Main Table'
    ];

    const results = [];

    for (const tableName of commonTableNames) {
      try {
        console.log(`Testing table: ${tableName}`);
        
        const response = await fetch(
          `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=1`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${personalAccessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const sampleRecord = data.records[0];
          
          results.push({
            tableName,
            status: 'success',
            recordCount: data.records.length,
            fields: sampleRecord ? Object.keys(sampleRecord.fields) : [],
            sampleData: sampleRecord?.fields || {}
          });
        } else {
          results.push({
            tableName,
            status: 'not_found',
            error: response.status
          });
        }
      } catch (error) {
        results.push({
          tableName,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successfulTables = results.filter(r => r.status === 'success');

    return NextResponse.json({
      success: true,
      baseId,
      message: `Found ${successfulTables.length} accessible tables`,
      results,
      successfulTables: successfulTables.map(t => ({
        name: t.tableName,
        fields: t.fields
      }))
    });

  } catch (error) {
    console.error('Simple test error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 