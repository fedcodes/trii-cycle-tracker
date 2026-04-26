"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CYCLE } from "@/data/cycle";
import {
  getSupabase,
  type BacklogIdeaRow,
  type BacklogSize,
  type BacklogStatus,
} from "@/lib/supabase";

const COUNTRIES = ["CO", "CL", "PE", "Backend", "CX"] as const;
const SIZES: BacklogSize[] = ["S", "M", "L", "XL"];
const STATUSES: BacklogStatus[] = [
  "Pending",
  "In Discovery",
  "In Design",
  "Completed Design",
  "In Betting Table",
  "In Development",
  "Completed",
  "Not Doing",
];

type Tone = { fg: string; bg: string; dot?: string };

const STATUS_TONE: Record<BacklogStatus, Tone> = {
  Pending: { fg: "rgb(var(--fg-3))", bg: "rgb(var(--surface-2))", dot: "rgb(var(--fg-4))" },
  "In Discovery": { fg: "rgb(var(--obj-2))", bg: "rgb(var(--obj-2-dim))", dot: "rgb(var(--obj-2))" },
  "In Design": { fg: "rgb(var(--obj-5))", bg: "rgb(var(--obj-5-dim))", dot: "rgb(var(--obj-5))" },
  "Completed Design": { fg: "rgb(var(--obj-1))", bg: "rgb(var(--obj-1-dim))", dot: "rgb(var(--obj-1))" },
  "In Betting Table": { fg: "rgb(var(--yellow))", bg: "rgb(var(--yellow-dim))", dot: "rgb(var(--yellow))" },
  "In Development": { fg: "rgb(var(--orange))", bg: "rgb(var(--orange-dim))", dot: "rgb(var(--orange))" },
  Completed: { fg: "rgb(var(--primary))", bg: "rgb(var(--primary-dim))", dot: "rgb(var(--primary))" },
  "Not Doing": { fg: "rgb(var(--fg-4))", bg: "rgb(var(--surface-1))", dot: "rgb(var(--fg-4))" },
};

const COUNTRY_TONE: Record<string, Tone> = {
  CO: { fg: "rgb(var(--obj-3))", bg: "rgb(var(--obj-3-dim))" },
  CL: { fg: "rgb(var(--obj-2))", bg: "rgb(var(--obj-2-dim))" },
  PE: { fg: "rgb(var(--obj-5))", bg: "rgb(var(--obj-5-dim))" },
  Backend: { fg: "rgb(var(--obj-1))", bg: "rgb(var(--obj-1-dim))" },
  CX: { fg: "rgb(var(--obj-4))", bg: "rgb(var(--obj-4-dim))" },
};

type PrioCode = "P0" | "P1" | "P2" | "P3" | "P4" | "P5";
const PRIO_DEFS: Record<PrioCode, { label: string; tone: string; dim: string }> = {
  P0: { label: "QUICK WINS", tone: "rgb(var(--primary))", dim: "rgb(var(--primary-dim))" },
  P1: { label: "STRATEGIC BETS", tone: "rgb(var(--obj-2))", dim: "rgb(var(--obj-2-dim))" },
  P2: { label: "BIG PROJECTS", tone: "rgb(var(--obj-5))", dim: "rgb(var(--obj-5-dim))" },
  P3: { label: "FILL IN", tone: "rgb(var(--obj-1))", dim: "rgb(var(--obj-1-dim))" },
  P4: { label: "NICE TO HAVE", tone: "rgb(var(--fg-3))", dim: "rgb(var(--surface-2))" },
  P5: { label: "RECONSIDER", tone: "rgb(var(--error))", dim: "rgb(var(--error-dim))" },
};

const PRIO_MATRIX: Record<"S" | "M" | "L" | "XL", PrioCode[]> = {
  S: ["P3", "P4", "P5", "P5"],
  M: ["P3", "P4", "P4", "P5"],
  L: ["P0", "P1", "P1", "P2"],
  XL: ["P0", "P1", "P2", "P2"],
};

