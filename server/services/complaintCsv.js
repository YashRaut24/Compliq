const { parse } = require("csv-parse/sync");

const REQUIRED_HEADERS = ["businessId", "message", "source"];
const MAX_ROWS = 10;

function parseComplaintCsv(buffer) {
  const records = parse(buffer, {
    bom: true,
    skip_empty_lines: true,
    trim: true,
    max_record_size: 10000,
  });

  if (records.length < 2) {
    throw new Error("CSV must contain headers and at least one complaint");
  }

  const [headers, ...rows] = records;

  if (
    headers.length !== REQUIRED_HEADERS.length ||
    new Set(headers).size !== REQUIRED_HEADERS.length ||
    !REQUIRED_HEADERS.every((header) => headers.includes(header))
  ) {
    throw new Error(
      `CSV headers must be exactly: ${REQUIRED_HEADERS.join(",")}`
    );
  }

  if (rows.length > MAX_ROWS) {
    throw new Error(`CSV cannot contain more than ${MAX_ROWS} complaints`);
  }

  return rows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index]]))
  );
}

module.exports = { parseComplaintCsv };