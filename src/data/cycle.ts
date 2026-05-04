export type BetStatus = "On track" | "Update" | "Not started" | "Listo" | "Blocked";

export interface Bet {
  id: string;
  name: string;
  objective: string;
  objectiveNum: number;
  team: string[];
  status: BetStatus;
  weeks: [number, number];
  lastUpdate: string;
  progress: number;
  dropped?: boolean;
}

export type DiscoveryStageId = "backlog" | "research" | "design" | "ready";
export type DiscoveryPriority = "high" | "med" | "low";

export interface DiscoveryTask {
  name: string;
  stage: DiscoveryStageId;
  owner: string | null;
  designer: string | null;
  priority: DiscoveryPriority;
  figma: string | null;
  notes: string;
}

export interface DiscoveryObjective {
  id: number;
  name: string;
  shortName: string;
  description: string;
  metric: string;
  target: string;
  po: string | null;
  designer: string | null;
  tasks: DiscoveryTask[];
  context?: string;
}

export interface DiscoveryStage {
  id: DiscoveryStageId;
  label: string;
  desc: string;
}

export interface WeeklyLogEntry {
  week: string;
  dates: string;
  items: string[];
}

export interface Release {
  version: string;
  tag?: "QA" | "Live";
  date: string;
  items: string[];
}

export interface CycleMeta {
  cycleName: string;
  dates: string;
  cooldown: string;
  startDate: string;
  endDate: string;
  currentDate: string;
  currentWeek: number;
  totalWeeks: number;
  lastUpdated: string;
}

export const CYCLE: CycleMeta = {
  cycleName: "Ciclo 2 — 2026",
  dates: "Mar 16 → Abr 24, 2026",
  cooldown: "Abr 27 → May 8, 2026",
  startDate: "2026-03-16",
  endDate: "2026-04-24",
  currentDate: "2026-05-04",
  currentWeek: 6,
  totalWeeks: 6,
  lastUpdated: "2026-05-04",
};

export const TOTAL_DAYS = 42;
export const weekToDays = (w: number) => ({ start: (w - 1) * 7, end: (w - 1) * 7 + 4 });

