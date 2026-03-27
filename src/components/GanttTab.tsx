"use client";

import { useState } from "react";
import { cycleData, Bet } from "@/data/cycle";

const WEEKS = ["S1", "S2", "S3", "S4", "S5", "S6"];

function getObjectiveColor(objNum: number): string {
  if (objNum === 1 || objNum === 2 || objNum === 5) return "rgb(2 251 126)";
  if (objNum === 3) return "rgb(247 199 55)";
  if (objNum === 4) return "rgb(255 127 0)";
  return "rgb(128 128 128)";
}

function getObjectiveBarBg(objNum: number): string {
  if (objNum === 1 || objNum === 2 || objNum === 5)
    return "rgba(2, 251, 126, 0.6)";
  if (objNum === 3) return "rgba(247, 199, 55, 0.6)";
  if (objNum === 4) return "rgba(255, 127, 0, 0.6)";
  return "rgba(128, 128, 128, 0.6)";
}

function getStatusBadgeStyle(status: Bet["status"]) {
  switch (status) {
    case "On track":
      return { bg: "rgb(2 76 37)", color: "rgb(2 251 126)" };
    case "Update":
      return { bg: "rgb(57 47 23)", color: "rgb(247 199 55)" };
    case "Listo":
      return { bg: "rgb(2 76 37)", color: "rgb(2 251 126)" };
    case "Not started":
      return { bg: "rgb(51 51 51)", color: "rgb(163 163 163)" };
  }
}

function StatusIcon({ status }: { status: Bet["status"] }) {
  if (status === "Listo" || status === "On track") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle
          cx="8"
          cy="8"
          r="7"
          stroke={status === "Listo" ? "rgb(2,251,126)" : "rgb(2,251,126)"}
          strokeWidth="1.5"
          fill={status === "Listo" ? "rgb(2,251,126)" : "none"}
        />
        {status === "Listo" && (
          <path
            d="M5 8l2 2 4-4"
            stroke="rgb(25,25,25)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    );
  }
  if (status === "Update") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle
          cx="8"
          cy="8"
          r="7"
          stroke="rgb(247,199,55)"
          strokeWidth="1.5"
        />
        <path
          d="M8 5v3.5"
          stroke="rgb(247,199,55)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="8" cy="11" r="0.75" fill="rgb(247,199,55)" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle
        cx="8"
        cy="8"
        r="7"
        stroke="rgb(163,163,163)"
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />
    </svg>
  );
}

