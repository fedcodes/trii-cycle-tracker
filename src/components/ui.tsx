"use client";

// Shared UI primitives used by the tab components.

import { useEffect, useRef, useState } from "react";
import type { BetStatus } from "@/lib/types";
import { objColor, objShort, statusToken } from "@/lib/cycle-utils";

export const labelStyle: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: "rgb(var(--fg-4))",
  textTransform: "uppercase",
  marginBottom: 5,
};

export const StatusDot = ({
  status,
  dropped,
  size = 8,
}: {
  status: BetStatus;
  dropped?: boolean;
  size?: number;
}) => {
  const t = statusToken(status, dropped);
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: t.dot,
        flexShrink: 0,
      }}
    />
  );
};

export const TeamStack = ({ team }: { team: string[] }) => (
  <span style={{ display: "inline-flex" }}>
    {team.map((t, i) => (
      <span
        key={`${t}-${i}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "rgb(var(--surface-2))",
          color: "rgb(var(--fg))",
          fontSize: 9,
          fontWeight: 600,
          border: "1.5px solid rgb(var(--surface-1))",
          marginLeft: i === 0 ? 0 : -6,
        }}
      >
        {t}
      </span>
    ))}
    {team.length === 0 && (
      <span style={{ fontSize: 10, color: "rgb(var(--fg-4))", fontStyle: "italic" }}>
        sin equipo
      </span>
    )}
  </span>
);

export const ObjChip = ({ num }: { num: number }) => {
  const c = objColor(num);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.04em",
        color: "rgb(var(--fg-2))",
        textTransform: "uppercase",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
      {objShort(num)}
    </span>
  );
};

export const LegendDot = ({ c, label }: { c: string; label: string }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 10.5,
      color: "rgb(var(--fg-3))",
    }}
  >
    <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
    {label}
  </span>
);

// ── Modal ──────────────────────────────────────────────────

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  width = 520,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "8vh 20px 20px",
        animation: "ct-fade-in 0.15s ease",
      }}
    >
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgb(0 0 0 / 0.55)" }}
      />
      <div
        style={{
          position: "relative",
          width,
          maxWidth: "100%",
          maxHeight: "84vh",
          overflowY: "auto",
          background: "rgb(var(--bg))",
          border: "1px solid rgb(var(--surface-2))",
          borderRadius: 10,
          boxShadow: "0 24px 60px rgb(0 0 0 / 0.5)",
          animation: "ct-slide-in 0.18s ease",
        }}
      >
        <div
          style={{
            padding: "16px 20px 12px",
            borderBottom: "1px solid rgb(var(--surface-2))",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            position: "sticky",
            top: 0,
            background: "rgb(var(--bg))",
            zIndex: 1,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: 11, color: "rgb(var(--fg-3))", marginTop: 2 }}>{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              width: 24,
              height: 24,
              borderRadius: 5,
              border: "none",
              background: "rgb(var(--surface-1))",
              color: "rgb(var(--fg-3))",
              fontSize: 14,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "inherit",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: "16px 20px 20px" }}>{children}</div>
      </div>
    </div>
  );
}

// ── Form primitives ────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: "100%",
  background: "rgb(var(--surface-1))",
  border: "1px solid rgb(var(--surface-2))",
  borderRadius: 6,
  padding: "8px 10px",
  fontFamily: "inherit",
  fontSize: 12,
  color: "rgb(var(--fg))",
  outline: "none",
};

export function Field({
  label,
  children,
  flex = 1,
}: {
  label: string;
  children: React.ReactNode;
  flex?: number;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", flex, minWidth: 0 }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputBase, ...props.style }} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      {...props}
      style={{ ...inputBase, resize: "vertical", lineHeight: 1.45, ...props.style }}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        ...inputBase,
        cursor: "pointer",
        appearance: "none",
        WebkitAppearance: "none",
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath d='M1 2.5L4 5.5L7 2.5' stroke='%23808080' stroke-width='1.2' fill='none'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
        ...props.style,
      }}
    />
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "8px 14px",
        background: "rgb(var(--primary-dim))",
        color: "rgb(var(--primary))",
        border: "1px solid rgb(var(--primary-dim))",
        borderRadius: 6,
        fontFamily: "inherit",
        fontSize: 11.5,
        fontWeight: 600,
        cursor: props.disabled ? "default" : "pointer",
        opacity: props.disabled ? 0.5 : 1,
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        background: "transparent",
        color: "rgb(var(--fg-2))",
        border: "1px solid rgb(var(--surface-2))",
        borderRadius: 6,
        fontFamily: "inherit",
        fontSize: 11.5,
        fontWeight: 600,
        cursor: "pointer",
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}

// Two-step delete: button → confirm/cancel pair (auto-resets after 4s).
export function DangerConfirmButton({
  label,
  confirmLabel = "Confirmar",
  onConfirm,
}: {
  label: string;
  confirmLabel?: string;
  onConfirm: () => void;
}) {
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
        style={{
          padding: "8px 14px",
          background: "transparent",
          color: "rgb(var(--error))",
          border: "1px solid rgb(var(--surface-2))",
          borderRadius: 6,
          fontFamily: "inherit",
          fontSize: 11.5,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    );
  }
  return (
    <div ref={ref} style={{ display: "inline-flex", gap: 6 }}>
      <button
        onClick={onConfirm}
        style={{
          padding: "8px 14px",
          background: "rgb(var(--error-dim))",
          color: "rgb(var(--error))",
          border: "1px solid rgb(var(--error))",
          borderRadius: 6,
          fontFamily: "inherit",
          fontSize: 11.5,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {confirmLabel}
      </button>
      <GhostButton onClick={() => setConfirming(false)}>Cancelar</GhostButton>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        margin: "12px 28px 0",
        padding: "10px 14px",
        background: "rgb(var(--error-dim))",
        color: "rgb(var(--error))",
        border: "1px solid rgb(var(--error) / 0.4)",
        borderRadius: 6,
        fontSize: 11.5,
      }}
    >
      {message}
    </div>
  );
}

export function LoadingState({ label = "Cargando…" }: { label?: string }) {
  return (
    <div
      style={{
        padding: "60px 20px",
        textAlign: "center",
        color: "rgb(var(--fg-4))",
        fontSize: 12,
      }}
    >
      {label}
    </div>
  );
}
