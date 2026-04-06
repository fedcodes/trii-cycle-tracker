"use client";

import { useState } from "react";
import { cycleData } from "@/data/cycle";
import GanttTab from "@/components/GanttTab";
import DiscoveryTab from "@/components/DiscoveryTab";
import ReleasesTab from "@/components/ReleasesTab";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"gantt" | "discovery" | "releases">("gantt");

  const statusCounts = {
    onTrack: cycleData.bets.filter((b) => b.status === "On track").length,
    update: cycleData.bets.filter((b) => b.status === "Update").length,
    blocked: cycleData.bets.filter((b) => b.status === "Blocked").length,
    listo: cycleData.bets.filter((b) => b.status === "Listo").length,
    notStarted: cycleData.bets.filter((b) => b.status === "Not started" && !b.dropped).length,
    dropped: cycleData.bets.filter((b) => b.dropped).length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "rgb(25 25 25)" }}>
      {/* Green accent bar */}
      <div
        style={{
          width: "100%",
          height: "3px",
          background: "rgb(2 251 126)",
        }}
      />

      {/* Header */}
      <header
        style={{
          padding: "1.5rem 2rem 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: 700,
              color: "rgb(227 227 227)",
              margin: 0,
            }}
          >
            trii{" "}
            <span style={{ color: "rgb(2 251 126)" }}>Cycle Tracker</span>
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "rgb(163 163 163)",
              marginTop: "0.25rem",
            }}
          >
            {cycleData.cycleName} · {cycleData.dates}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                color: "rgb(163 163 163)",
              }}
            >
              Semana {cycleData.currentWeek} de {cycleData.totalWeeks}
            </span>
            <div
              style={{
                width: "80px",
                height: "6px",
                background: "rgb(51 51 51)",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(cycleData.currentWeek / cycleData.totalWeeks) * 100}%`,
                  height: "100%",
                  background: "rgb(2 251 126)",
                  borderRadius: "3px",
                }}
              />
            </div>
          </div>
          <p
            style={{
              fontSize: "0.6875rem",
              color: "rgb(163 163 163)",
              marginTop: "0.25rem",
            }}
          >
            Actualizado: {cycleData.lastUpdated}
          </p>
        </div>
      </header>

      {/* Summary badges */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          padding: "1rem 2rem",
          flexWrap: "wrap",
        }}
      >
        <SummaryBadge
          label="On track"
          count={statusCounts.onTrack}
          bg="rgb(2 76 37)"
          color="rgb(2 251 126)"
        />
        <SummaryBadge
          label="Update"
          count={statusCounts.update}
          bg="rgb(57 47 23)"
          color="rgb(247 199 55)"
        />
        {statusCounts.blocked > 0 && (
          <SummaryBadge
            label="Blocked"
            count={statusCounts.blocked}
            bg="rgb(64 28 38)"
            color="rgb(255 112 150)"
          />
        )}
        <SummaryBadge
          label="Listo"
          count={statusCounts.listo}
          bg="rgb(2 76 37)"
          color="rgb(2 251 126)"
        />
        <SummaryBadge
          label="Not started"
          count={statusCounts.notStarted}
          bg="rgb(51 51 51)"
          color="rgb(163 163 163)"
        />
      </div>

      {/* Tab navigation */}
      <nav
        style={{
          display: "flex",
          gap: "2rem",
          padding: "0 2rem",
          borderBottom: "1px solid rgb(51 51 51)",
        }}
      >
        <button
          onClick={() => setActiveTab("gantt")}
          className={activeTab === "gantt" ? "tab-active" : "tab-inactive"}
          style={{
            background: "none",
            border: "none",
            fontSize: "0.9375rem",
            fontWeight: activeTab === "gantt" ? 700 : 400,
            padding: "0.75rem 0",
            cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          Estado del Ciclo
        </button>
        <button
          onClick={() => setActiveTab("discovery")}
          className={activeTab === "discovery" ? "tab-active" : "tab-inactive"}
          style={{
            background: "none",
            border: "none",
            fontSize: "0.9375rem",
            fontWeight: activeTab === "discovery" ? 700 : 400,
            padding: "0.75rem 0",
            cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          Discovery
        </button>
        <button
          onClick={() => setActiveTab("releases")}
          className={activeTab === "releases" ? "tab-active" : "tab-inactive"}
          style={{
            background: "none",
            border: "none",
            fontSize: "0.9375rem",
            fontWeight: activeTab === "releases" ? 700 : 400,
            padding: "0.75rem 0",
            cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          Releases
        </button>
      </nav>

      {/* Tab content */}
      <main style={{ padding: "1.5rem 2rem 3rem" }}>
        {activeTab === "gantt" && <GanttTab />}
        {activeTab === "discovery" && <DiscoveryTab />}
        {activeTab === "releases" && <ReleasesTab />}
      </main>
    </div>
  );
}

function SummaryBadge({
  label,
  count,
  bg,
  color,
}: {
  label: string;
  count: number;
  bg: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        background: bg,
        padding: "0.375rem 0.75rem",
        borderRadius: "0.5rem",
        fontSize: "0.8125rem",
        fontWeight: 500,
        color,
      }}
    >
      <span style={{ fontSize: "1.125rem", fontWeight: 700 }}>{count}</span>
      {label}
    </div>
  );
}
