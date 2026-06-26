# MatchTurn ⚽

App web multiusuario para organizar **turnos fijos de fútbol** (5/6/7 vs 7, etc.).
El grupo de WhatsApp suele tener más gente que lugares en la cancha: cada uno
confirma si puede jugar y **los primeros en confirmar quedan convocados**; el
resto, **suplentes**. Si un convocado se baja, **el primer suplente que confirma
toma el lugar** (la carrera se resuelve de forma atómica en el servidor, así
nunca entran dos al mismo lugar).

## Cómo funciona

1. **Te registrás** y creás tu **turno fijo**: día de la semana, horario, cancha
   y cupo de titulares.
2. **Cargás el plantel** (todos los del grupo, aunque sean más que el cupo).
3. Apretás **"Generar link de la semana"** → se crea un link nuevo, único e
   impredecible. Solo vos lo ves en el panel hasta que lo pasás al grupo. El
   link anterior queda desactivado.
4. La gente entra por el link (sin cuenta), elige su nombre y confirma:
   - **"✅ ¡Convocado al turno!"** si hay lugar.
   - **"⏳ No entraste a los convocados, te avisamos si se baja uno…"** si no.
5. Todo se actualiza **en vivo**. A **1 hora del partido** las confirmaciones se
   **cierran** y queda el equipo final.

Cada semana volvés a apretar el botón para generar el link nuevo.

## Stack

- **Next.js** (App Router) + TypeScript + **Tailwind CSS** (mobile-first).
- **Supabase** (Postgres + Realtime). Toda la lógica vive en funciones
  `SECURITY DEFINER` (auth propia liviana, confirmaciones, generación de links),
  con RLS cerrando el acceso directo a las tablas.
- Deploy en Netlify / Vercel.

## Rutas

- `/` — landing con registro / login.
- `/register`, `/login` — alta e inicio de sesión.
- `/dashboard` — panel del organizador (turnos, plantel, link de la semana,
  confirmaciones en vivo).
- `/t/[token]` — vista pública del link que se manda al grupo.

## Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Desarrollo

```bash
npm install
npm run dev
```
