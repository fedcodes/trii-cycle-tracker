// Domain + Supabase row types for the cycle tracker.

export type BetStatus =
  | "On track"
  | "Update"
  | "Not started"
  | "Listo"
  | "Blocked"
  | "Cooldown"
  | "Pushed";

export const BET_STATUSES: BetStatus[] = [
  "On track",
  "Update",
  "Not started",
  "Listo",
  "Blocked",
  "Cooldown",
  "Pushed",
];

// Catálogo global de objetivos (tabla `objectives`, editable desde Admin).
// `color` es un token CSS (obj-1 … obj-5, obj-99) — ver OBJ_COLOR_OPTIONS.
export interface ObjectiveRow {
  id: string;
  num: number;
  label: string; // "Obj. 1 — Escalar trii pro"
  short_name: string; // "Pro"
  color: string;
  short_description: string; // se muestra en la card de Discovery
  metric: string; // métricas de éxito, ej. "10% de penetración pro · Fin 2026"
  po: string; // "" = sin asignar
  designer: string; // "" = sin asignar
  active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CycleRow {
  id: string;
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  cooldown_start: string | null;
  cooldown_end: string | null;
  total_weeks: number;
  is_active: boolean;
  created_at: string;
}

export interface BetRow {
  id: string;
  cycle_id: string;
  name: string;
  objective_num: number;
  objective: string;
  team: string[];
  status: BetStatus;
  week_start: number;
  week_end: number;
  progress: number;
  last_update: string;
  dropped: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface BetUpdateRow {
  id: string;
  cycle_id: string;
  bet_id: string | null; // null = nota general del ciclo (solo weekly log)
  week: number;
  note: string;
  progress: number | null;
  status: string | null;
  created_at: string;
}

export type DiscoveryStageId = "backlog" | "research" | "design" | "ready";
export type DiscoveryPriority = "high" | "med" | "low";

export interface DiscoveryObjectiveRow {
  id: string;
  cycle_id: string;
  obj_num: number;
  name: string;
  short_name: string;
  description: string;
  metric: string;
  target: string;
  po: string | null;
  designer: string | null;
  context: string | null;
  position: number;
}

export interface DiscoveryTaskRow {
  id: string;
  cycle_id: string;
  objective_id: string | null; // null = sin objetivo (p. ej. objetivo desactivado)
  backlog_id: string | null; // idea del backlog de la que nació esta task
  name: string;
  stage: DiscoveryStageId;
  owner: string | null;
  designer: string | null;
  priority: DiscoveryPriority;
  figma: string | null;
  notes: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface DiscoveryStage {
  id: DiscoveryStageId;
  label: string;
  desc: string;
}
