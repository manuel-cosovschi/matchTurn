# MatchTurn ⚽

App web para organizar el **turno fijo de fútbol 7v7** de un grupo de amigos.

El grupo de WhatsApp tiene más gente (ej. 16) que los lugares de la cancha (14).
Cada uno confirma si puede jugar: **los primeros 14 quedan convocados** y el
resto **suplentes**. Si un convocado se baja, se libera un lugar y **el primer
suplente que confirma entra** (la carrera por el lugar se resuelve de forma
atómica en el servidor, así nunca entran dos al mismo lugar).

## Cómo funciona

- **Confirmás** → "✅ ¡Convocado al turno!" si hay lugar, o
  "⏳ No entraste a los 14 convocados, te avisamos si se baja uno…".
- Todo se actualiza **en vivo** (Supabase Realtime): cuando alguien se baja,
  los suplentes lo ven al instante y aparece el botón **"Tomar lugar"**.
- **Panel `/admin`** (con clave): editar fecha/lugar/cupo del turno, cargar y
  quitar jugadores, y **reiniciar** las confirmaciones cada semana.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + Realtime). La lógica crítica vive en funciones
  `SECURITY DEFINER` (`mt_confirm`, `mt_drop`) para garantizar atomicidad.
- Deploy en Vercel.

## Variables de entorno

Copiá `.env.example` a `.env.local` (ya están los valores del proyecto):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Correr en local

```bash
npm install
npm run dev
```

## Deploy en Vercel

1. Importá este repo en https://vercel.com/new.
2. Framework: **Next.js** (autodetectado).
3. En **Environment Variables** agregá `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (mismos valores de `.env.example`).
4. **Deploy**.

## Admin

Clave por defecto: **`futbol`** (cambiala desde la base si querés). El panel
está en `/admin`.
