/**
 * Pipe-delimited CSV parser and sanitizer for CHED and Registrar student lists
 */

export interface ParsedStudentRow {
  lineNumber: number;
  lastName: string;
  firstName: string;
  middleName?: string;
  school: string;
  idNumber?: string;
  rawLine: string;
}

export interface ParseError {
  lineNumber: number;
  reason: string;
  rawLine: string;
}

export interface DuplicateRecord {
  lineNumber: number;
  duplicateOfLine: number;
  key: string;
  name: string;
}

export interface ParseResult {
  validRows: ParsedStudentRow[];
  invalidRows: ParseError[];
  duplicates: DuplicateRecord[];
  totalLines: number;
  headerValid: boolean;
  headerColumns: string[];
}

/**
 * Neutralizes CSV / Excel Formula Injection:
 * If a field starts with dangerous characters (=, +, -, @, tab, return), prepend a single quote (')
 */
export function sanitizeCsvField(value: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return "'" + trimmed;
  }
  return trimmed;
}

/**
 * Parses pipe-delimited CSV text
 */
export function parsePipeDelimitedCsv(
  content: string,
  type: "CHED" | "REGISTRAR"
): ParseResult {
  const result: ParseResult = {
    validRows: [],
    invalidRows: [],
    duplicates: [],
    totalLines: 0,
    headerValid: false,
    headerColumns: [],
  };

  if (!content || typeof content !== "string") {
    result.invalidRows.push({
      lineNumber: 0,
      reason: "File content is empty",
      rawLine: "",
    });
    return result;
  }

  // Split lines respecting both CRLF and LF
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  result.totalLines = lines.length;

  if (lines.length === 0) {
    result.invalidRows.push({
      lineNumber: 0,
      reason: "No readable rows found in CSV file",
      rawLine: "",
    });
    return result;
  }

  // Parse Header (Line 1)
  const headerLine = lines[0];
  const headers = headerLine.split("|").map((h) => h.trim().toLowerCase());
  result.headerColumns = headerLine.split("|").map((h) => h.trim());

  const expectedChedHeaders = ["lastname", "firstname", "middlename", "school"];
  const expectedRegistrarHeaders = ["lastname", "firstname", "middlename", "school", "idnumber"];

  const expected = type === "CHED" ? expectedChedHeaders : expectedRegistrarHeaders;

  // Validate headers
  const isHeaderMatching =
    headers.length >= expected.length &&
    expected.every((exp, idx) => headers[idx] === exp);

  if (!isHeaderMatching) {
    result.headerValid = false;
    result.invalidRows.push({
      lineNumber: 1,
      reason: `Invalid header row. Expected delimiter '|' and headers: ${
        type === "CHED"
          ? "lastName|firstName|middleName|School"
          : "lastName|firstName|middleName|School|IDnumber"
      }. Found: "${headerLine}"`,
      rawLine: headerLine,
    });
    return result;
  }

  result.headerValid = true;

  // Track duplicates within file by normalized key: lastname|firstname|middlename|school
  const seenKeys = new Map<string, number>();

  // Process data lines (start at line 2)
  for (let idx = 1; idx < lines.length; idx++) {
    const lineNumber = idx + 1;
    const rawLine = lines[idx];

    // Split strictly by pipe '|'
    const parts = rawLine.split("|");

    if (type === "CHED" && parts.length < 4) {
      result.invalidRows.push({
        lineNumber,
        reason: `Wrong column count. Expected 4 columns separated by '|' (lastName|firstName|middleName|School), but got ${parts.length}`,
        rawLine,
      });
      continue;
    }

    if (type === "REGISTRAR" && parts.length < 5) {
      result.invalidRows.push({
        lineNumber,
        reason: `Wrong column count. Expected 5 columns separated by '|' (lastName|firstName|middleName|School|IDnumber), but got ${parts.length}`,
        rawLine,
      });
      continue;
    }

    const lastName = sanitizeCsvField(parts[0]);
    const firstName = sanitizeCsvField(parts[1]);
    const middleName = sanitizeCsvField(parts[2]);
    const school = sanitizeCsvField(parts[3]);
    const idNumber = type === "REGISTRAR" ? sanitizeCsvField(parts[4]) : undefined;

    // Check mandatory fields
    if (!lastName) {
      result.invalidRows.push({
        lineNumber,
        reason: "Missing required field: lastName is empty",
        rawLine,
      });
      continue;
    }

    if (!firstName) {
      result.invalidRows.push({
        lineNumber,
        reason: "Missing required field: firstName is empty",
        rawLine,
      });
      continue;
    }

    if (!school) {
      result.invalidRows.push({
        lineNumber,
        reason: "Missing required field: School is empty",
        rawLine,
      });
      continue;
    }

    if (type === "REGISTRAR" && !idNumber) {
      result.invalidRows.push({
        lineNumber,
        reason: "Missing required field: IDnumber is empty for Registrar record",
        rawLine,
      });
      continue;
    }

    // Build deduplication key
    const dedupKey = `${lastName.toLowerCase()}|${firstName.toLowerCase()}|${(middleName || "").toLowerCase()}|${school.toLowerCase()}`;
    if (seenKeys.has(dedupKey)) {
      const originalLine = seenKeys.get(dedupKey)!;
      result.duplicates.push({
        lineNumber,
        duplicateOfLine: originalLine,
        key: dedupKey,
        name: `${lastName}, ${firstName} ${middleName || ""}`.trim(),
      });
    } else {
      seenKeys.set(dedupKey, lineNumber);
    }

    result.validRows.push({
      lineNumber,
      lastName,
      firstName,
      middleName: middleName || undefined,
      school,
      idNumber,
      rawLine,
    });
  }

  return result;
}

