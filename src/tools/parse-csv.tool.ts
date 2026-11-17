/**
 * Minimal RFC4180-ish CSV parser (comma-separated, quoted fields, CRLF/LF).
 * First non-empty row is treated as the header.
 */
export function parseCsv(text: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const records = parseCsvRecords(text);
  if (records.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = records[0].map((header) => header.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < records.length; i += 1) {
    const cells = records[i];
    const isEmpty = cells.every((cell) => cell.trim() === '');
    if (isEmpty) {
      continue;
    }
    const row: Record<string, string> = {};
    for (let c = 0; c < headers.length; c += 1) {
      const key = headers[c];
      if (!key) {
        continue;
      }
      row[key] = (cells[c] ?? '').trim();
    }
    rows.push(row);
  }

  return { headers, rows };
}

function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };

  const pushRow = () => {
    pushField();
    if (row.length > 1 || row[0] !== '' || records.length > 0) {
      records.push(row);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ',') {
      pushField();
      continue;
    }
    if (char === '\r') {
      if (next === '\n') {
        i += 1;
      }
      pushRow();
      continue;
    }
    if (char === '\n') {
      pushRow();
      continue;
    }
    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  return records;
}
