/**
 * GOOGLE APPS SCRIPT WEB APP FOR AUTOMATED EXCEL / GOOGLE SHEETS SUBSCRIBER SYNC
 * 
 * Instructions:
 * 1. Open Google Sheets (https://sheets.new) and name the spreadsheet "IPO Subscribers".
 * 2. In row 1, set headers: Email Address | Name | Subscribed Date | Status | Source
 * 3. In Google Sheets menu, click: Extensions -> Apps Script
 * 4. Replace any existing code with this script.
 * 5. Click "Deploy" -> "New deployment".
 * 6. Select type: "Web app".
 * 7. Set:
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 8. Click "Deploy", copy the Web App URL (ends with /exec).
 * 9. Paste that URL into website or localStorage('ipo_subscriber_webhook_url').
 * 
 * Result:
 * - Every subscriber email automatically appears in this Sheet / Excel.
 * - If the email is a duplicate, it is REJECTED and marked duplicate.
 * - Duplicates will NOT be stored.
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = {};
    
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else {
      data = e.parameter || {};
    }
    
    var email = (data.email || "").toString().trim().toLowerCase();
    var name = (data.name || "").toString().trim();
    var source = (data.source || "IPO Pricealerter Website").toString().trim();
    var dateStr = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
    
    if (!email) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Email address is required."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // STRICT DUPLICATE CHECK
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    
    // Check if email already exists in Column A (Row 2 onwards)
    for (var i = 1; i < values.length; i++) {
      var existingEmail = (values[i][0] || "").toString().trim().toLowerCase();
      if (existingEmail === email) {
        // DUPLICATE DETECTED: Reject & do not store
        return ContentService.createTextOutput(JSON.stringify({
          status: "duplicate",
          duplicate: true,
          message: "⚠️ Duplicate email! '" + email + "' is already subscribed. Rejected from storage."
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // UNIQUE SUBSCRIBER: Append row to Excel sheet
    sheet.appendRow([email, name, dateStr, "Active", source]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      duplicate: false,
      message: "✓ Successfully added to Excel subscriber database!"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "IPO Pricealerter Automated Excel Subscriber Webhook"
  })).setMimeType(ContentService.MimeType.JSON);
}
