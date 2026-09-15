// Thin typed data-access layer over Supabase.
// All mutations return the error message (or null) so callers can surface it.

import { getSupabase, type BacklogIdeaRow } from "./supabase";
import type {
  BetRow,
  BetUpdateRow,
  CycleRow,
  DiscoveryObjectiveRow,
  DiscoveryTaskRow,
  ObjectiveRow,
} from "./types";

// ── Objectives (catálogo global) ───────────────────────────

export async function fetchObjectives(): Promise<ObjectiveRow[]> {
  const { data, error } = await getSupabase()
    .from("objectives")
    .select("*")
    .order("num", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ObjectiveRow[];
}

export async function insertObjective(
  row: Omit<ObjectiveRow, "id" | "created_at" | "updated_at">
): Promise<{ data: ObjectiveRow | null; error: string | null }> {
  const { data, error } = await getSupabase().from("objectives").insert(row).select().single();
  return { data: (data as ObjectiveRow) ?? null, error: error?.message ?? null };
}

export async function updateObjective(
  id: string,
  patch: Partial<ObjectiveRow>
): Promise<string | null> {
  const { error } = await getSupabase().from("objectives").update(patch).eq("id", id);
  return error?.message ?? null;
}

export async function deleteObjective(id: string): Promise<string | null> {
  const { error } = await getSupabase().from("objectives").delete().eq("id", id);
  return error?.message ?? null;
}

export interface CycleData {
  cycle: CycleRow | null;
  bets: BetRow[];
  updates: BetUpdateRow[];
}

export async function fetchActiveCycle(): Promise<CycleRow | null> {
  const { data, error } = await getSupabase()
    .from("cycles")
    .select("*")
    .eq("is_active", true)
    .order("start_date", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return (data?.[0] as CycleRow) ?? null;
}

export async function fetchCycles(): Promise<CycleRow[]> {
  const { data, error } = await getSupabase()
    .from("cycles")
    .select("*")
    .order("start_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CycleRow[];
}

export async function fetchCycleData(cycleId: string): Promise<Omit<CycleData, "cycle">> {
  const sb = getSupabase();
  const bets = await sb
    .from("bets")
    .select("*")
    .eq("cycle_id", cycleId)
    .order("position", { ascending: true });
  if (bets.error) throw new Error(bets.error.message);
  const rows = (bets.data ?? []) as BetRow[];

  // Updates del ciclo + historial completo de las bets que vinieron de ciclos
  // anteriores (sus updates viejos conservan el cycle_id original).
  const carried = rows.filter((b) => b.carried_from_cycle_id).map((b) => b.id);
  const base = sb.from("bet_updates").select("*").order("created_at", { ascending: false });
  const updates = await (carried.length
    ? base.or(`cycle_id.eq.${cycleId},bet_id.in.(${carried.join(",")})`)
    : base.eq("cycle_id", cycleId));
  if (updates.error) throw new Error(updates.error.message);
  return { bets: rows, updates: (updates.data ?? []) as BetUpdateRow[] };
}

// Ciclos cerrados con las bets que quedaron en ellos (Listo, descartadas o no movidas).
export interface ArchiveData {
  cycles: CycleRow[];
  bets: BetRow[];
}

export async function fetchArchive(): Promise<ArchiveData> {
  const sb = getSupabase();
  const cycles = await sb
    .from("cycles")
    .select("*")
    .eq("is_active", false)
    .order("start_date", { ascending: false });
  if (cycles.error) throw new Error(cycles.error.message);
  const rows = (cycles.data ?? []) as CycleRow[];
  if (rows.length === 0) return { cycles: [], bets: [] };
  const bets = await sb
    .from("bets")
    .select("*")
    .in("cycle_id", rows.map((c) => c.id))
    .order("position", { ascending: true });
  if (bets.error) throw new Error(bets.error.message);
  return { cycles: rows, bets: (bets.data ?? []) as BetRow[] };
}

export type NewCycleInput = Pick<
  CycleRow,
  "name" | "start_date" | "end_date" | "cooldown_start" | "cooldown_end" | "total_weeks"
>;

// Transición de ciclo en una sola transacción (función create_next_cycle en schema.sql):
// desactiva el ciclo activo, crea el nuevo y mueve las bets indicadas.
export async function createNextCycle(
  input: NewCycleInput,
  previousCycleId: string | null,
  moveBetIds: string[]
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await getSupabase().rpc("create_next_cycle", {
    p_name: input.name,
    p_start_date: input.start_date,
    p_end_date: input.end_date,
    p_cooldown_start: input.cooldown_start,
    p_cooldown_end: input.cooldown_end,
    p_total_weeks: input.total_weeks,
    p_previous_cycle_id: previousCycleId,
    p_move_bet_ids: moveBetIds,
  });
  return { id: (data as string | null) ?? null, error: error?.message ?? null };
}

export async function updateCycle(id: string, patch: Partial<CycleRow>): Promise<string | null> {
  const { error } = await getSupabase().from("cycles").update(patch).eq("id", id);
  return error?.message ?? null;
}

export async function insertBet(
  row: Omit<BetRow, "id" | "created_at" | "updated_at">
): Promise<{ data: BetRow | null; error: string | null }> {
  const { data, error } = await getSupabase().from("bets").insert(row).select().single();
  return { data: (data as BetRow) ?? null, error: error?.message ?? null };
}

export async function updateBet(id: string, patch: Partial<BetRow>): Promise<string | null> {
  const { error } = await getSupabase().from("bets").update(patch).eq("id", id);
  return error?.message ?? null;
}

export async function deleteBet(id: string): Promise<string | null> {
  const { error } = await getSupabase().from("bets").delete().eq("id", id);
  return error?.message ?? null;
}

export async function insertBetUpdate(
  row: Omit<BetUpdateRow, "id" | "created_at">
): Promise<{ data: BetUpdateRow | null; error: string | null }> {
  const { data, error } = await getSupabase().from("bet_updates").insert(row).select().single();
  return { data: (data as BetUpdateRow) ?? null, error: error?.message ?? null };
}

export async function deleteBetUpdate(id: string): Promise<string | null> {
  const { error } = await getSupabase().from("bet_updates").delete().eq("id", id);
  return error?.message ?? null;
}

// ── Discovery ──────────────────────────────────────────────

export interface DiscoveryData {
  objectives: DiscoveryObjectiveRow[];
  tasks: DiscoveryTaskRow[];
}

export async function fetchDiscovery(cycleId: string): Promise<DiscoveryData> {
  const sb = getSupabase();
  const [objectives, tasks] = await Promise.all([
    sb
      .from("discovery_objectives")
      .select("*")
      .eq("cycle_id", cycleId)
      .order("position", { ascending: true }),
    sb
      .from("discovery_tasks")
      .select("*")
      .eq("cycle_id", cycleId)
      .order("position", { ascending: true }),
  ]);
  if (objectives.error) throw new Error(objectives.error.message);
  if (tasks.error) throw new Error(tasks.error.message);
  return {
    objectives: (objectives.data ?? []) as DiscoveryObjectiveRow[],
    tasks: (tasks.data ?? []) as DiscoveryTaskRow[],
  };
}

// Des-asigna las tasks de un objetivo (por num) en el ciclo activo.
// Se usa al desactivar un objetivo desde Admin.
export async function unassignObjectiveTasks(objNum: number): Promise<string | null> {
  const sb = getSupabase();
  const cycles = await sb.from("cycles").select("id").eq("is_active", true);
  if (cycles.error) return cycles.error.message;
  const cycleIds = (cycles.data ?? []).map((c) => c.id);
  if (cycleIds.length === 0) return null;
  const objs = await sb
    .from("discovery_objectives")
    .select("id")
    .in("cycle_id", cycleIds)
    .eq("obj_num", objNum);
  if (objs.error) return objs.error.message;
  const objIds = (objs.data ?? []).map((o) => o.id);
  if (objIds.length === 0) return null;
  const { error } = await sb
    .from("discovery_tasks")
    .update({ objective_id: null })
    .in("objective_id", objIds);
  return error?.message ?? null;
}

export async function insertDiscoveryObjective(
  row: Omit<DiscoveryObjectiveRow, "id">
): Promise<{ data: DiscoveryObjectiveRow | null; error: string | null }> {
  const { data, error } = await getSupabase()
    .from("discovery_objectives")
    .insert(row)
    .select()
    .single();
  return { data: (data as DiscoveryObjectiveRow) ?? null, error: error?.message ?? null };
}

export async function updateDiscoveryObjective(
  id: string,
  patch: Partial<DiscoveryObjectiveRow>
): Promise<string | null> {
  const { error } = await getSupabase().from("discovery_objectives").update(patch).eq("id", id);
  return error?.message ?? null;
}

export async function insertDiscoveryTask(
  row: Omit<DiscoveryTaskRow, "id" | "created_at" | "updated_at">
): Promise<{ data: DiscoveryTaskRow | null; error: string | null }> {
  const { data, error } = await getSupabase().from("discovery_tasks").insert(row).select().single();
  return { data: (data as DiscoveryTaskRow) ?? null, error: error?.message ?? null };
}

export async function updateDiscoveryTask(
  id: string,
  patch: Partial<DiscoveryTaskRow>
): Promise<string | null> {
  const { error } = await getSupabase().from("discovery_tasks").update(patch).eq("id", id);
  return error?.message ?? null;
}

export async function deleteDiscoveryTask(id: string): Promise<string | null> {
  const { error } = await getSupabase().from("discovery_tasks").delete().eq("id", id);
  return error?.message ?? null;
}

// ── Backlog (tabla backlog_ideas — fuente de ideas para Discovery) ──

export async function fetchBacklogIdeas(): Promise<BacklogIdeaRow[]> {
  const { data, error } = await getSupabase()
    .from("backlog_ideas")
    .select("*")
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as BacklogIdeaRow[];
}

export async function updateBacklogIdea(
  id: string,
  patch: Partial<BacklogIdeaRow>
): Promise<string | null> {
  const { error } = await getSupabase().from("backlog_ideas").update(patch).eq("id", id);
  return error?.message ?? null;
}
