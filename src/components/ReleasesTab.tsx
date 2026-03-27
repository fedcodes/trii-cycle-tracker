"use client";

import { cycleData } from "@/data/cycle";

export default function ReleasesTab() {
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
        Historial de versiones de la app trii. La versión más reciente aparece
        primero.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        {cycleData.releases.map((release, idx) => {
          const isLatest = idx === 0;
          const isQA = release.tag === "QA";

          return (
            <div
              key={release.version}
              style={{
                background: "rgb(38 38 38)",
                borderRadius: "0.5rem",
                overflow: "hidden",
              }}
            >
              {/* Accent bar — green for latest/QA, muted for older */}
              <div
                style={{
                  height: "3px",
                  background: isLatest
                    ? "rgb(2 251 126)"
                    : idx === 1
                      ? "rgb(2 251 126)"
                      : "rgb(51 51 51)",
                  opacity: isLatest ? 1 : idx === 1 ? 0.5 : 1,
                }}
              />

              <div style={{ padding: "1rem 1.25rem" }}>
                {/* Version header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "rgb(227 227 227)",
                      margin: 0,
                    }}
                  >
                    {release.tag ? `${release.tag} ` : ""}Versión{" "}
                    {release.version}
                  </h3>

                  {isQA && (
                    <span
                      style={{
                        fontSize: "0.625rem",
                        fontWeight: 700,
                        padding: "0.125rem 0.5rem",
                        borderRadius: "1rem",
                        background: "rgb(57 47 23)",
                        color: "rgb(247 199 55)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      En QA
                    </span>
                  )}

                  {!isQA && idx === 0 && (
                    <span
                      style={{
                        fontSize: "0.625rem",
                        fontWeight: 700,
                        padding: "0.125rem 0.5rem",
                        borderRadius: "1rem",
                        background: "rgb(2 76 37)",
                        color: "rgb(2 251 126)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Última
                    </span>
                  )}

                  {!isQA && idx === 1 && cycleData.releases[0]?.tag === "QA" && (
                    <span
                      style={{
                        fontSize: "0.625rem",
                        fontWeight: 700,
                        padding: "0.125rem 0.5rem",
                        borderRadius: "1rem",
                        background: "rgb(2 76 37)",
                        color: "rgb(2 251 126)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Producción
                    </span>
                  )}
                </div>

                {/* Items */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  {release.items.map((item, i) => (
                    <p
                      key={i}
                      style={{
                        fontSize: "0.8125rem",
                        color: "rgb(202 202 202)",
                        paddingLeft: "0.75rem",
                        position: "relative",
                        lineHeight: 1.5,
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