export const BETS: Bet[] = [
  { id: "demo-pro", name: "Demo trii Pro", objective: "Obj. 1 — Escalar trii pro", objectiveNum: 1, team: ["SB", "JR"], status: "On track", weeks: [2, 6], lastUpdate: "En QA. Lanzamiento esperado en app esta semana (CD2).", progress: 0.95 },
  { id: "ordenes", name: "Órdenes", objective: "Obj. 1 — Escalar trii pro", objectiveNum: 1, team: ["AV"], status: "Listo", weeks: [1, 1], lastUpdate: "Completado en S1", progress: 1 },
  { id: "mejoras-web", name: "Mejoras trii web", objective: "Obj. 1 — Escalar trii pro", objectiveNum: 1, team: ["JR"], status: "On track", weeks: [6, 6], lastUpdate: "Jorge en cierre. 70% completado — finaliza esta semana (CD2).", progress: 0.7 },
  { id: "vinculacion", name: "Vinculación Completa", objective: "Obj. 2 — US Stocks CO", objectiveNum: 2, team: ["KA", "ET", "GM"], status: "On track", weeks: [1, 6], lastUpdate: "90% — Estefa y Kai en formulario. QA jueves May 7. Producción la próxima semana. Gafe terminó modelo Declaraciones de renta, sigue con otros modelos documentales.", progress: 0.9 },
  { id: "cambios-co", name: "Cambios Colombia", objective: "Obj. 2 — US Stocks CO", objectiveNum: 2, team: ["GM"], status: "Not started", weeks: [5, 6], lastUpdate: "Pushed a Ciclo 3. Kai habilita cuentas Vector Capital en cooldown.", progress: 0.1 },
  { id: "soporte-us", name: "Soporte US Stocks", objective: "Obj. 2 — US Stocks CO", objectiveNum: 2, team: ["GM"], status: "Listo", weeks: [1, 5], lastUpdate: "Cerrado en S5.", progress: 1 },
  { id: "dividendos-cl", name: "Dividendos Chile", objective: "Obj. 3 — Chile", objectiveNum: 3, team: ["KA", "AV"], status: "Listo", weeks: [1, 6], lastUpdate: "Alan tomó el relevo de Kai y resolvió issues. Cerrado en S6.", progress: 1 },
  { id: "retiros-cl", name: "Retiros Express Chile", objective: "Obj. 3 — Chile", objectiveNum: 3, team: [], status: "Not started", weeks: [2, 3], lastUpdate: "Descartado del ciclo — se evalúa en próximo ciclo.", dropped: true, progress: 0 },
  { id: "retiros-mm", name: "Retiros fondos MM", objective: "Obj. 4 — Activación", objectiveNum: 4, team: ["SB", "CA"], status: "On track", weeks: [1, 6], lastUpdate: "En QA. Lanzamiento esperado en app esta semana (CD2).", progress: 0.95 },
  { id: "transf-pe", name: "Mejoras transf. Perú", objective: "Obj. 4 — Activación", objectiveNum: 4, team: ["GM"], status: "Listo", weeks: [2, 4], lastUpdate: "Live. Operando.", progress: 1 },
  { id: "tc-depositos", name: "TC en depósitos", objective: "Obj. 4 — Activación", objectiveNum: 4, team: ["CA", "KA"], status: "Listo", weeks: [1, 4], lastUpdate: "Webhook de producción configurado por Kai en cooldown S1. Bet cerrado.", progress: 1 },
  { id: "fix-orders", name: "Fix 5.0 Perú Orders", objective: "Regulatorio", objectiveNum: 99, team: ["AV", "DC"], status: "Listo", weeks: [2, 6], lastUpdate: "Live sábado Abr 25. David en soporte (AV de vacaciones).", progress: 1 },
  { id: "fix-market", name: "Fix 5.0 Perú Market", objective: "Regulatorio", objectiveNum: 99, team: ["DC"], status: "Listo", weeks: [1, 6], lastUpdate: "Live sábado Abr 25. David en soporte durante CD2.", progress: 1 },
  { id: "update-os", name: "Update iOS/Android", objective: "Regulatorio", objectiveNum: 99, team: ["JR"], status: "Listo", weeks: [1, 2], lastUpdate: "Jorge terminó temprano, se movió a Demo trii Pro.", progress: 1 },
];

export const DISCOVERY_STAGES: DiscoveryStage[] = [
  { id: "backlog", label: "Backlog", desc: "Ideas y pitches por priorizar" },
  { id: "research", label: "Research", desc: "PO y diseño alineando scope" },
  { id: "design", label: "Design", desc: "Wireframes / UI en progreso" },
  { id: "ready", label: "Ready", desc: "Listo para desarrollo" },
];

// Figma links (centralized so they're easy to update)
const FIGMA_ONBOARDING_CO = "https://www.figma.com/board/q9HbX3hhV5d9KBYUHYYvvI/Onboarding?node-id=157-6830&t=CEk1ffpLboM5fr07-4";
const FIGMA_ONBOARDING_BLUM = "https://www.figma.com/design/LMHcQiNUjiuk53aD9DHkB8/PE_Fondos?node-id=6-9&t=A318m31A7bDZMYUr-1";
const FIGMA_TAKE_PROFIT = "https://www.figma.com/design/zhhQv5ScB8SBoxeOLaBtcz/CO_%C3%93rdenes?m=auto&node-id=7834-34277&t=CpSRppUDDyV3efS5-1";

