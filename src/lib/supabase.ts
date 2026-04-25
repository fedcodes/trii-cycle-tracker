import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars"
  );
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export type BacklogStatus =
  | "Pending"
  | "In Discovery"
  | "In Design"
  | "Completed Design"
  | "In Betting Table"
  | "In Development"
  | "Completed"
  | "Not Doing";

export type BacklogSize = "" | "S" | "M" | "L" | "XL";

export interface BacklogIdeaRow {
  id: string;
  vertical: string;
  idea: string;
  objective: string;
  responsable: string;
  countries: string[];
  impact: BacklogSize;
  effort: BacklogSize;
  status: BacklogStatus;
  position: number;
  created_at: string;
  updated_at: string;
}
