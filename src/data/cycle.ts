// Static data for the Releases and Cooldown tabs.
// Cycle bets, weekly log and discovery now live in Supabase
// (see src/lib/db.ts and supabase/schema.sql — seeded by scripts/setup-db.mjs).

export interface Release {
  version: string;
  tag?: "QA" | "Review" | "Live" | "PROD";
  date: string;
  items: string[];
}

export const RELEASES: Release[] = [
  { version: "3.6.0", tag: "QA", date: "Jun 1, 2026", items: [
    "Tipos de órdenes: Stop Loss y Take Profit",
    "Nuevo Onboarding Blum",
  ]},
  { version: "3.4.3", tag: "Review", date: "May 26, 2026", items: [
    "Proceso vinculación completa",
    "Tag para identificar vinculación completa",
    "Corrección valor de time_in_force para órdenes límite (letras para US Stocks, número para demás órdenes)",
    "Permitir mover montos de CDTs finalizados a saldo disponible",
    "Actualización librería de CustomerIO",
    "Usar balance disponible para pago de usuarios en demo de trii Pro",
  ]},
  { version: "3.3.8", tag: "Live", date: "May 22, 2026", items: [
    "Flujo rentar balance con soporte para múltiples fondos",
    "Corrección textos \"Para participar en la oferta debes tener acciones cumplidas\"",
    "Corrección validación precio límite para operaciones especiales",
  ]},
  { version: "3.3.5", tag: "PROD", date: "May 11, 2026", items: [
    "Registro de eventos para Posthog",
    "Nuevo texto para pago de dividendos \"Trianual\"",
    "Demo trii Pro",
    "Flujo rentar balance con soporte para múltiples fondos",
    "Texto rentabilidad en pantalla de confirmar inversión en Fondo",
    "Si estás bloqueado en Mibanco, permitir sacar CDTs de Tuya",
    "Permitir decimales en el calendario de dividendos para CO",
  ]},
  { version: "3.2.1", tag: "PROD", date: "Abr 24, 2026", items: [
    "Cash in tarjeta de crédito",
    "Corrección texto de tiempo de espera para retiros en Nequi",
    "Corrección validación de montos en Stop Loss",
  ]},
  { version: "3.1.4", date: "Abr 10, 2026", items: [
    "Permite simular CDTs en Tuya sin tener el monto mínimo",
    "Eliminación de opción \"Saldo en caja\" para retiros de CDT de Mibanco",
    "Lista de movimientos de operaciones especiales de mercado",
  ]},
  { version: "3.1.2", date: "Mar 28, 2026", items: [
    "Tags para listas de stocks locales (Tag comisión cero y top)",
    "Ocultamiento condicional de información sensible (montos y descripciones) en la tabla de inversiones",
    "Evento especial de mercado tipo recompra",
  ]},
  { version: "3.0.56", date: "Mar 14, 2026", items: [
    "iOS SDK 26",
    "Android min version SDK 24, Android 7 (Nougat)",
    "Actualización de navegación en home. Vuelve movimientos a navegación principal",
    "Tag Subasta en las listas de stocks locales",
    "Corrección valores de acciones con delay para usuarios sin trii pro",
    "Estados finalizado para CDTs",
    "Actualización versiones de GitHub Actions",
  ]},
  { version: "3.0.54", date: "Feb 22, 2026", items: [
    "Optimización pantalla de stock (soluciona efecto de carga que muestra valor -1)",
    "Movimientos de dividendos",
    "Opción de ocultar saldo se conserva al cerrar sesión",
    "Elección de moneda local o US se conserva al navegar por la aplicación",
    "Carrusel de banner para acciones locales y EE. UU",
    "Sección CDT en descubre",
    "Market hold para cambios en US Stocks Chile",
  ]},
  { version: "3.0.51", date: "Feb 8, 2026", items: [
    "SDK Meta",
    "Conservar estado al ocultar saldo",
    "Lista de acciones sube en prioridad en vista de invertir",
    "Vuelve favoritos a la pantalla de inicio",
    "Lista de movimientos individual para US Stocks",
    "Filtros para ordenar acciones locales",
    "Corrección de estilos en los banners",
    "Corrección logos estirados al inicializar la app y actualizar slides de bienvenida",
  ]},
  { version: "3.0.46", date: "Ene 25, 2026", items: [
    "CDTs Tuya",
    "Integración PostHog",
    "Cartola de movimientos en Chile",
    "Onboarding US Stocks",
    "Correcciones validaciones de órdenes en US Stocks",
    "Corrección problemas carga portafolio usuarios Perú",
    "Corrección validaciones para términos y condiciones",
  ]},
  { version: "3.0.36", date: "Ene 11, 2026", items: [
    "Horarios de mercado para Fix 5.0",
    "Actualización términos y condiciones Perú",
    "Mejoras animación pantalla login",
    "Mejoras en diseño de trii 3.0",
  ]},
  { version: "3.0.31", date: "Dic 28, 2025", items: [
    "Home completamente nuevo",
    "Pantalla de inversiones rediseñada",
    "Nuevo diseño en toda la app",
  ]},
  { version: "2.72.51", date: "Dic 14, 2025", items: [
    "Icono de navidad",
    "Actualización de direcciones de Perú para fondos Blum",
    "Se corrige validación de precios límites",
  ]},
  { version: "2.72.38", date: "Nov 30, 2025", items: [
    "Se elimina en los fondos en la tabla de rentabilidad los elementos duplicados",
    "Se corrige el error del cálculo de min y max para la cantidad de acciones en órdenes a mercado, que estaba tomando en cuenta el marketHoldPercentage 2 veces",
  ]},
  { version: "2.72.37", date: "Nov 16, 2025", items: [
    "Se arregla la pantalla de videos",
    "Se pone en más información del saldo el valor del marketHold que antes estaba quemado",
    "Se corrige el error que no dejaba poner ninguna orden en cualquier tipo de subasta, ahora solo se puede orden límite en subasta",
    "Se corrige el currency que se usa para el input y las validaciones",
  ]},
];

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
  currentDate: "2026-05-04",
  totalDays: 10,
  currentDay: 6,
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