function calcPrio(impact: BacklogSize, effort: BacklogSize): PrioCode | null {
  if (!impact || !effort) return null;
  const row = PRIO_MATRIX[impact as "S" | "M" | "L" | "XL"];
  if (!row) return null;
  const col = SIZES.indexOf(effort);
  if (col < 0) return null;
  return row[col];
}

export default function BacklogTab() {
  const [items, setItems] = useState<BacklogIdeaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | BacklogStatus>("All");
  const [prioFilter, setPrioFilter] = useState<"All" | PrioCode>("All");
  const [countryFilter, setCountryFilter] = useState<"All" | (typeof COUNTRIES)[number]>("All");
  const [hideDone, setHideDone] = useState(true);
  const [newRowIds, setNewRowIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await getSupabase()
        .from("backlog_ideas")
        .select("*")
        .order("position", { ascending: true });
      if (cancelled) return;
      if (error) {
        setError(error.message);
      } else {
        setItems((data ?? []) as BacklogIdeaRow[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = async (id: string, patch: Partial<BacklogIdeaRow>) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error } = await getSupabase().from("backlog_ideas").update(patch).eq("id", id);
    if (error) setError(error.message);
  };

  const del = async (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    const { error } = await getSupabase().from("backlog_ideas").delete().eq("id", id);
    if (error) setError(error.message);
  };

  const addNew = async () => {
    const minPos = items.length ? Math.min(...items.map((i) => i.position)) : 0;
    const insertRow = {
      vertical: "",
      idea: "",
      objective: "",
      responsable: "",
      countries: [] as string[],
      impact: "" as BacklogSize,
      effort: "" as BacklogSize,
      status: "Pending" as BacklogStatus,
      position: minPos - 1,
    };
    const { data, error } = await getSupabase()
      .from("backlog_ideas")
      .insert(insertRow)
      .select()
      .single();
    if (error || !data) {
      setError(error?.message ?? "Failed to insert");
      return;
    }
    const fresh = data as BacklogIdeaRow;
    setItems((prev) => [fresh, ...prev]);
    setNewRowIds((prev) => new Set(prev).add(fresh.id));
    setTimeout(() => {
      setNewRowIds((prev) => {
        const n = new Set(prev);
        n.delete(fresh.id);
        return n;
      });
    }, 1800);
  };

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (hideDone && (it.status === "Completed" || it.status === "Not Doing")) return false;
      if (
        search &&
        !`${it.idea} ${it.objective} ${it.vertical} ${it.responsable}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;
      if (statusFilter !== "All" && it.status !== statusFilter) return false;
      if (prioFilter !== "All" && calcPrio(it.impact, it.effort) !== prioFilter) return false;
      if (countryFilter !== "All" && !(it.countries || []).includes(countryFilter)) return false;
      return true;
    });
  }, [items, search, statusFilter, prioFilter, countryFilter, hideDone]);

  return (
    <div style={{ background: "rgb(var(--bg))", color: "rgb(var(--fg))" }}>
      <BacklogSummary items={items} />

      <div
        style={{
          padding: "18px 28px 12px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center" }}>
            <span>Backlog de ideas</span>
            <PrioMatrixInfo />
          </div>
          <div style={{ fontSize: 11, color: "rgb(var(--fg-3))", marginTop: 2 }}>
            Orden manual · prioridad calculada por matriz Impact × Effort · {CYCLE.lastUpdated}
          </div>
        </div>
      </div>

      <FilterBar
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        prioFilter={prioFilter}
        setPrioFilter={setPrioFilter}
        countryFilter={countryFilter}
        setCountryFilter={setCountryFilter}
        hideDone={hideDone}
        setHideDone={setHideDone}
        total={items.length}
        shown={filtered.length}
      />

      <div style={{ padding: "10px 28px 0" }}>
        <button
          onClick={addNew}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "7px 12px",
            background: "rgb(var(--primary-dim))",
            color: "rgb(var(--primary))",
            border: "1px solid rgb(var(--primary-dim))",
            borderRadius: 5,
            fontFamily: "inherit",
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: "-0.003em",
            cursor: "pointer",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M6 2 V10 M2 6 H10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Nueva idea
          <span
            style={{
              fontSize: 9.5,
              color: "rgb(var(--primary))",
              opacity: 0.7,
              fontWeight: 500,
              marginLeft: 4,
            }}
          >
            se inserta arriba
          </span>
        </button>
      </div>

      <div
        style={{
          margin: "10px 28px 28px",
          border: "1px solid rgb(var(--surface-2))",
          borderRadius: 8,
          overflowX: "clip",
          overflowY: "visible",
          background: "rgb(var(--surface-0))",
        }}
      >
        <div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "auto",
              fontFamily: "inherit",
            }}
          >
            <thead>
              <tr>
                <HeaderCell width={50}>#</HeaderCell>
                <HeaderCell width={140}>Vertical</HeaderCell>
                <HeaderCell>Idea</HeaderCell>
                <HeaderCell width={140}>Objetivo</HeaderCell>
                <HeaderCell width={140}>Responsable</HeaderCell>
                <HeaderCell width={170}>País / Equipo</HeaderCell>
                <HeaderCell width={70} align="center">Impact</HeaderCell>
                <HeaderCell width={70} align="center">Effort</HeaderCell>
                <HeaderCell width={125}>Prioritization</HeaderCell>
                <HeaderCell width={150}>Status</HeaderCell>
                <th
                  style={{
                    padding: "9px 10px",
                    borderBottom: "1px solid rgb(var(--surface-2))",
                    width: 28,
                    background: "rgb(var(--surface-1))",
                  }}
                />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={11}
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: "rgb(var(--fg-4))",
                      fontSize: 11.5,
                    }}
                  >
                    Cargando ideas…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={11}
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: "rgb(var(--error))",
                      fontSize: 11.5,
                    }}
                  >
                    Error: {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: "rgb(var(--fg-4))",
                      fontSize: 11.5,
                    }}
                  >
                    No hay items que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filtered.map((it) => {
                  const realIdx = items.findIndex((x) => x.id === it.id);
                  return (
                    <BacklogRow
                      key={it.id}
                      item={it}
                      idx={realIdx}
                      onUpdate={update}
                      onDelete={del}
                      isNew={newRowIds.has(it.id)}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        style={{
          padding: "0 28px 24px",
          fontSize: 10.5,
          color: "rgb(var(--fg-4))",
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <span>↑ ↓ Reordenar manualmente</span>
        <span>•</span>
        <span>Click en cualquier celda para editar</span>
        <span>•</span>
        <span>Prioritization se recalcula automáticamente al cambiar Impact o Effort</span>
      </div>
    </div>
  );
}

function HeaderCell({
  children,
  width,
  align = "left",
}: {
  children?: React.ReactNode;
  width?: number;
  align?: "left" | "center" | "right";
}) {
  return (
    <th
      style={{
        padding: "9px 10px",
        borderRight: "1px solid rgb(var(--surface-2))",
        borderBottom: "1px solid rgb(var(--surface-2))",
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: "rgb(var(--fg-3))",
        textTransform: "uppercase",
        textAlign: align,
        width,
        position: "sticky",
        top: 0,
        background: "rgb(var(--surface-1))",
        zIndex: 1,
      }}
    >
      {children}
    </th>
  );
}

function BacklogSummary({ items }: { items: BacklogIdeaRow[] }) {
  const counts: Record<string, number> = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  items.forEach((it) => {
    if (counts[it.status] !== undefined) counts[it.status] += 1;
  });
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${STATUSES.length}, 1fr)`,
        borderBottom: "1px solid rgb(var(--surface-2))",
      }}
    >
      {STATUSES.map((s, i) => {
        const tone = STATUS_TONE[s];
        return (
          <div
            key={s}
            style={{
              padding: "14px 16px",
              borderLeft: i === 0 ? "none" : "1px solid rgb(var(--surface-2))",
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: tone.fg,
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: 6,
                lineHeight: 1.25,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: tone.dot,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {s}
              </span>
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                marginTop: 4,
                color: "rgb(var(--fg))",
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {counts[s]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FilterBar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  prioFilter,
  setPrioFilter,
  countryFilter,
  setCountryFilter,
  hideDone,
  setHideDone,
  total,
  shown,
}: {
  search: string;
  setSearch: (v: string) => void;
  statusFilter: "All" | BacklogStatus;
  setStatusFilter: (v: "All" | BacklogStatus) => void;
  prioFilter: "All" | PrioCode;
  setPrioFilter: (v: "All" | PrioCode) => void;
  countryFilter: "All" | (typeof COUNTRIES)[number];
  setCountryFilter: (v: "All" | (typeof COUNTRIES)[number]) => void;
  hideDone: boolean;
  setHideDone: (v: boolean) => void;
  total: number;
  shown: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        padding: "12px 28px",
        borderBottom: "1px solid rgb(var(--surface-2))",
        background: "rgb(var(--surface-0))",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgb(var(--surface-1))",
          border: "1px solid rgb(var(--surface-2))",
          borderRadius: 5,
          padding: "5px 9px",
          width: 240,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <circle cx="5" cy="5" r="3.5" stroke="rgb(var(--fg-3))" strokeWidth="1.2" />
          <path d="M7.5 7.5 L10 10" stroke="rgb(var(--fg-3))" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar idea…"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "inherit",
            fontSize: 11.5,
            color: "rgb(var(--fg))",
          }}
        />
      </div>

      <FilterDropdown
        label="Status"
        value={statusFilter}
        options={["All", ...STATUSES]}
        onChange={(v) => setStatusFilter(v as "All" | BacklogStatus)}
      />
      <FilterDropdown
        label="Prio"
        value={prioFilter}
        options={["All", "P0", "P1", "P2", "P3", "P4", "P5"]}
        onChange={(v) => setPrioFilter(v as "All" | PrioCode)}
      />
      <FilterDropdown
        label="Country"
        value={countryFilter}
        options={["All", ...COUNTRIES]}
        onChange={(v) => setCountryFilter(v as "All" | (typeof COUNTRIES)[number])}
      />

      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: "rgb(var(--fg-2))",
          cursor: "pointer",
          userSelect: "none",
          padding: "5px 10px",
          borderRadius: 5,
          background: hideDone ? "rgb(var(--surface-2))" : "transparent",
          border: "1px solid rgb(var(--surface-2))",
        }}
      >
        <input
          type="checkbox"
          checked={hideDone}
          onChange={(e) => setHideDone(e.target.checked)}
          style={{ accentColor: "rgb(var(--primary))", width: 12, height: 12 }}
        />
        Hide Completed + Not Doing
      </label>

      <div style={{ flex: 1 }} />

      <span
        style={{
          fontSize: 10.5,
          color: "rgb(var(--fg-3))",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.02em",
        }}
      >
        {shown === total ? `${total} items` : `${shown} of ${total} items`}
      </span>
    </div>
  );
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "rgb(var(--surface-1))",
        border: "1px solid rgb(var(--surface-2))",
        borderRadius: 5,
        padding: "0 8px",
        height: 27,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.04em",
          color: "rgb(var(--fg-3))",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          background: "transparent",
          border: "none",
          outline: "none",
          color: "rgb(var(--fg))",
          fontFamily: "inherit",
          fontSize: 11.5,
          fontWeight: 500,
          padding: "4px 14px 4px 0",
          cursor: "pointer",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath d='M1 2.5L4 5.5L7 2.5' stroke='%23808080' stroke-width='1.2' fill='none'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right center",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function BacklogRow({
  item,
  idx,
  onUpdate,
  onDelete,
  isNew,
}: {
  item: BacklogIdeaRow;
  idx: number;
  onUpdate: (id: string, patch: Partial<BacklogIdeaRow>) => void;
  onDelete: (id: string) => void;
  isNew: boolean;
}) {
  const prio = calcPrio(item.impact, item.effort);
  const dimmed = item.status === "Not Doing" || item.status === "Completed";
  const cellStyle: React.CSSProperties = {
    padding: "6px 10px",
    borderRight: "1px solid rgb(var(--surface-2))",
    verticalAlign: "middle",
    opacity: dimmed ? 0.55 : 1,
  };

  return (
    <tr
      style={{
        borderBottom: "1px solid rgb(var(--surface-2))",
        background: isNew ? "rgb(var(--primary-dim))" : "transparent",
        transition: "background 600ms ease",
      }}
    >
      <td style={{ ...cellStyle, padding: "6px 8px 6px 10px", opacity: 1, width: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgb(var(--fg-4))" }}>
          <span
            title="Arrastrar para reordenar"
            style={{
              cursor: "grab",
              padding: "2px 1px",
              display: "inline-flex",
              alignItems: "center",
              color: "rgb(var(--fg-4))",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgb(var(--fg-2))")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgb(var(--fg-4))")}
          >
            <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
              <circle cx="3" cy="3" r="1" />
              <circle cx="7" cy="3" r="1" />
              <circle cx="3" cy="7" r="1" />
              <circle cx="7" cy="7" r="1" />
              <circle cx="3" cy="11" r="1" />
              <circle cx="7" cy="11" r="1" />
            </svg>
          </span>
          <span
            style={{
              fontSize: 10,
              fontVariantNumeric: "tabular-nums",
              color: "rgb(var(--fg-4))",
              fontWeight: 600,
            }}
          >
            {idx + 1}
          </span>
        </div>
      </td>

      <td style={{ ...cellStyle, width: 140 }}>
        <InlineText
          value={item.vertical}
          onChange={(v) => onUpdate(item.id, { vertical: v })}
          placeholder="Vertical…"
          fontSize={11}
          weight={500}
          color="rgb(var(--fg-2))"
        />
      </td>

      <td style={{ ...cellStyle, minWidth: 180 }}>
        <InlineText
          value={item.idea}
          onChange={(v) => onUpdate(item.id, { idea: v })}
          placeholder="Nueva idea…"
          fontSize={11.5}
          weight={600}
          multiline
        />
      </td>

      <td style={{ ...cellStyle, width: 140 }}>
        <InlineText
          value={item.objective}
          onChange={(v) => onUpdate(item.id, { objective: v })}
          placeholder="Objetivo de negocio…"
          fontSize={11}
          weight={400}
          color="rgb(var(--fg-2))"
          multiline
        />
      </td>

      <td style={{ ...cellStyle, width: 140 }}>
        <InlineText
          value={item.responsable}
          onChange={(v) => onUpdate(item.id, { responsable: v })}
          placeholder="Responsable…"
          fontSize={11}
          weight={500}
          color="rgb(var(--fg-2))"
        />
      </td>

      <td style={{ ...cellStyle, width: 170 }}>
        <CountryPills
          values={item.countries || []}
          onChange={(v) => onUpdate(item.id, { countries: v })}
        />
      </td>

      <td style={{ ...cellStyle, width: 70 }}>
        <ChipDropdown
          value={item.impact}
          options={SIZES}
          onChange={(v) => onUpdate(item.id, { impact: v as BacklogSize })}
          placeholder="—"
        />
      </td>

      <td style={{ ...cellStyle, width: 70 }}>
        <ChipDropdown
          value={item.effort}
          options={SIZES}
          onChange={(v) => onUpdate(item.id, { effort: v as BacklogSize })}
          placeholder="—"
        />
      </td>

      <td style={{ ...cellStyle, width: 125 }}>
        <PrioBadge prio={prio} />
      </td>

      <td style={{ ...cellStyle, width: 150, borderRight: "none" }}>
        <StatusCell
          value={item.status}
          onChange={(v) => onUpdate(item.id, { status: v })}
        />
      </td>

      <td style={{ padding: "6px 8px 6px 4px", verticalAlign: "middle", width: 28 }}>
        <DeleteButton onConfirm={() => onDelete(item.id)} />
      </td>
    </tr>
  );
}

function InlineText({
  value,
  onChange,
  placeholder,
  fontSize = 11.5,
  weight = 500,
  color = "rgb(var(--fg))",
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  fontSize?: number;
  weight?: number;
  color?: string;
  multiline?: boolean;
}) {
  const [local, setLocal] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    setLocal(value);
  }, [value]);

  const baseStyle: React.CSSProperties = {
    background: "transparent",
    border: "1px solid transparent",
    color,
    fontFamily: "inherit",
    fontSize,
    fontWeight: weight,
    letterSpacing: "-0.003em",
    padding: "4px 6px",
    borderRadius: 3,
    width: "100%",
    outline: "none",
    lineHeight: 1.4,
  };

  useLayoutEffect(() => {
    if (!multiline) return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [local, multiline]);

  if (multiline) {
    return (
      <textarea
        ref={textareaRef}
        rows={1}
        value={local || ""}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={(e) => {
          e.currentTarget.style.background = "transparent";
          if (local !== value) onChange(local);
        }}
        onFocus={(e) => (e.currentTarget.style.background = "rgb(var(--surface-2))")}
        placeholder={placeholder}
        style={{
          ...baseStyle,
          display: "block",
          resize: "none",
          overflow: "hidden",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
        }}
      />
    );
  }

  return (
    <input
      value={local || ""}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={(e) => {
        e.currentTarget.style.background = "transparent";
        if (local !== value) onChange(local);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      onFocus={(e) => (e.currentTarget.style.background = "rgb(var(--surface-2))")}
      placeholder={placeholder}
      style={baseStyle}
    />
  );
}

function ChipDropdown({
  value,
  options,
  onChange,
  placeholder,
  tone,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  tone?: Tone;
}) {
  const t = tone || { fg: "rgb(var(--fg))", bg: "rgb(var(--surface-2))" };
  return (
    <div style={{ position: "relative", display: "inline-block", width: "auto" }}>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          background: t.bg,
          color: t.fg,
          border: "1px solid transparent",
          borderRadius: 4,
          padding: "3px 18px 3px 8px",
          fontFamily: "inherit",
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: "0.02em",
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
        }}
      >
        {placeholder && !value && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <svg
        width="8"
        height="8"
        viewBox="0 0 8 8"
        style={{
          position: "absolute",
          right: 6,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: t.fg,
          opacity: 0.7,
        }}
      >
        <path d="M1 2.5 L4 5.5 L7 2.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
    </div>
  );
}

function StatusCell({
  value,
  onChange,
}: {
  value: BacklogStatus;
  onChange: (v: BacklogStatus) => void;
}) {
  const t = STATUS_TONE[value] || STATUS_TONE.Pending;
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as BacklogStatus)}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          background: t.bg,
          color: t.fg,
          border: "none",
          borderRadius: 4,
          padding: "3px 18px 3px 18px",
          fontFamily: "inherit",
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: "0.005em",
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
        }}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <span
        style={{
          position: "absolute",
          left: 7,
          top: "50%",
          transform: "translateY(-50%)",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: t.dot,
          pointerEvents: "none",
        }}
      />
      <svg
        width="8"
        height="8"
        viewBox="0 0 8 8"
        style={{
          position: "absolute",
          right: 6,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: t.fg,
          opacity: 0.7,
        }}
      >
        <path d="M1 2.5 L4 5.5 L7 2.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
    </div>
  );
}

