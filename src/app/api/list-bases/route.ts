import { NextRequest, NextResponse } from 'next/server';

interface AirtableBase {
  id: string;
  name: string;
  permissionLevel: string;
}

interface AirtableBasesResponse {
  bases: AirtableBase[];
  offset?: string;
}

export async function GET(request: NextRequest) {
  try {
    const personalAccessToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;

    if (!personalAccessToken) {
      return NextResponse.json(
        { error: 'Airtable Personal Access Token is missing' },
        { status: 500 }
      );
    }

    console.log('Testing token:', personalAccessToken.substring(0, 15) + '...');

    const response = await fetch(
      'https://api.airtable.com/v0/meta/bases',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${personalAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Airtable API error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      return NextResponse.json(
        { 
          error: 'Failed to fetch bases from Airtable',
          status: response.status,
          statusText: response.statusText,
          details: errorData,
          tokenPrefix: personalAccessToken.substring(0, 15) + '...',
          tokenLength: personalAccessToken.length
        },
        { status: response.status }
      );
    }

    const data: AirtableBasesResponse = await response.json();

    const targetBaseId = process.env.AIRTABLE_BASE_ID;
    const targetBase = data.bases.find(base => base.id === targetBaseId);

    return NextResponse.json({
      success: true,
      message: `Found ${data.bases.length} accessible base(s)`,
      totalBases: data.bases.length,
      bases: data.bases.map(base => ({
        id: base.id,
        name: base.name,
        permissionLevel: base.permissionLevel,
        isTargetBase: base.id === targetBaseId
      })),
      targetBaseId,
      targetBaseFound: !!targetBase,
      targetBaseName: targetBase?.name || 'Not found',
      tokenInfo: {
        prefix: personalAccessToken.substring(0, 15) + '...',
        length: personalAccessToken.length,
        startsWithPat: personalAccessToken.startsWith('pat')
      }
    });

  } catch (error) {
    console.error('List bases error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 