// Conexión backlog ↔ discovery: mapeos y el flujo de importar una idea
// del backlog como task del tablero del ciclo (linkeada por backlog_id).

import { getSupabase, type BacklogIdeaRow, type BacklogStatus } from "./supabase";
import type { DiscoveryStageId, DiscoveryTaskRow } from "./types";

// Al mover una task nacida del backlog entre etapas, su idea se sincroniza.
export const STAGE_TO_BACKLOG_STATUS: Record<DiscoveryStageId, BacklogStatus> = {
  backlog: "In Discovery",
  research: "In Discovery",
  design: "In Design",
  ready: "Completed Design",
};

export function backlogStatusToStage(status: BacklogStatus): DiscoveryStageId {
  if (status === "In Design") return "design";
  if (status === "Completed Design") return "ready";
  if (status === "In Discovery") return "research";
  return "backlog";
}

// Mapeo best-effort del objetivo de negocio del backlog → objetivo estratégico.
export function objNumForBacklogObjective(objective: string): number | null {
  const o = objective.toLowerCase();
  if (o.includes("pro")) return 1; // trii Pro / triiPro
  if (o.includes("expansi")) return 2; // Expansion / Expansión
  if (o.includes("activaci")) return 4; // Activación
  if (o.startsWith("fondos")) return 5; // Fondos
  if (o.includes("deuda")) return 98; // Deuda tecnica → Arquitectura
  return null;
}

export interface ImportResult {
  task: DiscoveryTaskRow | null;
  // Status nuevo de la idea si se sincronizó (null = quedó igual).
  syncedStatus: BacklogStatus | null;
  error: string | null;
}

export async function importBacklogIdeaToDiscovery(
  cycleId: string,
  idea: BacklogIdeaRow
): Promise<ImportResult> {
  const sb = getSupabase();

  const existing = await sb
    .from("discovery_tasks")
    .select("id")
    .eq("cycle_id", cycleId)
    .eq("backlog_id", idea.id)
    .limit(1);
  if (existing.error) return { task: null, syncedStatus: null, error: existing.error.message };
  if ((existing.data ?? []).length)
    return { task: null, syncedStatus: null, error: "La idea ya está en el tablero de discovery" };

  const stage = backlogStatusToStage(idea.status);
  const objNum = objNumForBacklogObjective(idea.objective);
  let objective_id: string | null = null;
  if (objNum != null) {
    const objs = await sb
      .from("discovery_objectives")
      .select("id")
      .eq("cycle_id", cycleId)
      .eq("obj_num", objNum)
      .limit(1);
    if (!objs.error && objs.data?.length) objective_id = objs.data[0].id;
  }

  const pos = await sb
    .from("discovery_tasks")
    .select("position")
    .eq("cycle_id", cycleId)
    .order("position", { ascending: false })
    .limit(1);
  const position = pos.data?.length ? pos.data[0].position + 1 : 0;

  const meta = [idea.vertical, (idea.countries || []).join(" · ")].filter(Boolean);
  const ins = await sb
    .from("discovery_tasks")
    .insert({
      cycle_id: cycleId,
      objective_id,
      backlog_id: idea.id,
      name: idea.idea,
      stage,
      owner: idea.responsable || null,
      designer: null,
      priority: "med",
      figma: null,
      notes: meta.length ? `Del backlog · ${meta.join(" · ")}` : "Del backlog",
      position,
    })
    .select()
    .single();
  if (ins.error || !ins.data)
    return {
      task: null,
      syncedStatus: null,
      error: ins.error?.message ?? "No se pudo importar la idea",
    };

  // Si la idea aún no estaba marcada en discovery, se actualiza su status.
  const status = STAGE_TO_BACKLOG_STATUS[stage];
  let syncedStatus: BacklogStatus | null = null;
  if (idea.status !== status) {
    const up = await sb.from("backlog_ideas").update({ status }).eq("id", idea.id);
    if (!up.error) syncedStatus = status;
  }

  return { task: ins.data as DiscoveryTaskRow, syncedStatus, error: null };
}