function CountryPills({
  values,
  onChange,
}: {
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  const toggle = (c: string) => {
    const has = values.includes(c);
    onChange(has ? values.filter((v) => v !== c) : [...values, c]);
  };
  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 4,
        flexWrap: "wrap",
      }}
    >
      {values.length === 0 && (
        <span style={{ fontSize: 10, color: "rgb(var(--fg-4))", fontStyle: "italic" }}>—</span>
      )}
      {values.map((c) => {
        const t = COUNTRY_TONE[c] || COUNTRY_TONE.CO;
        return (
          <span
            key={c}
            style={{
              background: t.bg,
              color: t.fg,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.04em",
              padding: "2px 6px",
              borderRadius: 3,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {c}
          </span>
        );
      })}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Editar países / equipos"
        style={{
          width: 18,
          height: 18,
          borderRadius: 3,
          border: "1px dashed rgb(var(--surface-2))",
          background: "transparent",
          color: "rgb(var(--fg-4))",
          fontSize: 11,
          lineHeight: 1,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "inherit",
        }}
      >
        +
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            background: "rgb(var(--surface-1))",
            border: "1px solid rgb(var(--surface-2))",
            borderRadius: 6,
            padding: 6,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            zIndex: 30,
            minWidth: 140,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {COUNTRIES.map((c) => {
            const t = COUNTRY_TONE[c];
            const has = values.includes(c);
            return (
              <button
                key={c}
                onClick={() => toggle(c)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 8px",
                  background: has ? "rgb(var(--surface-2))" : "transparent",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  textAlign: "left",
                  color: "rgb(var(--fg-2))",
                  fontFamily: "inherit",
                  fontSize: 11,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: `1px solid ${has ? t.fg : "rgb(var(--surface-2))"}`,
                    background: has ? t.fg : "transparent",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {has && (
                    <svg width="9" height="9" viewBox="0 0 9 9">
                      <path
                        d="M1.5 4.5 L3.5 6.5 L7.5 2"
                        stroke="rgb(var(--bg))"
                        strokeWidth="1.5"
                        fill="none"
                      />
                    </svg>
                  )}
                </span>
                <span
                  style={{
                    background: t.bg,
                    color: t.fg,
                    fontSize: 9.5,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 3,
                    letterSpacing: "0.04em",
                  }}
                >
                  {c}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PrioBadge({ prio }: { prio: PrioCode | null }) {
  if (!prio) {
    return (
      <span style={{ fontSize: 10, color: "rgb(var(--fg-4))", fontStyle: "italic" }}>—</span>
    );
  }
  const def = PRIO_DEFS[prio];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: def.dim,
        borderRadius: 4,
        padding: "3px 7px 3px 6px",
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: def.tone,
          letterSpacing: "0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {prio}
      </span>
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: def.tone,
          opacity: 0.85,
          letterSpacing: "0.06em",
        }}
      >
        {def.label}
      </span>
    </div>
  );
}

function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!confirming) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setConfirming(false);
    };
    document.addEventListener("mousedown", onDoc);
    const t = setTimeout(() => setConfirming(false), 4000);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      clearTimeout(t);
    };
  }, [confirming]);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        title="Eliminar idea"
        style={{
          width: 22,
          height: 22,
          borderRadius: 4,
          border: "none",
          background: "transparent",
          color: "rgb(var(--fg-4))",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "rgb(var(--error))";
          e.currentTarget.style.background = "rgb(var(--error-dim))";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "rgb(var(--fg-4))";
          e.currentTarget.style.background = "transparent";
        }}
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 3.5 H11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path
            d="M5.5 3.5 V2.5 A1 1 0 0 1 6.5 1.5 H7.5 A1 1 0 0 1 8.5 2.5 V3.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M3.5 3.5 V11.5 A1 1 0 0 0 4.5 12.5 H9.5 A1 1 0 0 0 10.5 11.5 V3.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path d="M5.75 6 V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M8.25 6 V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>
    );
  }
  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <button
        onClick={() => onConfirm()}
        title="Confirmar eliminación"
        style={{
          padding: "3px 8px",
          background: "rgb(var(--error-dim))",
          color: "rgb(var(--error))",
          border: "1px solid rgb(var(--error))",
          borderRadius: 4,
          fontFamily: "inherit",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Eliminar
      </button>
      <button
        onClick={() => setConfirming(false)}
        title="Cancelar"
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          border: "1px solid rgb(var(--surface-2))",
          background: "rgb(var(--surface-1))",
          color: "rgb(var(--fg-3))",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "inherit",
        }}
      >
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
          <path
            d="M2.5 2.5 L7.5 7.5 M7.5 2.5 L2.5 7.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