export const DISCOVERY: DiscoveryObjective[] = [
  {
    id: 1,
    name: "Obj. 1 — Escalar trii pro al 10% de penetración",
    shortName: "Escalar trii pro",
    description: "Llegar al 10% de penetración de trii pro entre los usuarios activos de los 3 países. Construir las funcionalidades que los traders piden (órdenes avanzadas, take profit, historial) para que el producto se sienta completo.",
    metric: "10% de penetración pro",
    target: "Fin 2026",
    po: "Juanita",
    designer: "Jael",
    tasks: [
      { name: "Take Profit Colombia — web/app", stage: "ready", owner: "Juanita", designer: "Jael", priority: "high", figma: FIGMA_TAKE_PROFIT, notes: "Diseño cerrado. Listo para entrar a build." },
      { name: "Modificación de órdenes — web/app", stage: "design", owner: "Juanita", designer: "Jael", priority: "high", figma: null, notes: "Juanita y Jael arrancan diseño tras cerrar Take Profit." },
      { name: "Cambiar default de órdenes en el app", stage: "backlog", owner: "Juanita", designer: "Jael", priority: "med", figma: null, notes: "" },
      { name: "Historial de órdenes de bolsa — web/app", stage: "backlog", owner: "Juanita", designer: "Jael", priority: "low", figma: null, notes: "" },
    ],
  },
  {
    id: 2,
    name: "Obj. 2 — Lanzar US Stocks en Colombia y Perú",
    shortName: "US Stocks CO & PE",
    description: "Habilitar compra-venta de acciones americanas desde Colombia y Perú. Es la expansión más pedida por usuarios y el gancho principal para traer nuevos traders a la plataforma.",
    metric: "US Stocks live en CO + PE",
    target: "Q2 2026",
    po: "Juanita",
    designer: "Jael",
    tasks: [
      { name: "Lanzar Colombia", stage: "ready", owner: "Federico", designer: "Jael", priority: "high", figma: null, notes: "Listo para build — owner Federico" },
      { name: "Análisis fundamental y técnico de US Stocks", stage: "research", owner: "Juanita", designer: "Jael", priority: "med", figma: null, notes: "Evaluando proveedores y viabilidad financiera" },
      { name: "Diferencial de spreads y comisiones para usuarios pro", stage: "backlog", owner: "Juanita", designer: "Jael", priority: "med", figma: null, notes: "" },
    ],
  },
  {
    id: 3,
    name: "Obj. 3 — Expandir producto en Chile",
    shortName: "Expandir Chile",
    description: "Cerrar la brecha de paridad de producto en Chile. Hoy el mercado chileno no tiene retiros express ni experiencia de dividendos consistente. Sin PO ni diseñador asignados — bloqueo principal del objetivo.",
    metric: "Paridad funcional con CO/PE",
    target: "Q3 2026",
    po: null,
    designer: null,
    tasks: [],
  },
  {
    id: 4,
    name: "Obj. 4 — Aumentar activación a 50%",
    shortName: "Activación al 50%",
    description: "Subir la tasa de activación (usuarios que depositan y operan tras crear cuenta) del ~30% actual a 50%. Foco en el nuevo onboarding de Colombia y en remover fricción en depósitos / primeras órdenes.",
    metric: "Activación 30% → 50%",
    target: "Fin 2026",
    po: null,
    designer: "James Alonso",
    tasks: [
      { name: "Nuevo flujo de onboarding (Colombia)", stage: "design", owner: null, designer: "James Alonso", priority: "high", figma: FIGMA_ONBOARDING_CO, notes: "Wireframes cerrados — picture clara. Diseño arranca esta semana (CD2)." },
    ],
  },
  {
    id: 5,
    name: "Obj. 5 — Crecer AUMs de fondos en Perú",
    shortName: "AUMs fondos PE",
    description: "Llegar a USD 10M en AUMs de fondos Blum en Perú. Compromiso contractual con Blum — si no se cumple antes de fin de año, cierran los fondos. Requiere replantear inscripción, retiros, traslados y movimientos.",
    metric: "USD 10M en AUMs",
    target: "Fin 2026 (contractual)",
    po: "Felipe",
    designer: "Ange",
    tasks: [
      { name: "Nuevo onboarding fondos Blum", stage: "ready", owner: "Felipe", designer: "Ange", priority: "high", figma: FIGMA_ONBOARDING_BLUM, notes: "Diseño cerrado. Pitch listo — entra a Ciclo 3 como bet." },
      { name: "Rediseño depósito, retiros y movimientos de fondos (3 países)", stage: "design", owner: "Felipe", designer: "Ange", priority: "high", figma: null, notes: "Pasa de Backlog a Design — pitch S6 que ahora arranca diseño." },
      { name: "Rentabilidad de fondos de inversión desde Back", stage: "research", owner: "Felipe", designer: "Ange", priority: "med", figma: null, notes: "" },
      { name: "Traslados entre fondos", stage: "backlog", owner: "Felipe", designer: "Ange", priority: "low", figma: null, notes: "Solo viable en Colombia. Despriorizado en CD2 — vuelve a Backlog." },
      { name: "Mejoras en movimientos de transacciones y fondos", stage: "backlog", owner: "Felipe", designer: "Ange", priority: "low", figma: null, notes: "" },
    ],
    context: "Blum pidió USD 10M en AUMs en Perú antes de fin de año. Si no, cierran fondos.",
  },
  {
    id: 99,
    name: "Asks especiales",
    shortName: "Asks especiales",
    description: "Iniciativas que no están bajo un objetivo estratégico pero requieren atención de producto este ciclo.",
    metric: "—",
    target: "—",
    po: "Juanita",
    designer: null,
    tasks: [
      { name: "Mejoras Agente CX", stage: "research", owner: "Juanita", designer: null, priority: "med", figma: null, notes: "Picture clara de qué hace falta — pitch a cerrar esta semana (CD2)." },
    ],
  },
];

