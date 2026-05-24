/**
 * Google Sheets write endpoint for the classroom dashboard.
 *
 * Setup:
 * 1. Open the target spreadsheet.
 * 2. Extensions > Apps Script.
 * 3. Paste this file.
 * 4. Project Settings > Script properties:
 *    WRITE_SECRET = any long random string
 * 5. Deploy > New deployment > Web app:
 *    Execute as: Me
 *    Who has access: Anyone with the link
 * 6. Copy the Web app URL into GOOGLE_SHEETS_WRITE_WEB_APP_URL.
 */

const SPREADSHEET_ID = "1E-L-1WfHiqmFey0oPwmSjaRvljAsiFbQk9japkGQ7eI";

const SHEET_HEADERS = {
  courses: [
    "course_id",
    "category",
    "course_name",
    "round_no",
    "start_date",
    "end_date",
    "total_hours",
    "tuition_fee",
    "self_payment",
    "current_students",
    "course_status",
    "source_pdf",
    "memo",
  ],
  schedules: [
    "schedule_id",
    "course_id",
    "room_id",
    "instructor_id",
    "start_date",
    "end_date",
    "days_of_week",
    "start_time",
    "end_time",
    "schedule_type",
    "status",
    "memo",
    "source_pdf",
  ],
};

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function cleanCell(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\t|\r?\n/g, " ").trim();
}

function readPayload(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("요청 내용이 비어 있습니다.");
  }
  return JSON.parse(e.postData.contents);
}

function assertSecret(payload) {
  const expected = PropertiesService.getScriptProperties().getProperty("WRITE_SECRET");
  if (!expected) throw new Error("Apps Script WRITE_SECRET이 설정되지 않았습니다.");
  if (!payload || payload.secret !== expected) throw new Error("저장 권한이 없습니다.");
}

function getSheet(name) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
  if (!sheet) throw new Error(`시트 탭을 찾을 수 없습니다: ${name}`);
  return sheet;
}

function getHeaderMap(sheet) {
  const lastColumn = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(cleanCell);
  return headers.reduce((map, header, index) => {
    map[header] = index;
    return map;
  }, {});
}

function rowFromObject(row, headers) {
  return headers.map((header) => cleanCell(row && row[header]));
}

function findRowById(sheet, headerMap, idHeader, idValue) {
  const idColumnIndex = headerMap[idHeader];
  if (idColumnIndex === undefined) throw new Error(`${sheet.getName()} 시트에 ${idHeader} 컬럼이 없습니다.`);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const values = sheet.getRange(2, idColumnIndex + 1, lastRow - 1, 1).getValues();
  const target = cleanCell(idValue);
  const offset = values.findIndex((item) => cleanCell(item[0]) === target);
  return offset === -1 ? -1 : offset + 2;
}

function upsertRow(sheetName, idHeader, row) {
  const sheet = getSheet(sheetName);
  const headerMap = getHeaderMap(sheet);
  const expectedHeaders = SHEET_HEADERS[sheetName];
  const values = rowFromObject(row, expectedHeaders);
  const targetRow = findRowById(sheet, headerMap, idHeader, row[idHeader]);

  if (targetRow === -1) {
    sheet.appendRow(values);
    return { sheet: sheetName, action: "append", row: sheet.getLastRow(), id: row[idHeader] };
  }

  const rangeValues = new Array(sheet.getLastColumn()).fill("");
  expectedHeaders.forEach((header, index) => {
    const columnIndex = headerMap[header];
    if (columnIndex !== undefined) rangeValues[columnIndex] = values[index];
  });
  sheet.getRange(targetRow, 1, 1, rangeValues.length).setValues([rangeValues]);
  return { sheet: sheetName, action: "update", row: targetRow, id: row[idHeader] };
}

function doPost(e) {
  try {
    const payload = readPayload(e);
    assertSecret(payload);

    if (payload.action !== "saveDraft") {
      throw new Error("지원하지 않는 저장 요청입니다.");
    }
    if (!payload.schedule) {
      throw new Error("저장할 시간표 데이터가 없습니다.");
    }

    const writes = [];
    if (payload.mode === "newCourse" && payload.course) {
      writes.push(upsertRow("courses", "course_id", payload.course));
    }
    writes.push(upsertRow("schedules", "schedule_id", payload.schedule));

    SpreadsheetApp.flush();
    return jsonResponse({ ok: true, writes, savedAt: new Date().toISOString() });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) });
  }
}

function doGet() {
  return jsonResponse({ ok: true, message: "Classroom dashboard write endpoint is ready." });
}
