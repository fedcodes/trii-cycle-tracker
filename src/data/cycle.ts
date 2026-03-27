export interface Bet {
  name: string;
  objective: string;
  objectiveNum: number;
  team: string[];
  status: "On track" | "Update" | "Not started" | "Listo";
  weeks: [number, number]; // start week, end week (1-6)
  lastUpdate: string;
  updates: string[];
}

export interface DiscoveryObjective {
  id: number;
  name: string;
  po: { name: string; initials: string };
  designer: { name: string; initials: string } | null;
  tasks: { name: string; status: string; notes: string }[];
  context?: string;
}

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
}

export const cycleData: CycleData = {
  cycleName: "Ciclo 2 — 2026",
  dates: "Mar 16 → Abr 24, 2026",
  cooldown: "Abr 27 → May 8, 2026",
  currentWeek: 2,
  totalWeeks: 6,
  lastUpdated: "2026-03-27",
  bets: [
    {
      name: "Demo trii Pro",
      objective: "Obj. 1 — Escalar trii pro",
      objectiveNum: 1,
      team: ["SB", "JR"],
      status: "On track",
      weeks: [2, 6],
      lastUpdate: "Jorge terminó Update iOS/Android y se movió a este proyecto",
      updates: [
        "Jorge terminó Update iOS/Android temprano, se movió a Demo trii Pro",
      ],
    },
    {
      name: "Órdenes",
      objective: "Obj. 1 — Escalar trii pro",
      objectiveNum: 1,
      team: ["AV"],
      status: "Listo",
      weeks: [1, 1],
      lastUpdate: "Completado en S1",
      updates: ["Completado por Alan en Semana 1"],
    },
    {
      name: "Mejoras trii web",
      objective: "Obj. 1 — Escalar trii pro",
      objectiveNum: 1,
      team: ["CA"],
      status: "Update",
      weeks: [4, 6],
      lastUpdate:
        "Pushed por ausencia de Carlos. Jorge puede absorber si termina Demo trii Pro antes",
      updates: [
        "Pushed por ausencia de Carlos (emergencia familiar)",
        "Jorge puede absorber si termina Demo trii Pro antes",
      ],
    },
    {
      name: "Vinculación Completa",
      objective: "Obj. 2 — US Stocks CO",
      objectiveNum: 2,
      team: ["KA", "ET"],
      status: "On track",
      weeks: [1, 6],
      lastUpdate:
        "Definiciones recibidas de Acciones y Valores. Sin bloqueos",
      updates: [
        "Estefa recibió definiciones de Acciones y Valores",
        "Sin bloqueos",
      ],
    },
    {
      name: "Cambios Colombia",
      objective: "Obj. 2 — US Stocks CO",
      objectiveNum: 2,
      team: ["GM"],
      status: "Not started",
      weeks: [5, 6],
      lastUpdate: "Pendiente, inicia S5",
      updates: ["Pendiente — inicia en Semana 5"],
    },
    {
      name: "Soporte US Stocks",
      objective: "Obj. 2 — US Stocks CO",
      objectiveNum: 2,
      team: ["GM"],
      status: "On track",
      weeks: [1, 5],
      lastUpdate:
        "Gafe lo ejecuta en paralelo con Mejoras transf. Peru",
      updates: ["Gafe ejecuta en paralelo con Mejoras transf. Peru"],
    },
    {
      name: "Dividendos Chile",
      objective: "Obj. 3 — Chile",
      objectiveNum: 3,
      team: ["KA"],
      status: "Update",
      weeks: [1, 3],
      lastUpdate:
        "Event BUS de Vector Capital no tiene evento de dividendos. Kai usa workaround con flujo actual mejorado",
      updates: [
        "Event BUS de Vector Capital no incluye evento de dividendos",
        "Kai implementa workaround con flujo actual mejorado",
        "No es ideal pero mejora la experiencia del usuario",
      ],
    },
    {
      name: "Retiros Express Chile",
      objective: "Obj. 3 — Chile",
      objectiveNum: 3,
      team: ["KA"],
      status: "Not started",
      weeks: [2, 3],
      lastUpdate: "Pendiente",
      updates: ["Pendiente"],
    },
    {
      name: "Retiros fondos MM",
      objective: "Obj. 4 — Activación",
      objectiveNum: 4,
      team: ["SB", "CA"],
      status: "Update",
      weeks: [1, 4],
      lastUpdate:
        "Sergio en backend sin bloqueos. Frontend pushed por ausencia de Carlos",
      updates: [
        "Sergio avanza backend sin bloqueos",
        "Frontend pushed por ausencia de Carlos",
      ],
    },
    {
      name: "Mejoras transf. Peru",
      objective: "Obj. 4 — Activación",
      objectiveNum: 4,
      team: ["GM"],
      status: "On track",
      weeks: [2, 4],
      lastUpdate: "Gafe ejecuta en paralelo con Soporte US Stocks",
      updates: ["Gafe ejecuta en paralelo con Soporte US Stocks"],
    },
    {
      name: "TC en depósitos",
      objective: "Obj. 4 — Activación",
      objectiveNum: 4,
      team: ["CA"],
      status: "Update",
      weeks: [1, 2],
      lastUpdate:
        "Carlos intentando terminar antes de su ausencia",
      updates: [
        "Carlos intentando terminar antes de su ausencia por emergencia familiar",
      ],
    },
    {
      name: "Fix 5.0 Peru Orders",
      objective: "Regulatorio",
      objectiveNum: 99,
      team: ["AV"],
      status: "On track",
      weeks: [2, 6],
      lastUpdate: "Alan 100% dedicado. Deadline BVL Abr 24",
      updates: ["Alan 100% dedicado", "Deadline BVL: Abril 24"],
    },
    {
      name: "Fix 5.0 Peru Market",
      objective: "Regulatorio",
      objectiveNum: 99,
      team: ["DC"],
      status: "On track",
      weeks: [1, 5],
      lastUpdate: "David dedicado junto con Orders",
      updates: ["David dedicado junto con Orders"],
    },
    {
      name: "Update iOS/Android",
      objective: "Regulatorio",
      objectiveNum: 99,
      team: ["JR"],
      status: "Listo",
      weeks: [1, 2],
      lastUpdate: "Jorge terminó temprano, se movió a Demo trii Pro",
      updates: [
        "Jorge terminó temprano en S2",
        "Se movió a Demo trii Pro",
      ],
    },
  ],
  discovery: [
    {
      id: 1,
      name: "Obj. 1 — Incrementar usuarios pro",
      po: { name: "Juanita", initials: "JP" },
      designer: { name: "Jael", initials: "JA" },
      tasks: [
        {
          name: "Modificación de órdenes — web/app",
          status: "En curso",
          notes: "",
        },
        {
          name: "Take Profit Colombia — web/app",
          status: "En curso",
          notes: "",
        },
        {
          name: "Poder cambiar el default de órdenes en el app",
          status: "En curso",
          notes: "",
        },
        {
          name: "Historial de órdenes de bolsa — web/app",
          status: "En curso",
          notes: "",
        },
      ],
    },
    {
      id: 2,
      name: "Obj. 2 — Crecer US Stocks",
      po: { name: "Juanita", initials: "JP" },
      designer: { name: "Jael", initials: "JA" },
      tasks: [
        {
          name: "Lanzar Colombia",
          status: "En curso",
          notes: "Asignado a Federico (FG), no a Juanita",
        },
        {
          name: "Análisis fundamental y técnico de US Stocks",
          status: "En curso",
          notes: "",
        },
        {
          name: "Diferencial de spreads y comisiones para usuarios pro",
          status: "En curso",
          notes: "",
        },
      ],
    },
    {
      id: 5,
      name: "Obj. 5 — Crecer AUMs fondos Perú",
      po: { name: "Felipe", initials: "FA" },
      designer: { name: "Ange", initials: "AN" },
      tasks: [
        {
          name: "Cambiar flujo de inscripción para fondos Blum",
          status: "En curso",
          notes: "",
        },
        {
          name: "Rentabilidad de fondos de inversión desde Back",
          status: "En curso",
          notes: "",
        },
        {
          name: "Retiros directo a la cuenta del usuario",
          status: "En curso",
          notes: "",
        },
        {
          name: "Traslados entre fondos",
          status: "En curso",
          notes: "",
        },
      ],
      context:
        "Blum pidió alcanzar USD 10M en AUMs en Perú antes de fin de año. Si no se cumple, cierran los fondos.",
    },
  ],
  weeklyLog: [
    {
      week: "Semana 2 (Mar 23-27)",
      items: [
        "Jorge terminó Update iOS/Android temprano, se movió a Demo trii Pro",
        "Carlos fuera por emergencia familiar — impacta 3 proyectos FE",
        "Kai descubrió limitación del Event BUS de Vector, implementando workaround",
        "Alan y David arrancan Fix 5.0 Peru a tiempo completo",
        "Estefa recibió definiciones de Acciones y Valores para Vinculación Completa",
      ],
    },
    {
      week: "Semana 1 (Mar 16-20)",
      items: [
        "Inicio del ciclo",
        "Órdenes completado por Alan",
        "Update iOS/Android avanzando rápido (Jorge)",
      ],
    },
  ],
};
