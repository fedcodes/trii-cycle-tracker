// Imports a backlog_ideas CSV export into Supabase (upsert by id).
// Usage: node scripts/import-backlog.mjs <path-to-csv>
// Re-runnable: existing rows are updated, new rows inserted, nothing is deleted.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(file) {
  try {
    for (const line of readFileSync(join(root, file), "utf8").split("\n")) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)="?([^"]*)"?$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnv(".env.local");

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/import-backlog.mjs <path-to-csv>");
  process.exit(1);
}

let url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!url) {
  console.error("Missing POSTGRES_URL. Run: npx vercel env pull .env.local --yes");
  process.exit(1);
}
url = url.replace(/([?&])sslmode=[^&]*&?/, "$1").replace(/[?&]$/, "");

// RFC-4180 parser: handles quoted fields with commas, escaped quotes and newlines.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }
  return rows;
}

const [header, ...records] = parseCsv(readFileSync(csvPath, "utf8"));
const col = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
const required = ["id", "vertical", "idea", "objective", "responsable", "countries", "impact", "effort", "status", "position"];
for (const r of required) {
  if (!(r in col)) {
    console.error(`CSV is missing required column "${r}". Found: ${header.join(", ")}`);
    process.exit(1);
  }
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

let inserted = 0;
let updated = 0;
for (const rec of records) {
  const get = (name) => (rec[col[name]] ?? "").trim();
  let countries = [];
  try {
    const parsed = JSON.parse(get("countries") || "[]");
    if (Array.isArray(parsed)) countries = parsed.map(String);
  } catch {}
  const res = await client.query(
    `insert into backlog_ideas (id, vertical, idea, objective, responsable, countries, impact, effort, status, position, created_at, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, coalesce(nullif($11,'')::timestamptz, now()), coalesce(nullif($12,'')::timestamptz, now()))
     on conflict (id) do update set
       vertical = excluded.vertical,
       idea = excluded.idea,
       objective = excluded.objective,
       responsable = excluded.responsable,
       countries = excluded.countries,
       impact = excluded.impact,
       effort = excluded.effort,
       status = excluded.status,
       position = excluded.position,
       updated_at = excluded.updated_at
     returning (xmax = 0) as inserted`,
    [
      get("id"),
      get("vertical"),
      get("idea"),
      get("objective"),
      get("responsable"),
      countries,
      get("impact"),
      get("effort"),
      get("status"),
      Number(get("position")) || 0,
      get("created_at"),
      get("updated_at"),
    ]
  );
  if (res.rows[0].inserted) inserted++;
  else updated++;
}

const { rows } = await client.query("select count(*)::int as n from backlog_ideas");
console.log(`Import complete: ${inserted} inserted, ${updated} updated · table now has ${rows[0].n} rows.`);
await client.end();