export const WEEKLY_LOG: WeeklyLogEntry[] = [
  {
    week: "Cooldown S2", dates: "May 4-8", items: [
      "Demo trii Pro y Retiros fondos MM en QA — lanzamiento esperado en app esta semana",
      "Mejoras trii web — Jorge en cierre, 70% completado, finaliza esta semana",
      "Vinculación Completa — 90% (Estefa + Kai en formulario), QA jueves May 7, producción la próxima",
      "Gafe — modelo Declaraciones de renta cerrado; sigue con otros modelos documentales",
      "Sergio + Carlos — bugs Mejoras onboarding Blum (hasta May 8)",
      "Alan — de vacaciones, regresa Ciclo 3 S1",
      "David — soporte Fix 5.0 Peru + soporte app durante cooldown",
      "Discovery: Onboarding fondos Blum → Ready (pitch a Ciclo 3); Nuevo flujo onboarding CO → Design; Rediseño depósito/retiros/movimientos (3 países) → Design",
      "Discovery: Traslados entre fondos → Backlog (despriorizado); Asesor AI CX reemplazado por Mejoras Agente CX (Research, pitch esta semana)",
    ]
  },
  {
    week: "Cooldown S1", dates: "Abr 27 - May 1", items: [
      "TC en depósitos — Kai configuró webhook de producción · bet cerrado",
      "Demo trii Pro — desbloqueado y cerrando en cooldown (Jorge)",
      "Retiros fondos MM — Carlos cerró el FE el Abr 28",
      "Mejoras trii web — Jorge en curso",
      "Vector Capital — Kai arrancó cuentas colombianas (habilitador US Stocks CO)",
      "Sergio — fixes y tech debt (Abr 27 → 29) · luego arranca Mejoras onboarding Blum",
      "Carlos — arranca Mejoras onboarding Blum (Abr 29 → May 8)",
      "Discovery: Take Profit cierra diseño · pasa a Ready",
      "Discovery: Modificación de órdenes (Backlog → Design)",
    ]
  },
  {
    week: "Semana 6", dates: "Abr 20-24", items: [
      "Retiros fondos MM y Demo trii Pro terminando desarrollo — entrega S6",
      "Fix 5.0 Perú: go-live sábado Abr 25, operación arranca lunes Abr 27",
      "Vinculación Completa: preguntas sobre API AyV — resolución esperada S6",
      "Mejoras trii web: Jorge arranca S6 tras cerrar Demo Pro",
      "Discovery: rediseño de tablero — ahora agrupado por etapa (Backlog/Research/Design/Ready) con acceso a Figma",
      "Discovery Obj. 5: wireframes onboarding fondos Blum aprobados",
      "Discovery Obj. 1: Take Profit en diseño con Figma conectado",
      "Discovery Obj. 4: wireframes nuevo onboarding Colombia en proceso",
      "Discovery Obj. 5: traslados entre fondos — solo Colombia (no viable Perú)",
      "Discovery Obj. 5: nuevo pitch rediseño depósito/retiros/movimientos (3 países)",
      "Discovery Obj. 2: Lanzar Colombia pasó a Ready",
    ]
  },
  {
    week: "Semana 5", dates: "Abr 13-17", items: [
      "TC en depósitos completado por Carlos — Fede testeando",
      "Carlos arrancó FE retiros fondos MM",
      "Mejoras transf. Perú live — Ops Perú testeando",
      "Jorge arrancó Demo trii Pro",
      "Vinculación: document reader terminado, FE y BE sin bloqueos",
      "Fix 5.0 Perú: certificados en order entry y market data",
      "James Alonso se unió al equipo de diseño",
    ]
  },
  {
    week: "Semana 4", dates: "Abr 6-10", items: [
      "Carlos regresó — terminando TC depósitos, arranca FE retiros MM",
      "Sergio se mueve a backend Demo trii Pro",
      "Gafe y Kai arrancan backend Vinculación Completa",
      "Decisión: Retiros Inmediatos Chile descartado del ciclo",
      "Dividendos Chile bloqueado — pushed a Vector",
      "Kai se mueve de Dividendos a Vinculación Completa",
    ]
  },
  {
    week: "Semana 3", dates: "Mar 30 - Abr 3", items: [
      "Jorge corrigió varios bugs",
      "Jorge movió 'Movimientos' al menú principal",
      "Estefa avanzó testing servicios AyV",
      "Sergio continuó backend retiros fondos MM",
    ]
  },
  {
    week: "Semana 2", dates: "Mar 23-27", items: [
      "Jorge terminó Update iOS/Android temprano",
      "Carlos fuera por emergencia familiar — impacta 3 proyectos FE",
      "Kai descubrió limitación del Event BUS de Vector",
      "Alan y David arrancan Fix 5.0 Perú",
      "Estefa recibió definiciones AyV para Vinculación",
    ]
  },
  {
    week: "Semana 1", dates: "Mar 16-20", items: [
      "Inicio del ciclo",
      "Órdenes completado por Alan",
      "Update iOS/Android avanzando rápido",
    ]
  },
];

