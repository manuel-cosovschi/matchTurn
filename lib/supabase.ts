import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // Ayuda en dev/build si faltan las variables de entorno
  console.warn(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. Configurá las variables de entorno."
  );
}

export const supabase = createClient(url ?? "", anonKey ?? "", {
  realtime: { params: { eventsPerSecond: 5 } },
});
