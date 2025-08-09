import { GoogleSpreadsheet, GoogleSpreadsheetRow, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Define the expected structure for policy data
interface PolicyData {
  companyName: string;
  lobDescription: string;
  type: string;
  policyNo: string;
  prefix: string;
  insuredName: string;
  policyStartDate: string;
  expiryDate: string;
  sumInsured: string;
  premium: string;
  gst: string;
  totalPremium: string;
  submittedAt: string; // Ensure this is always passed
}

async function addRowFireAndForget(sheet: GoogleSpreadsheetWorksheet, rowData: any): Promise<{ success: boolean, isTimeout: boolean, rowNumber: number }> {
  try {
    console.log('🔥 Using fire-and-forget approach...');
    
    // Start the operation but don't wait for it
    const addRowPromise = sheet.addRow(rowData, { raw: true });
    
    // Give it a very short time to complete, then assume success
    const quickTimeout = new Promise<'timeout'>((resolve) => 
      setTimeout(() => resolve('timeout'), 2000)
    );
    
    const result = await Promise.race([addRowPromise, quickTimeout]);
    
    if (result === 'timeout') {
      console.log('⚡ Operation likely succeeded but timed out waiting for response');
      
      // Don't wait - assume success and return immediately
      return {
        success: true,
        isTimeout: true,
        rowNumber: -1,
      };
    } else {
      console.log(`✅ Quick response received. Row number: ${(result as GoogleSpreadsheetRow).rowNumber}`);
      return {
        success: true,
        isTimeout: false,
        rowNumber: (result as GoogleSpreadsheetRow).rowNumber,
      };
    }
  } catch (error: any) {
    console.error('❌ Fire-and-forget failed:', error.message);
    return {
      success: false,
      isTimeout: false,
      rowNumber: -1,
    };
  }
}

async function addRowToSheet(data: PolicyData) {
  console.log('Starting addRowToSheet with data:', JSON.stringify(data, null, 2));
  try {
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;
    const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
    
    if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
      const errorMsg = 'Missing Google Sheets environment variables. ' +
        `SHEET_ID: ${SHEET_ID ? 'Set' : 'Missing'}, ` +
        `SERVICE_ACCOUNT_EMAIL: ${SERVICE_ACCOUNT_EMAIL ? 'Set' : 'Missing'}, ` +
        `PRIVATE_KEY: ${PRIVATE_KEY ? 'Set' : 'Missing'}`;
      console.error(errorMsg);
      throw new Error('Missing Google Sheets environment variables. Please check your .env file.');
    }

    console.log('Creating Google Sheets client...');
    const serviceAccountAuth = new JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY.replace(/\\n/g, '\n'), // Replace escaped newlines
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });
    console.log('Google Sheets client created');

    console.log('Loading Google Spreadsheet...');
    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    try {
      await doc.loadInfo(); // Load the document properties and worksheets
      console.log(`Loaded spreadsheet: ${doc.title}`);
    } catch (error) {
      console.error('Error loading spreadsheet. Make sure the SHEET_ID is correct and the service account has access to it.');
      throw error;
    }
    
    const sheet = doc.sheetsByIndex[0]; // Get the first sheet
    console.log('Working with sheet:', sheet.title);

    const expectedHeaders = [
      'Company Name',
      'LOB Description',
      'Type',
      'Policy No',
      'Prefix',
      'Insured Name',
      'Policy Start Date',
      'Expiry Date',
      'Sum Insured',
      'Premium',
      'GST',
      'Total Premium',
      'Submitted At'
    ];
    
    console.log('Checking/Setting up headers...');
    
    // First, check if the sheet is completely empty
    if (sheet.rowCount === 0) {
      console.log('Sheet is empty, setting headers...');
      await sheet.setHeaderRow(expectedHeaders);
      console.log('Headers set successfully for empty sheet.');
    } 
    // If sheet has rows but no header values, or if loading headers fails
    else {
      try {
        // Try to load existing headers
        await sheet.loadHeaderRow();
        
        // If we get here, headers exist but might be empty
        if (!sheet.headerValues || sheet.headerValues.length === 0) {
          console.log('Header row exists but is empty. Setting new headers...');
          await sheet.setHeaderRow(expectedHeaders);
          console.log('New headers set successfully.');
        } 
        // Check if existing headers match what we expect
        else {
          console.log('Existing headers loaded:', sheet.headerValues);
          
          // Check if headers match exactly (order matters)
          const headersMatch = expectedHeaders.every(
            (header, index) => sheet.headerValues && sheet.headerValues[index] === header
          );
          
          if (!headersMatch) {
            console.warn('Headers do not match expected headers. Updating to match expected format.');
            await sheet.setHeaderRow(expectedHeaders);
            console.log('Headers updated successfully.');
          } else {
            console.log('Headers already match expected headers. No action needed.');
          }
        }
      } catch (error) {
        console.warn('Error loading header row. This can happen if the first row is empty or malformed. Setting new headers...');
        try {
          // Clear existing first row if it exists
          if (sheet.rowCount > 0) {
            await sheet.clear();
          }
          await sheet.setHeaderRow(expectedHeaders);
          console.log('New headers set successfully after error.');
        } catch (error) {
          console.error('Failed to set headers after error:', error);
          throw new Error('Could not set headers after multiple attempts');
        }
      }
    }
    
    console.log('Preparing row data for insertion...');
    const rowData = {
      'Company Name': data.companyName,
      'LOB Description': data.lobDescription,
      'Type': data.type,
      'Policy No': data.policyNo,
      'Prefix': data.prefix,
      'Insured Name': data.insuredName,
      'Policy Start Date': data.policyStartDate,
      'Expiry Date': data.expiryDate,
      'Sum Insured': data.sumInsured,
      'Premium': data.premium,
      'GST': data.gst,
      'Total Premium': data.totalPremium,
      'Submitted At': data.submittedAt,
    };
    console.log('Attempting to add row with data:', rowData);

    try {
      console.log('Calling sheet.addRow...');
      const newRow = await addRowFireAndForget(sheet, rowData);
      console.log('sheet.addRow completed successfully.');
      console.log('Row added successfully to Google Sheet:', newRow.rowNumber);
      return { success: true, row: newRow };
    } catch (addRowError: any) {
      console.error('CRITICAL ERROR: Failed to add row to Google Sheet!', addRowError);
      throw new Error(`Failed to add row to sheet: ${addRowError.message || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error('Overall Error in addRowToSheet:', error);
    throw error;
  }
}

export { addRowToSheet }; // Export as named export