export const RELEASES: Release[] = [
  { version: "3.3.0", tag: "QA", date: "May 4", items: [
    "Registro de eventos para Posthog",
    "Nuevo texto para pago de dividendos \"Trianual\"",
    "Demo trii Pro",
    "Texto rentabilidad en pantalla de confirmar inversión en Fondo",
    "Si estás bloqueado en Mibanco, permitir sacar CDTs de Tuya",
  ]},
  { version: "3.2.1", tag: "Live", date: "Abr 24", items: [
    "Cash in tarjeta de crédito",
    "Corrección texto de tiempo de espera para retiros en Nequi",
    "Corrección validación de montos en Stop Loss",
  ]},
  { version: "3.1.4", date: "Abr 10", items: [
    "Permite simular CDTs en Tuya sin tener el monto mínimo",
    "Eliminación de \"Saldo en caja\" para retiros CDT Mibanco",
    "Lista de movimientos de operaciones especiales",
  ]},
  { version: "3.1.2", date: "Mar 28", items: [
    "Tags para listas de stocks locales (comisión cero y top)",
    "Ocultamiento condicional de información sensible",
    "Evento especial de mercado tipo recompra",
  ]},
  { version: "3.0.56", date: "Mar 14", items: [
    "iOS SDK 26",
    "Android min SDK 24, Android 7 (Nougat)",
    "Vuelve movimientos a navegación principal",
    "Tag Subasta en listas de stocks locales",
    "Corrección valores delay para usuarios sin trii pro",
    "Estados finalizado para CDTs",
  ]},
  { version: "3.0.54", date: "Feb 22", items: [
    "Optimización pantalla de stock",
    "Movimientos de dividendos",
    "Opción de ocultar saldo se conserva al cerrar sesión",
    "Carrusel de banner para acciones locales y EE.UU",
    "Sección CDT en descubre",
  ]},
  { version: "3.0.51", date: "Feb 8", items: [
    "SDK Meta",
    "Lista de acciones sube en prioridad",
    "Vuelve favoritos a pantalla de inicio",
    "Lista de movimientos individual para US Stocks",
    "Filtros para ordenar acciones locales",
  ]},
];

