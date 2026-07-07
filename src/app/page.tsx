"use client";

import { useCallback, useEffect, useState } from "react";
import Shell, { TabKey } from "@/components/Shell";
import EstadoDelCiclo from "@/components/EstadoDelCiclo";
import DiscoveryTab from "@/components/DiscoveryTab";
import ReleasesTab from "@/components/ReleasesTab";
import CooldownTab from "@/components/CooldownTab";
import BacklogTab from "@/components/BacklogTab";
import AdminTab from "@/components/AdminTab";
import { ErrorBanner, LoadingState } from "@/components/ui";
import { fetchActiveCycle } from "@/lib/db";
import { ObjectivesProvider } from "@/lib/objectives-context";
import type { CycleRow } from "@/lib/types";

export default function Home() {
  const [active, setActive] = useState<TabKey>("Estado del ciclo");
  const [cycle, setCycle] = useState<CycleRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCycle = useCallback(async () => {
    try {
      setCycle(await fetchActiveCycle());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCycle();
  }, [loadCycle]);

  const needsCycle = active === "Estado del ciclo" || active === "Discovery";

  return (
    <ObjectivesProvider>
    <Shell active={active} onNav={setActive} cycle={cycle} onCycleSaved={loadCycle}>
      {error && <ErrorBanner message={`No se pudo cargar el ciclo: ${error}`} />}
      {needsCycle && loading && <LoadingState label="Cargando ciclo…" />}
      {needsCycle && !loading && !cycle && !error && (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            color: "rgb(var(--fg-3))",
            fontSize: 12.5,
          }}
        >
          No hay un ciclo activo. Crea uno con el engranaje (arriba a la derecha).
        </div>
      )}
      {active === "Estado del ciclo" && cycle && <EstadoDelCiclo cycle={cycle} />}
      {active === "Discovery" && cycle && <DiscoveryTab cycle={cycle} />}
      {active === "Releases" && <ReleasesTab />}
      {active === "Cooldown" && <CooldownTab />}
      {active === "Backlog" && <BacklogTab cycle={cycle} />}
      {active === "Admin" && <AdminTab />}
    </Shell>
    </ObjectivesProvider>
  );
}
