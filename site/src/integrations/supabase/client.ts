import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://epargmcwrvspkdxatgny.supabase.co";

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_ANON_KEY) {
  throw new Error(
    "Falta a variável VITE_SUPABASE_ANON_KEY. No Vercel: Settings > Environment Variables. " +
      "Localmente: copia .env.example para .env e preenche-a com a chave 'anon public' " +
      "do painel Supabase (Project Settings > API)."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