export const objColor = (n: number): string => {
  const map: Record<number, string> = { 1: "obj-1", 2: "obj-2", 3: "obj-3", 4: "obj-4", 5: "obj-5", 99: "obj-99" };
  return `rgb(var(--${map[n]}))`;
};

export const objShort = (n: number): string => {
  const map: Record<number, string> = {
    1: "Obj 1 · Pro",
    2: "Obj 2 · US Stocks",
    3: "Obj 3 · Chile",
    4: "Obj 4 · Activación",
    5: "Obj 5 · Fondos PE",
    99: "Regulatorio",
  };
  return map[n];
};

export interface StatusTokens {
  fg: string;
  bg: string;
  dot: string;
}

export const statusToken = (status: BetStatus, dropped?: boolean): StatusTokens => {
  if (dropped) return { fg: "rgb(var(--fg-3))", bg: "rgb(var(--surface-2))", dot: "rgb(var(--fg-4))" };
  const m: Record<BetStatus, StatusTokens> = {
    "On track": { fg: "rgb(var(--primary))", bg: "rgb(var(--primary-dim))", dot: "rgb(var(--primary))" },
    "Listo": { fg: "rgb(var(--primary))", bg: "rgb(var(--primary-dim))", dot: "rgb(var(--primary))" },
    "Update": { fg: "rgb(var(--yellow))", bg: "rgb(var(--yellow-dim))", dot: "rgb(var(--yellow))" },
    "Blocked": { fg: "rgb(var(--error))", bg: "rgb(var(--error-dim))", dot: "rgb(var(--error))" },
    "Not started": { fg: "rgb(var(--fg-2))", bg: "rgb(var(--surface-2))", dot: "rgb(var(--fg-3))" },
  };
  return m[status] || m["Not started"];
};

export const getKPIs = () => {
  const active = BETS.filter((b) => !b.dropped);
  return {
    total: active.length,
    onTrack: active.filter((b) => b.status === "On track").length,
    listo: active.filter((b) => b.status === "Listo").length,
    update: active.filter((b) => b.status === "Update").length,
    notStarted: active.filter((b) => b.status === "Not started").length,
    dropped: BETS.filter((b) => b.dropped).length,
  };
};

// ── Cooldown ───────────────────────────────────────────────
export type CooldownKindId = "carryover" | "debt" | "bug";
export type CooldownStatus = "doing" | "done" | "todo";

export interface CooldownMeta {
  name: string;
  dates: string;
  startDate: string;
  endDate: string;
  currentDate: string;
  totalDays: number;
  currentDay: number;
  nextCycleStart: string;
  nextCycleName: string;
}

export interface CooldownDev {
  code: string;
  name: string;
  role: string;
  capacity: number;
}

