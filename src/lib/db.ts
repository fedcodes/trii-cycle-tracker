// Thin typed data-access layer over Supabase.
// All mutations return the error message (or null) so callers can surface it.

import { getSupabase } from "./supabase";
import type {
  BetRow,
  BetUpdateRow,
  CycleRow,
  DiscoveryObjectiveRow,
  DiscoveryTaskRow,
} from "./types";

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

export async function fetchCycleData(cycleId: string): Promise<Omit<CycleData, "cycle">> {
  const sb = getSupabase();
  const [bets, updates] = await Promise.all([
    sb.from("bets").select("*").eq("cycle_id", cycleId).order("position", { ascending: true }),
    sb.from("bet_updates").select("*").eq("cycle_id", cycleId).order("created_at", { ascending: false }),
  ]);
  if (bets.error) throw new Error(bets.error.message);
  if (updates.error) throw new Error(updates.error.message);
  return { bets: (bets.data ?? []) as BetRow[], updates: (updates.data ?? []) as BetUpdateRow[] };
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
  const objectives = await sb
    .from("discovery_objectives")
    .select("*")
    .eq("cycle_id", cycleId)
    .order("position", { ascending: true });
  if (objectives.error) throw new Error(objectives.error.message);
  const objs = (objectives.data ?? []) as DiscoveryObjectiveRow[];
  if (objs.length === 0) return { objectives: [], tasks: [] };
  const tasks = await sb
    .from("discovery_tasks")
    .select("*")
    .in("objective_id", objs.map((o) => o.id))
    .order("position", { ascending: true });
  if (tasks.error) throw new Error(tasks.error.message);
  return { objectives: objs, tasks: (tasks.data ?? []) as DiscoveryTaskRow[] };
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