function PrioMatrixInfo() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <span
      ref={ref}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        title="Ver matriz Impact × Effort"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: open ? "rgb(var(--surface-2))" : "transparent",
          border: "1px solid rgb(var(--surface-2))",
          color: "rgb(var(--fg-3))",
          cursor: "pointer",
          fontFamily: "inherit",
          padding: 0,
          marginLeft: 6,
          verticalAlign: "middle",
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = "rgb(var(--surface-1))";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = "transparent";
        }}
      >
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="2.5" r="0.7" fill="currentColor" />
          <path d="M5 4.5 V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 40,
            padding: "12px 14px",
            background: "rgb(var(--surface-1))",
            border: "1px solid rgb(var(--surface-2))",
            borderRadius: 8,
            boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minWidth: 320,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "-0.005em",
                color: "rgb(var(--fg))",
              }}
            >
              Matriz Impact × Effort
            </div>
            <div style={{ fontSize: 9.5, color: "rgb(var(--fg-4))", letterSpacing: "0.04em" }}>
              ICE-style
            </div>
          </div>
          <div style={{ fontSize: 10.5, color: "rgb(var(--fg-3))", lineHeight: 1.45 }}>
            La prioridad de cada idea se calcula automáticamente según su Impact y Effort.
          </div>
          <table style={{ borderCollapse: "collapse", fontSize: 9.5, marginTop: 2 }}>
            <thead>
              <tr>
                <th
                  style={{
                    padding: "3px 6px",
                    color: "rgb(var(--fg-4))",
                    fontWeight: 500,
                    textAlign: "left",
                  }}
                >
                  Impact ↓ / Effort →
                </th>
                {SIZES.map((s) => (
                  <th
                    key={s}
                    style={{
                      padding: "3px 8px",
                      color: "rgb(var(--fg-3))",
                      fontWeight: 700,
                    }}
                  >
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...SIZES].reverse().map((impact) => (
                <tr key={impact}>
                  <td
                    style={{
                      padding: "3px 6px",
                      color: "rgb(var(--fg-3))",
                      fontWeight: 700,
                    }}
                  >
                    {impact}
                  </td>
                  {SIZES.map((effort, i) => {
                    const p = PRIO_MATRIX[impact as "S" | "M" | "L" | "XL"][i];
                    const def = PRIO_DEFS[p];
                    return (
                      <td key={effort} style={{ padding: 2 }}>
                        <div
                          style={{
                            background: def.dim,
                            color: def.tone,
                            fontWeight: 700,
                            padding: "4px 6px",
                            borderRadius: 3,
                            textAlign: "center",
                            fontSize: 9.5,
                            letterSpacing: "0.02em",
                          }}
                        >
                          {p}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4px 12px",
              paddingTop: 8,
              marginTop: 2,
              borderTop: "1px solid rgb(var(--surface-2))",
            }}
          >
            {(Object.entries(PRIO_DEFS) as [PrioCode, (typeof PRIO_DEFS)[PrioCode]][]).map(
              ([p, def]) => (
                <div
                  key={p}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 10,
                    color: "rgb(var(--fg-2))",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      background: def.dim,
                      color: def.tone,
                      padding: "2px 5px",
                      borderRadius: 3,
                      letterSpacing: "0.02em",
                      fontVariantNumeric: "tabular-nums",
                      minWidth: 22,
                      textAlign: "center",
                    }}
                  >
                    {p}
                  </span>
                  <span style={{ color: "rgb(var(--fg-3))", letterSpacing: "0.02em" }}>
                    {def.label}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </span>
  );
}