export interface CooldownTask {
  id: string;
  title: string;
  kind: CooldownKindId;
  betId?: string;
  dev: string;
  status: CooldownStatus;
  note?: string;
  priority: "high" | "med" | "low";
  effort?: string;
  // 0-indexed workday positions (Mon=0..Fri=4, Mon=5..Fri=9). Both inclusive.
  startDay?: number;
  endDay?: number;
}

export interface CooldownKind {
  id: CooldownKindId;
  label: string;
  desc: string;
  colorVar: string;
  dimVar: string;
}

export const COOLDOWN: CooldownMeta = {
  name: "Cooldown · Ciclo 2 → 3",
  dates: "Abr 27 → May 8, 2026",
  startDate: "2026-04-27",
  endDate: "2026-05-08",
  currentDate: "2026-04-30",
  totalDays: 10,
  currentDay: 4,
  nextCycleStart: "2026-05-11",
  nextCycleName: "Ciclo 3 — 2026",
};

// Mon-Fri workdays between cooldown start and today. Returns null when today
// is outside the window or falls on a weekend.
export const getCurrentCooldownDay = (
  startDate: string,
  endDate: string,
  now: Date = new Date(),
): number | null => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (today < start || today > end) return null;
  const dow = today.getDay();
  if (dow === 0 || dow === 6) return null;
  let count = 0;
  const cursor = new Date(start);
  while (cursor < today) {
    const d = cursor.getDay();
    if (d >= 1 && d <= 5) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
};

export const COOLDOWN_DEVS: CooldownDev[] = [
  { code: "SB", name: "Sergio", role: "Backend", capacity: 4 },
  { code: "JR", name: "Jorge", role: "Frontend", capacity: 3 },
  { code: "CA", name: "Carlos", role: "Frontend", capacity: 3 },
  { code: "KA", name: "Kai", role: "Backend", capacity: 3 },
  { code: "GM", name: "Gafe", role: "Backend", capacity: 3 },
  { code: "AV", name: "Alan", role: "Backend", capacity: 2 },
  { code: "DC", name: "David", role: "Frontend", capacity: 2 },
  { code: "ET", name: "Estefa", role: "Frontend", capacity: 3 },
];

export const COOLDOWN_TASKS: CooldownTask[] = [
  { id: "c-retiros-mm", title: "Retiros money market", kind: "carryover", betId: "retiros-mm", dev: "CA", status: "done", note: "Cerrado en cooldown S1. Carlos cerró FE el Abr 28.", priority: "high", startDay: 0, endDay: 2 },
  { id: "c-demo-pro", title: "Demo trii Pro", kind: "carryover", betId: "demo-pro", dev: "JR", status: "done", note: "Cerrado en cooldown S1.", priority: "high", effort: "3d", startDay: 0, endDay: 2 },
  { id: "c-mejoras-web", title: "Mejoras trii web", kind: "carryover", betId: "mejoras-web", dev: "JR", status: "doing", note: "Jorge arrancó en S6 (Abr 25); continúa en cooldown.", priority: "med", startDay: 0, endDay: 9 },
  { id: "c-vinculacion-doc", title: "Vinculación Completa — Gestión documental", kind: "carryover", betId: "vinculacion", dev: "GM", status: "doing", note: "Componente de gestión documental dentro de Vinculación Completa.", priority: "high", startDay: 0, endDay: 9 },
  { id: "c-vector-co", title: "Crear cuentas de colombianos en Vector Capital", kind: "carryover", dev: "KA", status: "doing", note: "Carryover operativo / integración.", priority: "med", startDay: 2, endDay: 9 },
  { id: "c-form-vinc", title: "Formulario Vinculación Completa", kind: "carryover", betId: "vinculacion", dev: "ET", status: "doing", note: "FE del formulario dentro del flujo de Vinculación Completa.", priority: "high", startDay: 0, endDay: 9 },

  { id: "d-blum-onb", title: "Fixes and tech debt", kind: "debt", dev: "SB", status: "done", note: "Limpieza previa al push de AUMs de Obj. 5.", priority: "high", startDay: 0, endDay: 2 },
  { id: "d-blum-sb", title: "Mejoras onboarding Blum", kind: "bug", dev: "SB", status: "doing", note: "Mejoras de bugs en onboarding fondos Blum Perú.", priority: "high", startDay: 2, endDay: 9 },
  { id: "d-webhook-tc", title: "Webhook Prod para Depósitos de Tarjeta", kind: "debt", dev: "KA", status: "done", note: "Webhook movido a producción por Kai en cooldown S1.", priority: "high", startDay: 0, endDay: 2 },

  { id: "b-blum-ca", title: "Mejoras onboarding Blum", kind: "bug", dev: "CA", status: "doing", note: "Mejoras de bugs en onboarding fondos Blum Perú.", priority: "high", startDay: 2, endDay: 9 },
  { id: "b-fix50-fe", title: "Soporte FIX 5.0 Perú", kind: "bug", dev: "DC", status: "doing", note: "Go-live sábado Abr 25, operación arranca lunes Abr 27. Soporte prioritario.", priority: "high", effort: "10d", startDay: 0, endDay: 9 },
  { id: "b-fix50-be", title: "Soporte FIX 5.0 Perú", kind: "bug", dev: "AV", status: "doing", note: "Go-live sábado Abr 25, operación arranca lunes Abr 27. Soporte prioritario.", priority: "high", effort: "10d", startDay: 0, endDay: 9 },
];

