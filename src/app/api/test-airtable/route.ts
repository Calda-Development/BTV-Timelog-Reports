import { NextRequest, NextResponse } from 'next/server';

interface AirtableField {
  id: string;
  name: string;
  type: string;
}

interface AirtableTable {
  id: string;
  name: string;
  description?: string;
  fields: AirtableField[];
}

interface AirtableMetadataResponse {
  tables: AirtableTable[];
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime: string;
}

interface AirtableRecordsResponse {
  records: AirtableRecord[];
  offset?: string;
}

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

    console.log('Testing Airtable connection...');
    console.log('Base ID:', baseId);
    console.log('Token starts with:', personalAccessToken.substring(0, 10) + '...');

    const metadataResponse = await fetch(
      `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${personalAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!metadataResponse.ok) {
      const errorData = await metadataResponse.json();
      console.error('Airtable metadata API error:', errorData);
      return NextResponse.json(
        { 
          error: 'Failed to fetch Airtable metadata', 
          details: errorData,
          status: metadataResponse.status,
          baseId,
        },
        { status: metadataResponse.status }
      );
    }

    const metadata: AirtableMetadataResponse = await metadataResponse.json();

    const tablesInfo = metadata.tables.map((table: AirtableTable) => ({
      id: table.id,
      name: table.name,
      description: table.description || 'No description',
      fields: table.fields.map((field: AirtableField) => ({
        id: field.id,
        name: field.name,
        type: field.type,
      })),
    }));

    return NextResponse.json({
      success: true,
      baseId,
      tablesCount: metadata.tables.length,
      tables: tablesInfo,
      message: 'Airtable connection successful! 🎉'
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tableName } = await request.json();

    const personalAccessToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!personalAccessToken || !baseId) {
      return NextResponse.json(
        { error: 'Airtable configuration missing' },
        { status: 500 }
      );
    }

    if (!tableName) {
      return NextResponse.json(
        { error: 'Table name is required' },
        { status: 400 }
      );
    }

    console.log('Testing table access for:', tableName);

    const recordsResponse = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=3`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${personalAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!recordsResponse.ok) {
      const errorData = await recordsResponse.json();
      console.error('Airtable records API error:', errorData);
      return NextResponse.json(
        { 
          error: 'Failed to fetch table records', 
          details: errorData,
          tableName,
        },
        { status: recordsResponse.status }
      );
    }

    const recordsData: AirtableRecordsResponse = await recordsResponse.json();

    return NextResponse.json({
      success: true,
      tableName,
      recordsCount: recordsData.records.length,
      sampleRecords: recordsData.records.map((record: AirtableRecord) => ({
        id: record.id,
        fields: record.fields,
      })),
      message: `Successfully fetched data from table "${tableName}" 📊`
    });

  } catch (error) {
    console.error('Table test error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 