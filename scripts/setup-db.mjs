// Applies supabase/schema.sql and seeds the active cycle data.
// Usage: npm run db:setup  (reads POSTGRES_URL_NON_POOLING / POSTGRES_URL from .env.local)
// Re-runnable: schema is idempotent; seed is skipped if a cycle already exists.

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

let url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!url) {
  console.error("Missing POSTGRES_URL. Run: npx vercel env pull .env.local --yes");
  process.exit(1);
}
// Supabase uses a cert that node's pg rejects when sslmode is in the URL;
// strip it and configure ssl explicitly.
url = url.replace(/([?&])sslmode=[^&]*&?/, "$1").replace(/[?&]$/, "");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

console.log("Applying schema…");
await client.query(readFileSync(join(root, "supabase/schema.sql"), "utf8"));

const { rows } = await client.query("select id from cycles limit 1");
if (rows.length) {
  console.log("Cycles already exist — skipping seed.");
  await client.end();
  process.exit(0);
}

console.log("Seeding Ciclo 3 — 2026…");

const cycle = (
  await client.query(
    `insert into cycles (name, start_date, end_date, cooldown_start, cooldown_end, total_weeks, is_active)
     values ('Ciclo 3 — 2026', '2026-05-11', '2026-06-19', '2026-06-22', '2026-07-03', 6, true)
     returning id`
  )
).rows[0];

const BETS = [
  ["Stop loss / Take Profit Colombia", 1, "Obj. 1 — Escalar trii pro", ["JR", "AV"], "Listo", 1, 3, 1, "Dev cerrado · en testing · lanza en release 3.6. JR rota a Modificación de órdenes."],
  ["Modificación de órdenes", 1, "Obj. 1 — Escalar trii pro", ["JR", "SB"], "On track", 3, 5, 0.15, "JR rota antes (arranca FE en S3 al cerrar Stop Loss); SB arranca BE en S3."],
  ["Alertas en Web", 1, "Obj. 1 — Escalar trii pro", ["JR"], "Not started", 6, 6, 0, "Última bet del ciclo para JR."],
  ["High Yield Cash US Stocks", 1, "Obj. 1 — Escalar trii pro", ["ET", "LP"], "Not started", 4, 6, 0, "Lucas se une al equipo en S4 (3.0/6.0w)."],
  ["Creación de usuarios CO en Alpaca", 2, "Obj. 2 — US Stocks CO & PE", ["ET", "KA"], "On track", 1, 3, 0.6, "Reto API AyV resuelto. Lanza en versión 3.4.3 esta semana (Vinculación Completa)."],
  ["Cambios Colombia", 2, "Obj. 2 — US Stocks CO & PE", ["GM"], "On track", 1, 3, 0.6, "Reto API AyV resuelto. Lanza en versión 3.4.3 esta semana."],
  ["API de cambios Accival", 2, "Obj. 2 — US Stocks CO & PE", ["SB"], "Not started", 5, 6, 0, "Backend BE-only."],
  ["Retiros Inmediatos Chile", 3, "Obj. 3 — Chile", ["KA"], "Not started", 4, 5, 0, "Re-entra al ciclo tras descarte en C2 S4."],
  ["Julio 2.0", 4, "Obj. 4 — Experiencia CX", ["GM"], "Not started", 4, 6, 0, "Mejoras Agente CX — pitch convertido en bet."],
  ["Mejoras onboarding en Blum", 5, "Obj. 5 — Fondos Perú", ["CA", "SB"], "Listo", 1, 3, 1, "Testing completado la semana pasada · lanza en release 3.6."],
  ["Mejoras diseño depósito y retiros fondos", 5, "Obj. 5 — Fondos Perú", ["CA"], "Not started", 4, 6, 0, "Rediseño 3 países."],
  ["Fix 5.0 Chile", 99, "Regulatorio", ["AV"], "Not started", 3, 6, 0, "BIG · 4 sem. Alan arranca en S3 al cerrar Take Profit."],
  ["Implementación de diseño", 2, "Obj. 2 — US Stocks CO & PE", ["DC"], "Listo", 1, 1, 1, "Cerrado en S1."],
  ["Librería de componentes", 98, "Arquitectura", ["DC"], "Not started", 2, 4, 0, "BIG · 3 sem."],
  ["Reemplazar imágenes", 98, "Arquitectura", ["DC"], "Not started", 5, 6, 0, "Cierre de arquitectura."],
];

