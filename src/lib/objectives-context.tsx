"use client";

// Catálogo global de objetivos (tabla `objectives`) compartido entre tabs.
// Los accessors caen a los mapas hardcodeados de cycle-utils si el catálogo
// no cargó o el num no existe (p. ej. bets viejas con un objetivo borrado).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ObjectiveRow } from "./types";
import { OBJECTIVE_LABELS, objColor, objShort, tokenColor } from "./cycle-utils";
import { fetchObjectives } from "./db";

export interface ObjectivesApi {
  objectives: ObjectiveRow[];
  activeObjectives: ObjectiveRow[];
  colorOf: (num: number) => string;
  shortOf: (num: number) => string;
  labelOf: (num: number) => string;
  reload: () => Promise<void>;
}

const fallbackApi: ObjectivesApi = {
  objectives: [],
  activeObjectives: [],
  colorOf: objColor,
  shortOf: objShort,
  labelOf: (n) => OBJECTIVE_LABELS[n] ?? `Obj. ${n}`,
  reload: async () => {},
};

const ObjectivesContext = createContext<ObjectivesApi>(fallbackApi);

export const useObjectives = () => useContext(ObjectivesContext);

export function ObjectivesProvider({ children }: { children: React.ReactNode }) {
  const [objectives, setObjectives] = useState<ObjectiveRow[]>([]);

  const reload = useCallback(async () => {
    try {
      setObjectives(await fetchObjectives());
    } catch (e) {
      // Sin catálogo seguimos con los fallbacks hardcodeados.
      console.error("No se pudo cargar el catálogo de objetivos:", e);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const api = useMemo<ObjectivesApi>(() => {
    const byNum = new Map(objectives.map((o) => [o.num, o]));
    return {
      objectives,
      activeObjectives: objectives.filter((o) => o.active),
      colorOf: (n) => {
        const o = byNum.get(n);
        return o ? tokenColor(o.color) : objColor(n);
      },
      shortOf: (n) => {
        const o = byNum.get(n);
        if (!o) return objShort(n);
        return n >= 90 ? o.short_name : `Obj ${n} · ${o.short_name}`;
      },
      labelOf: (n) => byNum.get(n)?.label ?? OBJECTIVE_LABELS[n] ?? `Obj. ${n}`,
      reload,
    };
  }, [objectives, reload]);

  return <ObjectivesContext.Provider value={api}>{children}</ObjectivesContext.Provider>;
}
