export interface Bet {
  name: string;
  objective: string;
  objectiveNum: number;
  team: string[];
  status: "On track" | "Update" | "Not started" | "Listo" | "Blocked";
  weeks: [number, number]; // start week, end week (1-6)
  lastUpdate: string;
  updates: string[];
  dropped?: boolean;
}

export interface DiscoveryObjective {
  id: number;
  name: string;
  po: { name: string; initials: string } | null;
  designer: { name: string; initials: string } | null;
  tasks: { name: string; status: string; notes: string }[];
  context?: string;
}

export interface Release {
  version: string;
  tag?: string; // e.g. "QA", "🌲"
  items: string[];
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
  releases: Release[];
}

export const cycleData: CycleData = {
  cycleName: "Ciclo 2 — 2026",
  dates: "Mar 16 → Abr 24, 2026",
  cooldown: "Abr 27 → May 8, 2026",
  currentWeek: 4,
  totalWeeks: 6,
  lastUpdated: "2026-04-06",
  bets: [
    {
      name: "Demo trii Pro",
      objective: "Obj. 1 — Escalar trii pro",
      objectiveNum: 1,
      team: ["SB", "JR"],
      status: "On track",
      weeks: [2, 6],
      lastUpdate:
        "Sergio arranca backend. Jorge adelantó FE, esta semana tech debt, termina demo S5",
      updates: [
        "Sergio se mueve a backend Demo trii Pro (S4)",
        "Jorge adelantó FE, esta semana en tech debt",
        "Jorge termina Demo trii Pro en S5",
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
      status: "Not started",
      weeks: [6, 6],
      lastUpdate:
        "Carlos lo toma última semana del ciclo y cooldown",
      updates: [
        "Pushed por ausencia de Carlos (emergencia familiar)",
        "Carlos regresó — lo toma en S6 y cooldown",
      ],
    },
    {
      name: "Vinculación Completa",
      objective: "Obj. 2 — US Stocks CO",
      objectiveNum: 2,
      team: ["KA", "ET", "GM"],
      status: "On track",
      weeks: [1, 6],
      lastUpdate:
        "Estefa terminó testing AyV, trabaja en FE. Gafe y Kai arrancan BE esta semana",
      updates: [
        "Estefa terminó testing de servicios Acciones y Valores",
        "Estefa trabaja en frontend",
        "Gafe y Kai arrancan integración backend esta semana (S4)",
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
      status: "Blocked",
      weeks: [1, 3],
      lastUpdate:
        "Bloqueado. Fix nuestro no cambia experiencia. Se pushea a Vector para fix con BUS Event. Se trabaja en cooldown",
      updates: [
        "Fix nuestro no cambia fundamentalmente la experiencia",
        "Se pushea a Vector Capital para fix con servicio BUS Event",
        "Se continúa trabajando en cooldown",
        "Kai se mueve a Vinculación Completa",
      ],
    },
    {
      name: "Retiros Express Chile",
      objective: "Obj. 3 — Chile",
      objectiveNum: 3,
      team: [],
      status: "Not started",
      weeks: [2, 3],
      lastUpdate:
        "Descartado del ciclo — se evalúa en próximo ciclo",
      updates: [
        "Descartado por restricciones de tiempo",
        "Se evalúa como bet para el próximo ciclo",
      ],
      dropped: true,
    },
    {
      name: "Retiros fondos MM",
      objective: "Obj. 4 — Activación",
      objectiveNum: 4,
      team: ["SB", "CA"],
      status: "On track",
      weeks: [1, 5],
      lastUpdate:
        "Carlos regresó, arranca frontend. Backend listo (Sergio). 2 semanas de FE",
      updates: [
        "Backend completado por Sergio",
        "Carlos regresó, arranca frontend esta semana (S4)",
        "Frontend estimado en 2 semanas (S4-S5)",
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
      status: "On track",
      weeks: [1, 4],
      lastUpdate:
        "Carlos regresó, terminando esta semana",
      updates: [
        "Pushed por ausencia de Carlos",
        "Carlos regresó, cierra esta semana (S4)",
      ],
    },
    {
      name: "Fix 5.0 Peru Orders",
      objective: "Regulatorio",
      objectiveNum: 99,
      team: ["AV", "DC"],
      status: "On track",
      weeks: [2, 6],
      lastUpdate: "Alan y David 100% dedicados. Deadline BVL Abr 24",
      updates: ["Alan y David 100% dedicados", "Deadline BVL: Abril 24"],
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
      name: "Obj. 1 — Escalar trii pro al 10% de penetración",
      po: { name: "Juanita", initials: "JP" },
      designer: { name: "Jael", initials: "JA" },
      tasks: [
        {
          name: "Modificación de órdenes — web/app",
          status: "En curso",
          notes: "Juanita y Jael arrancan diseño esta semana",
        },
        {
          name: "Take Profit Colombia — web/app",
          status: "En curso",
          notes: "Juanita y Jael arrancan diseño esta semana",
        },
        {
          name: "Poder cambiar el default de órdenes en el app",
          status: "En curso",
          notes: "Juanita y Jael arrancan diseño esta semana",
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
      name: "Obj. 2 — Lanzar US Stocks en Colombia y Perú",
      po: { name: "Juanita", initials: "JP" },
      designer: { name: "Jael", initials: "JA" },
      tasks: [
        {
          name: "Lanzar Colombia",
          status: "En curso",
          notes: "Asignado a Federico, no a Juanita",
        },
        {
          name: "Análisis fundamental y técnico de US Stocks",
          status: "En curso",
          notes: "Juanita y Fede evaluando proveedores y viabilidad financiera",
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
      name: "Obj. 5 — Crecer AUMs de fondos en Perú",
      po: { name: "Felipe", initials: "FA" },
      designer: { name: "Ange", initials: "AN" },
      tasks: [
        {
          name: "Cambiar flujo de inscripción para fondos Blum",
          status: "En curso",
          notes: "Felipe A y Angelica ya arrancaron diseño del nuevo onboarding",
        },
        {
          name: "Rentabilidad de fondos de inversión desde Back",
          status: "En curso",
          notes: "",
        },
        {
          name: "Retiros directo a la cuenta del usuario",
          status: "En curso",
          notes:
            "Felipe A en reuniones con AyV y Blum — viabilidad financiera y operativa",
        },
        {
          name: "Traslados entre fondos",
          status: "En curso",
          notes:
            "Felipe A en reuniones con AyV y Blum — viabilidad financiera y operativa",
        },
      ],
      context:
        "Blum pidió alcanzar USD 10M en AUMs en Perú antes de fin de año. Si no se cumple, cierran los fondos.",
    },
  ],
  weeklyLog: [
    {
      week: "Semana 4 (Abr 6-10)",
      items: [
        "Carlos regresó — terminando TC en depósitos, arranca FE retiros fondos MM",
        "Sergio se mueve a backend Demo trii Pro",
        "Jorge en tech debt esta semana, termina Demo trii Pro S5",
        "Estefa terminó testing servicios AyV, trabaja en FE Vinculación Completa",
        "Gafe y Kai arrancan backend Vinculación Completa",
        "Decisión: Retiros Inmediatos Chile descartado del ciclo",
        "Dividendos Chile bloqueado — se pushea a Vector para fix con BUS Event",
        "Kai se mueve de Dividendos a Vinculación Completa",
      ],
    },
    {
      week: "Semana 3 (Mar 30 - Abr 3)",
      items: [
        "Jorge corrigió varios bugs en la app",
        "Jorge movió sección 'Movimientos' al menú principal (ask de usuarios)",
        "Estefa avanzó testing de servicios Acciones y Valores",
        "Sergio continuó backend retiros fondos MM",
      ],
    },
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
  releases: [
    {
      version: "3.0.X",
      tag: "QA",
      items: [
        "iOS SDK 26",
        "Vuelven los tags en las listas de stocks",
        "Corrección valores de acciones con delay para usuarios sin trii pro",
        "Actualización versiones de GitHub Actions",
      ],
    },
    {
      version: "3.0.54",
      items: [
        "Optimización pantalla de stock (soluciona efecto de carga que muestra valor -1)",
        "Movimientos de dividendos",
        "Opción de ocultar saldo se conserva al cerrar sesión",
        "Elección de moneda local o US se conserva al navegar por la aplicación",
        "Carrusel de banner para acciones locales y EE. UU",
        "Sección CDT en descubre",
        "Market hold para cambios en US Stocks Chile",
      ],
    },
    {
      version: "3.0.51",
      items: [
        "SDK Meta",
        "Conservar estado al ocultar saldo",
        "Lista de acciones sube en prioridad en vista de invertir",
        "Vuelve favoritos a la pantalla de inicio",
        "Lista de movimientos individual para US Stocks",
        "Filtros para ordenar acciones locales",
        "Corrección de estilos en los banners",
        "Corrección logos estirados al inicializar la app y actualizar slides de bienvenida",
      ],
    },
    {
      version: "3.0.46",
      items: [
        "CDTs Tuya",
        "Integración PostHog",
        "Cartola de movimientos en Chile",
        "Onboarding US Stocks",
        "Correcciones validaciones de ordenes en US Stocks",
        "Corrección problemas carga portafolio usuarios Perú",
        "Corrección validaciones para términos y condiciones",
      ],
    },
    {
      version: "3.0.36",
      items: [
        "Horarios de mercado para Fix 5.0",
        "Actualización términos y condiciones Perú",
        "Mejoras animación pantalla login",
        "Mejoras en diseño de trii 3.0",
      ],
    },
    {
      version: "3.0.31",
      tag: "🌲",
      items: [
        "Home completamente nuevo",
        "Pantalla de inversiones rediseñada",
        "Nuevo diseño en toda la app",
      ],
    },
    {
      version: "2.72.51",
      items: [
        "Icono de navidad",
        "Actualización de direcciones de Perú para fondos Blum",
        "Se corrige validación de precios límites",
      ],
    },
    {
      version: "2.72.38",
      items: [
        "Se elimina en los fondos en la tabla de rentabilidad los elementos duplicados",
        "Se corrige el error del calculo de min y max para la cantidad de acciones en ordenes a mercado",
      ],
    },
    {
      version: "2.72.37",
      items: [
        "Se arregla la pantalla de videos",
        "Se pone en más información del saldo el valor del marketHold",
        "Se corrige el error que no dejaba poner ninguna orden en cualquier tipo de subasta",
        "Se corrige el currency que se usa para el input y las validaciones",
      ],
    },
  ],
};