export const COOLDOWN_KINDS: CooldownKind[] = [
  { id: "carryover", label: "Carryover", desc: "No entró en el ciclo", colorVar: "yellow", dimVar: "yellow-dim" },
  { id: "debt", label: "Tech debt", desc: "Limpieza y refactor", colorVar: "obj-2", dimVar: "obj-2-dim" },
  { id: "bug", label: "Bugs", desc: "Reportes y fixes pequeños", colorVar: "error", dimVar: "error-dim" },
];

export const kindToken = (kind: CooldownKindId): CooldownKind =>
  COOLDOWN_KINDS.find((k) => k.id === kind) || COOLDOWN_KINDS[0];

export const devTasks = (devCode: string): CooldownTask[] =>
  COOLDOWN_TASKS.filter((t) => t.dev === devCode);

export const getCooldownKPIs = () => {
  const t = COOLDOWN_TASKS;
  const done = t.filter((x) => x.status === "done").length;
  const doing = t.filter((x) => x.status === "doing").length;
  const todo = t.filter((x) => x.status === "todo").length;
  return {
    total: t.length,
    done,
    doing,
    todo,
    daysLeft: COOLDOWN.totalDays - COOLDOWN.currentDay,
    carryover: t.filter((x) => x.kind === "carryover").length,
    debt: t.filter((x) => x.kind === "debt").length,
    bug: t.filter((x) => x.kind === "bug").length,
  };
};

// -----------------------------------------------------------------------------
// Legacy shape kept for any callers still importing `cycleData`. Internally
// resolves to the same source of truth as BETS / DISCOVERY / etc. so the two
// views never drift.
// -----------------------------------------------------------------------------
export interface CycleData {
  cycleName: string;
  dates: string;
  cooldown: string;
  currentWeek: number;
  totalWeeks: number;
  lastUpdated: string;
  bets: Bet[];
  discovery: DiscoveryObjective[];
  weeklyLog: { week: string; items: string[] }[];
  releases: Release[];
}

export const cycleData: CycleData = {
  cycleName: CYCLE.cycleName,
  dates: CYCLE.dates,
  cooldown: CYCLE.cooldown,
  currentWeek: CYCLE.currentWeek,
  totalWeeks: CYCLE.totalWeeks,
  lastUpdated: CYCLE.lastUpdated,
  bets: BETS,
  discovery: DISCOVERY,
  weeklyLog: WEEKLY_LOG.map((w) => ({ week: `${w.week} (${w.dates})`, items: w.items })),
  releases: RELEASES,
};
