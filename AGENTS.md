# Agents

## Monorepo Structure

```
apps/
  mobile/     # Expo + expo-router + React Native (newArchEnabled)
  web/        # Vite + React 18
packages/
  application/  # Business logic
  db/          # Supabase client + DB types
  domain/       # Core domain types
  sync/         # PowerSync for offline sync
  ui/           # Shared UI components
  utils/         # Shared utilities
supabase/
  migrations/   # SQL migrations
  functions/    # Edge functions
```

## Dev Commands

| Command | Scope |
|---------|-------|
| `npm run dev` | All packages in turbo dev mode |
| `npm run build` | Build all (respects dependency order) |
| `npm run typecheck` | Type-check all (depends on `^build`) |
| `npm run lint` | Lint all (depends on `^build`) |
| `npm run test` | Test all (depends on `^build`) |

**Single package** (from package dir or with `-w`):
- `npm run test -w @saas-pos/web` (web uses vitest)
- `npm run test -w @saas-pos/db` (packages use jest)
- `npm run test -w @saas-pos/mobile` (mobile uses vitest)

**Web-specific**: `npm run e2e` (Playwright), `npm run preview` (preview build)

**Mobile-specific**: `npm run android`, `npm run ios` (via Expo), `npm run dev` (expo start)

## Test Framework by Package

- **web**: Vitest + jsdom + @testing-library
- **mobile**: Vitest (no @testing-library configured)
- **packages/**: Jest + ts-jest

## TypeScript

Base config at `tsconfig.base.json`:
- `strict: true`, `noUncheckedIndexedAccess: true`
- `moduleResolution: bundler`, `module: ESNext`
- `exactOptionalPropertyTypes: false`

Web dev server port: **3000**

## Mobile Notes

- Entry: `expo-router/entry` (file-based routing in `app/` dir)
- Build: delegated to EAS (`echo "Mobile build handled by EAS"` in npm script)
- Expo plugins: `expo-router`, `expo-sqlite`
- New Architecture enabled

## Database

- Supabase migrations in `supabase/migrations/`
- Populate scripts: `populate_items.sql`, `populate_orders.sql`

## Env Files

`.env`, `.env.example`, `.env.local` exist. Do not commit real credentials.
