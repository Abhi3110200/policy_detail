import { NextResponse } from 'next/server';
import { addRowToSheet } from '@/lib/googleSheet';

export async function POST(request: Request) {
  console.log('Received request to /api/submit-policy');
  
  try {
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    const requiredFields = ['companyName', 'lobDescription', 'type', 'policyNo', 'insuredName'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Add submittedAt to the data before passing to addRowToSheet
    const dataToSave = {
      ...body,
      submittedAt: new Date().toISOString(), // Add current timestamp
    };
    console.log('Data to save:', JSON.stringify(dataToSave, null, 2));

    // Add data to Google Sheet
    console.log('Attempting to add row to Google Sheet...');
    const result = await addRowToSheet(dataToSave);
    console.log('Successfully added row to Google Sheet:', result);

    return NextResponse.json({
      success: true,
      message: 'Policy data saved successfully to Google Sheet',
      data: result
    });

  } catch (error) { // Use 'any' for error type for broader catch
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save data to Google Sheet',
        // details: error?.message || 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}
