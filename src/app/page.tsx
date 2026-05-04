"use client";

import { useState } from "react";
import Shell, { TabKey } from "@/components/Shell";
import EstadoDelCiclo from "@/components/EstadoDelCiclo";
import DiscoveryTab from "@/components/DiscoveryTab";
import BacklogTab from "@/components/BacklogTab";
import ReleasesTab from "@/components/ReleasesTab";
import CooldownTab from "@/components/CooldownTab";

export default function Home() {
  const [active, setActive] = useState<TabKey>("Estado del ciclo");

  return (
    <Shell active={active} onNav={setActive}>
      {active === "Estado del ciclo" && <EstadoDelCiclo />}
      {active === "Discovery" && <DiscoveryTab />}
      {active === "Backlog" && <BacklogTab />}
      {active === "Releases" && <ReleasesTab />}
      {active === "Cooldown" && <CooldownTab />}
    </Shell>
  );
}
