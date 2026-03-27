"use client";

import { cycleData } from "@/data/cycle";

function getObjectiveColor(id: number): string {
  if (id === 1 || id === 2 || id === 5) return "rgb(2 251 126)";
  if (id === 3) return "rgb(247 199 55)";
  if (id === 4) return "rgb(255 127 0)";
  return "rgb(128 128 128)";
}

export default function DiscoveryTab() {
  return (
    <div>
      <p
        style={{
          fontSize: "0.875rem",
          color: "rgb(163 163 163)",
          marginBottom: "1.5rem",
          maxWidth: "600px",
        }}
      >
        POs y designers exploran problemas y oportunidades que alimentan las
        bets de futuros ciclos de build.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "1rem",
        }}
      >
        {cycleData.discovery.map((obj) => {
          const objColor = getObjectiveColor(obj.id);
          const hasTasks = obj.tasks.length > 0;

          return (
            <div
              key={obj.id}
              style={{
                background: "rgb(38 38 38)",
                borderRadius: "0.5rem",
                overflow: "hidden",
                opacity: hasTasks ? 1 : 0.7,
              }}
            >
              {/* Color accent bar */}
              <div style={{ height: "3px", background: objColor }} />

              <div style={{ padding: "1.25rem" }}>
                {/* Objective name */}
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "rgb(227 227 227)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {obj.name}
                </h3>

                {/* Assignments — full names */}
                {(obj.po || obj.designer) && (
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      marginBottom: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {obj.po && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            color: "rgb(163 163 163)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          PO
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            padding: "0.125rem 0.5rem",
                            borderRadius: "1rem",
                            background: "rgb(51 51 51)",
                            color: "rgb(227 227 227)",
                          }}
                        >
                          {obj.po.name}
                        </span>
                      </div>
                    )}
                    {obj.designer && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            color: "rgb(163 163 163)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Diseño
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            padding: "0.125rem 0.5rem",
                            borderRadius: "1rem",
                            background: "rgb(51 51 51)",
                            color: "rgb(227 227 227)",
                          }}
                        >
                          {obj.designer.name}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* No assignments notice */}
                {!obj.po && !obj.designer && (
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "rgb(163 163 163)",
                      marginBottom: "0.75rem",
                      fontStyle: "italic",
                    }}
                  >
                    Sin asignación de discovery este ciclo
                  </p>
                )}

                {/* Context alert if exists */}
                {obj.context && (
                  <div
                    style={{
                      background: hasTasks ? "rgb(57 47 23)" : "rgb(45 45 45)",
                      borderRadius: "0.375rem",
                      padding: "0.625rem 0.75rem",
                      marginBottom: hasTasks ? "0.75rem" : "0",
                      fontSize: "0.75rem",
                      color: hasTasks ? "rgb(247 199 55)" : "rgb(163 163 163)",
                      lineHeight: 1.5,
                    }}
                  >
                    {obj.context}
                  </div>
                )}

                {/* Task count */}
                {hasTasks && (
                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: objColor,
                      marginBottom: "0.625rem",
                    }}
                  >
                    {obj.tasks.length} items en discovery
                  </p>
                )}

                {/* Tasks — always visible */}
                {hasTasks && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    {obj.tasks.map((task, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgb(32 32 32)",
                          borderRadius: "0.375rem",
                          padding: "0.75rem",
                          borderLeft: `3px solid ${objColor}`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.8125rem",
                              fontWeight: 500,
                              color: "rgb(227 227 227)",
                            }}
                          >
                            {task.name}
                          </span>
                          <span
                            style={{
                              fontSize: "0.625rem",
                              fontWeight: 600,
                              padding: "0.125rem 0.375rem",
                              borderRadius: "0.25rem",
                              background: "rgb(57 47 23)",
                              color: "rgb(247 199 55)",
                              whiteSpace: "nowrap",
                              marginLeft: "0.5rem",
                            }}
                          >
                            {task.status}
                          </span>
                        </div>
                        {task.notes && (
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "rgb(163 163 163)",
                              marginTop: "0.375rem",
                            }}
                          >
                            {task.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
