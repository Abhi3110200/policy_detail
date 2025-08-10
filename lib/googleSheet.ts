import { google } from "googleapis";

interface SheetRowData {
  [key: string]: string | number | boolean | null | undefined;
}

export async function addRowToSheet(rowData: SheetRowData) {
  try {
    if (!rowData || typeof rowData !== "object" || Object.keys(rowData).length === 0) {
      throw new Error("rowData is empty or invalid");
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // Convert escaped \n to real newlines
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID is missing in env");

    const sheetName = "Sheet1";

    // 1️⃣ Get existing headers from first row
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!1:1`,
    });
    let headers: string[] = headerRes.data.values?.[0] || [];

    // 2️⃣ If no headers exist, create them and add the first row immediately
    if (headers.length === 0) {
      const keys = Object.keys(rowData);

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!1:1`,
        valueInputOption: "RAW",
        requestBody: { values: [keys] },
      });

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: sheetName,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [keys.map(k => rowData[k] ?? "")] },
      });

      console.log("✅ Created headers and inserted first row");
      return { success: true };
    }

    // 3️⃣ Normalize headers (trim spaces to avoid mismatch issues)
    headers = headers.map(h => h.trim());

    // 4️⃣ Map rowData to header order; fill in blanks for missing columns
    const rowValues = headers.map(header => rowData[header] ?? "");

    // 5️⃣ Check if row has at least one non-empty value
    if (rowValues.every(value => value === "")) {
      throw new Error("All values are empty — not appending blank row");
    }

    // 6️⃣ Append the row
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetName,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [rowValues] },
    });

    console.log("✅ Row appended to Google Sheet");
    return { success: true };
  } catch (error) {
    console.error("❌ Error adding row to Google Sheet:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