export default function GanttTab() {
  const [expandedBet, setExpandedBet] = useState<string | null>(null);

  return (
    <div>
      {/* Gantt chart */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 1fr) repeat(6, 1fr)",
          gap: 0,
          background: "rgb(38 38 38)",
          borderRadius: "0.5rem",
          overflow: "hidden",
        }}
      >
        {/* Header row */}
        <div
          style={{
            padding: "0.75rem 1rem",
            fontWeight: 700,
            fontSize: "0.8125rem",
            color: "rgb(163 163 163)",
            background: "rgb(32 32 32)",
            borderBottom: "1px solid rgb(51 51 51)",
          }}
        >
          Proyecto
        </div>
        {WEEKS.map((w, i) => (
          <div
            key={w}
            style={{
              padding: "0.75rem 0.5rem",
              textAlign: "center",
              fontWeight: 700,
              fontSize: "0.8125rem",
              color:
                i + 1 === cycleData.currentWeek
                  ? "rgb(2 251 126)"
                  : "rgb(163 163 163)",
              background:
                i + 1 === cycleData.currentWeek
                  ? "rgba(2, 251, 126, 0.08)"
                  : "rgb(32 32 32)",
              borderBottom: "1px solid rgb(51 51 51)",
              position: "relative",
            }}
          >
            {w}
            {i + 1 === cycleData.currentWeek && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: "rgb(2 251 126)",
                }}
              />
            )}
          </div>
        ))}

        {/* Bet rows */}
        {cycleData.bets.map((bet) => {
          const isExpanded = expandedBet === bet.name;
          const badgeStyle = getStatusBadgeStyle(bet.status);
          return (
            <div
              key={bet.name}
              style={{
                display: "contents",
                cursor: "pointer",
              }}
              onClick={() =>
                setExpandedBet(isExpanded ? null : bet.name)
              }
            >
              {/* Bet info cell */}
              <div
                style={{
                  padding: "0.625rem 1rem",
                  borderBottom: "1px solid rgb(51 51 51)",
                  background: isExpanded
                    ? "rgb(45 45 45)"
                    : "rgb(38 38 38)",
                  transition: "background 0.15s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <StatusIcon status={bet.status} />
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      color: "rgb(227 227 227)",
                      textDecoration:
                        bet.status === "Listo" ? "line-through" : "none",
                      opacity: bet.status === "Listo" ? 0.7 : 1,
                    }}
                  >
                    {bet.name}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginTop: "0.25rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      color: "rgb(163 163 163)",
                    }}
                  >
                    {bet.objective.split(" — ")[0]} · {bet.team.join(" · ")}
                  </span>
                  <span
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      padding: "0.125rem 0.375rem",
                      borderRadius: "0.25rem",
                      background: badgeStyle.bg,
                      color: badgeStyle.color,
                    }}
                  >
                    {bet.status}
                  </span>
                </div>

                {/* Expanded updates */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: "0.625rem",
                      padding: "0.625rem",
                      background: "rgb(32 32 32)",
                      borderRadius: "0.375rem",
                      borderLeft: `3px solid ${getObjectiveColor(bet.objectiveNum)}`,
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        color: "rgb(163 163 163)",
                        marginBottom: "0.375rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Updates
                    </p>
                    {bet.updates.map((u, i) => (
                      <p
                        key={i}
                        style={{
                          fontSize: "0.75rem",
                          color: "rgb(202 202 202)",
                          marginBottom: "0.25rem",
                          paddingLeft: "0.5rem",
                        }}
                      >
                        • {u}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Gantt cells */}
              {WEEKS.map((_, weekIdx) => {
                const weekNum = weekIdx + 1;
                const isInRange =
                  weekNum >= bet.weeks[0] && weekNum <= bet.weeks[1];
                const isStart = weekNum === bet.weeks[0];
                const isEnd = weekNum === bet.weeks[1];
                const isCurrentWeek = weekNum === cycleData.currentWeek;

                return (
                  <div
                    key={weekIdx}
                    style={{
                      padding: "0.625rem 0.25rem",
                      borderBottom: "1px solid rgb(51 51 51)",
                      background: isCurrentWeek
                        ? "rgba(2, 251, 126, 0.04)"
                        : isExpanded
                          ? "rgb(45 45 45)"
                          : "rgb(38 38 38)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    {isInRange && (
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          transform: "translateY(-50%)",
                          left: isStart ? "15%" : "0",
                          right: isEnd ? "15%" : "0",
                          height: "20px",
                          background: getObjectiveBarBg(bet.objectiveNum),
                          borderRadius:
                            isStart && isEnd
                              ? "4px"
                              : isStart
                                ? "4px 0 0 4px"
                                : isEnd
                                  ? "0 4px 4px 0"
                                  : "0",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Weekly Log */}
      <div style={{ marginTop: "2rem" }}>
        <h2
          style={{
            fontSize: "1.1875rem",
            fontWeight: 700,
            color: "rgb(227 227 227)",
            marginBottom: "1rem",
          }}
        >
          Weekly Log
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {cycleData.weeklyLog.map((entry) => (
            <div
              key={entry.week}
              style={{
                background: "rgb(38 38 38)",
                borderRadius: "0.5rem",
                padding: "1rem 1.25rem",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "rgb(2 251 126)",
                  marginBottom: "0.5rem",
                }}
              >
                {entry.week}
              </h3>
              {entry.items.map((item, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: "0.8125rem",
                    color: "rgb(202 202 202)",
                    marginBottom: "0.25rem",
                    paddingLeft: "0.75rem",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      color: "rgb(163 163 163)",
                    }}
                  >
                    •
                  </span>
                  {item}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
