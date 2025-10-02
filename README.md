# Delta UACBI — Starter (Next.js + Prisma + NextAuth + Tailwind)

Identidad: blanco predominante (#fff), acento negro (#111), tipografías Inter/Space Grotesk/JetBrains Mono.

## Requisitos
- Node 18+
- Base de datos Postgres (Supabase/Neon)

## Configuración rápida
```bash
cp .env.example .env             # Rellena DATABASE_URL y NEXTAUTH_SECRET
npm install
npx prisma migrate dev           # crea tablas
npm run dev
```

Abrir http://localhost:3000

## Roles
Agrega manualmente el rol de los usuarios en la tabla `User.role` (ADMIN/REVIEWER/ORGANIZER/AUTHOR).

## TODO (siguientes pasos)
- Autenticación por email magic link (si no usas Google)
- Formularios completos con validaciones (Zod)
- Embeds de Instagram/TikTok/Facebook en / (Home)
- CRUD de Concursos + Registro (requiresDeliverables)
- Página de Empresas + Perfil con CV y skills verificadas
- Rate limiting (Upstash) y Captcha (hCaptcha)
- Página de detalle de proyecto y filtros avanzados
- i18n selector (ES/EN) y contenido en ambos idiomas
