import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://ktdbdhsjznajrlklmmri.supabase.co";

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/**
 * Sem chave o site continua a servir — páginas, textos e imagens não dependem
 * dela. Só as chamadas à base de dados falham, e cada ecrã já trata desse erro.
 * Derrubar a aplicação inteira por uma variável em falta seria pior: deixaria
 * o visitante com uma página em branco em vez de um site com dados por carregar.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_ANON_KEY);

if (!isSupabaseConfigured) {
  console.error(
    "[config] Falta VITE_SUPABASE_ANON_KEY — marcações e preços não vão funcionar. " +
      "No Vercel: Settings > Environment Variables. Localmente: copia .env.example para .env."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || "sem-chave", {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
