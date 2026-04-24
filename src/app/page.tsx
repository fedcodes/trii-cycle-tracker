"use client";

import { useState } from "react";
import Shell, { TabKey } from "@/components/Shell";
import EstadoDelCiclo from "@/components/EstadoDelCiclo";
import DiscoveryTab from "@/components/DiscoveryTab";
import ReleasesTab from "@/components/ReleasesTab";

export default function Home() {
  const [active, setActive] = useState<TabKey>("Estado del ciclo");

  return (
    <Shell active={active} onNav={setActive}>
      {active === "Estado del ciclo" && <EstadoDelCiclo />}
      {active === "Discovery" && <DiscoveryTab />}
      {active === "Releases" && <ReleasesTab />}
    </Shell>
  );
}