for (let i = 0; i < BETS.length; i++) {
  const [name, objNum, obj, team, status, ws, we, progress, lastUpdate] = BETS[i];
  await client.query(
    `insert into bets (cycle_id, name, objective_num, objective, team, status, week_start, week_end, progress, last_update, position)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [cycle.id, name, objNum, obj, team, status, ws, we, progress, lastUpdate, i]
  );
}

const WEEKLY_LOG = [
  [3, [
    "Stop loss / Take Profit Colombia (JR · AV): dev cerrado · pasa a testing · lanza en versión 3.6. JR rota a Modificación de órdenes (FE arranca en S3).",
    "Mejoras onboarding Blum (CA · SB): testing completado la semana pasada · lanza también en versión 3.6.",
    "Vinculación Completa / US Stocks CO: retos con la API de Acciones y Valores resueltos (testeando desde May 25). Lanza en versión 3.4.3 esta semana junto con correcciones del app. Alpaca CO y Cambios CO vuelven a On track.",
    "Modificación de órdenes (JR · SB): arranca on track con JR (FE) y SB (BE) activos en S3.",
    "Discovery: diseño de High Yield Cash US cerrándose (Figma agregado). Mejoras en movimientos de fondos sigue en Design. Regalar Acciones pasa de Backlog a Design.",
  ]],
  [2, [
    "Mejoras onboarding Blum (CA · SB): testing arrancó May 19. Si todo sale bien, lanzamos la próxima semana — bet podría cerrar antes de tiempo.",
    "Stop loss / Take Profit Colombia (JR · AV): Alan y Jorge trabajando — bet on track.",
    "Creación de usuarios CO en Alpaca (ET · KA) y Cambios Colombia (GM): ambas en Update. El equipo Obj. 2 se enfocó en empujar Vinculación Completa (certificación AyV jueves May 21). Esta semana recuperamos el tiempo perdido.",
    "Vinculación Completa: certificación con AyV el jueves May 21 — go-live previsto inmediatamente después.",
  ]],
  [1, [
    "Inicio del Ciclo 3. 15 bets en mesa.",
    "Bets activas: Stop loss / Take Profit Colombia (JR · AV), Mejoras onboarding en Blum (CA · SB), Creación de usuarios CO en Alpaca (ET · KA), Cambios Colombia (GM), Implementación de diseño arquitectura (DC).",
    "Lanzamientos cooldown C2: Demo trii Pro y Mejoras trii web ya live · Retiros Inmediatos Fondos cierra esta semana (max miércoles).",
    "Vinculación Completa: reunión con Acciones y Valores esta semana — go-live previsto Ciclo 3 S2.",
    "Equipo: Lucas P (BE) se une — arranca en S4 con High Yield Cash US Stocks.",
  ]],
];

for (const [week, items] of WEEKLY_LOG) {
  for (const note of items) {
    await client.query(
      `insert into bet_updates (cycle_id, bet_id, week, note) values ($1, null, $2, $3)`,
      [cycle.id, week, note]
    );
  }
}

const OBJECTIVES = [
  [1, "Obj. 1 — Escalar trii pro al 10% de penetración", "Escalar trii pro",
    "Llegar al 10% de penetración de trii pro entre los usuarios activos de los 3 países. Construir las funcionalidades que los traders piden (órdenes avanzadas, take profit, historial) para que el producto se sienta completo.",
    "10% de penetración pro", "Fin 2026", "Juanita", "Jael", null],
  [2, "Obj. 2 — Lanzar US Stocks en Colombia y Perú", "US Stocks CO & PE",
    "Habilitar compra-venta de acciones americanas desde Colombia y Perú. Es la expansión más pedida por usuarios y el gancho principal para traer nuevos traders a la plataforma.",
    "US Stocks live en CO + PE", "Q2 2026", "Juanita", "Jael", null],
  [3, "Obj. 3 — Expandir producto en Chile", "Expandir Chile",
    "Cerrar la brecha de paridad de producto en Chile. Hoy el mercado chileno no tiene retiros express ni experiencia de dividendos consistente. Sin PO ni diseñador asignados — bloqueo principal del objetivo.",
    "Paridad funcional con CO/PE", "Q3 2026", null, null, null],
  [4, "Obj. 4 — Aumentar activación a 50%", "Activación al 50%",
    "Subir la tasa de activación (usuarios que depositan y operan tras crear cuenta) del ~30% actual a 50%. Foco en el nuevo onboarding de Colombia y en remover fricción en depósitos / primeras órdenes.",
    "Activación 30% → 50%", "Fin 2026", "Federico", "James Alonso", null],
  [5, "Obj. 5 — Crecer AUMs de fondos en Perú", "AUMs fondos PE",
    "Llegar a USD 10M en AUMs de fondos Blum en Perú. Compromiso contractual con Blum — si no se cumple antes de fin de año, cierran los fondos. Requiere replantear inscripción, retiros, traslados y movimientos.",
    "USD 10M en AUMs", "Fin 2026 (contractual)", "Felipe", "Ange",
    "Blum pidió USD 10M en AUMs en Perú antes de fin de año. Si no, cierran fondos."],
  [99, "Asks especiales", "Asks especiales",
    "Pitches que no se mapean a un objetivo estratégico — requests puntuales de otras áreas (CX, ops) que entran a discovery por su impacto.",
    "—", "—", "Federico", null, null],
];

const objIds = {};
for (let i = 0; i < OBJECTIVES.length; i++) {
  const [num, name, shortName, description, metric, target, po, designer, context] = OBJECTIVES[i];
  const r = await client.query(
    `insert into discovery_objectives (cycle_id, obj_num, name, short_name, description, metric, target, po, designer, context, position)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id`,
    [cycle.id, num, name, shortName, description, metric, target, po, designer, context, i]
  );
  objIds[num] = r.rows[0].id;
}

const TASKS = [
  [1, "Modificación de órdenes — web/app", "ready", "Juanita", "Jael", "high", "https://www.figma.com/design/zhhQv5ScB8SBoxeOLaBtcz/CO_%C3%93rdenes?m=auto&node-id=7743-57551&t=CApConfKFjsV2k7I-1", "Diseño cerrado · pasó a build (bet activa JR · SB, S3-S5)."],
  [1, "Cambiar default de órdenes en el app", "backlog", "Juanita", "Jael", "med", null, "Carry-over de C2."],
  [1, "Historial de órdenes de bolsa — web/app", "backlog", "Juanita", "Jael", "low", null, "Carry-over de C2."],
  [2, "High Yield Cash US", "ready", "Federico", "Jael", "high", "https://www.figma.com/design/oTMY3qoKyeGQOhk3Fp57eZ/Acciones-de-EEUU?node-id=12307-6509&t=zspVcFNfQxzaQioP-1", "Diseño cerrado en S3 · pasó a build (bet activa ET · LP, S4-S6)."],
  [2, "Análisis fundamental y técnico de US Stocks", "research", "Juanita", "Jael", "med", null, "Evaluando proveedores y viabilidad financiera."],
  [2, "Diferencial de spreads y comisiones pro (US Stocks)", "backlog", "Juanita", "Jael", "med", null, "Carry-over de C2."],
  [4, "Nuevo flujo de onboarding (Colombia)", "design", "Federico", "James Alonso", "high", "https://www.figma.com/board/q9HbX3hhV5d9KBYUHYYvvI/Onboarding?node-id=157-6830&t=CEk1ffpLboM5fr07-4", "Diseño arrancó S1. PO asignado (Federico). Consolidado con \"Nuevo onboarding\" (mismo item)."],
  [4, "Regalar Acciones", "design", "Juanita", "Jael", "med", null, "Pasó de Backlog a Design en S3. Lanza con US Stocks como mecanismo de activación."],
  [4, "Cambiar Pasarela de Pago Peru", "research", "Federico", null, "med", null, "Nuevo · evaluar alternativas a la pasarela actual en PE para destrabar activación."],
  [4, "Inscripción Bolsa Millonaria", "research", "Felipe", "Ange", "med", null, "Investigación arrancó · inscripción al concurso anual de inversión para activar usuarios."],
  [4, "Portafolio de ETFs", "backlog", "Felipe", "Ange", "low", null, "Nuevo · armar portafolio de ETFs para activación."],
  [5, "Rediseño depósitos y retiros fondos (3 países)", "ready", "Felipe", "Ange", "high", "https://www.figma.com/design/OLCQ6uzoJJymg88yu9AAo9/%F0%9F%94%AE-Fondos?node-id=7392-9132&t=ZHXU7Konp3kYZWj1-1", "Diseño cerrado · pasó a build (bet activa CA, S4-S6)."],
  [5, "Mejoras en movimientos de transacciones y fondos", "design", "Felipe", "Ange", "med", null, "Pasó de Backlog a Design en S2 · diseño arrancando."],
  [5, "Rentabilidad total", "research", "Juanita", "Jael", "med", null, "Renombrado desde \"Rentabilidad de fondos de inversión desde Back\". Reasignado a Juanita · Jael — scope ampliado a rentabilidad total."],
  [5, "Retiros directo a cuenta", "backlog", "Felipe", "Ange", "med", null, "Nuevo · retiros directos a la cuenta del usuario en fondos."],
  [99, "Cambiar todas las pasarelas en Colombia a Mercado Pago", "research", "Federico", null, "med", null, "Nuevo · migración de pasarelas en CO a Mercado Pago."],
];

for (let i = 0; i < TASKS.length; i++) {
  const [objNum, name, stage, owner, designer, priority, figma, notes] = TASKS[i];
  await client.query(
    `insert into discovery_tasks (objective_id, name, stage, owner, designer, priority, figma, notes, position)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [objIds[objNum], name, stage, owner, designer, priority, figma, notes, i]
  );
}

const counts = {};
for (const t of ["cycles", "bets", "bet_updates", "discovery_objectives", "discovery_tasks", "backlog_ideas"]) {
  counts[t] = (await client.query(`select count(*)::int as n from ${t}`)).rows[0].n;
}
console.log("Seed complete:", counts);
await client.end();
