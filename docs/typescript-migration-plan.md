<!-- 8c9bb5a5-b87a-466c-abb5-19dbed3bf80c -->
---
todos:
  - id: "install-deps"
    content: "Install TypeScript and required @types dependencies"
    status: pending
  - id: "config-tsconfig"
    content: "Configure tsconfig.json, tsconfig.app.json, and tsconfig.node.json"
    status: pending
  - id: "update-config-files"
    content: "Rename config files and update package.json (Vite & ESLint)"
    status: pending
  - id: "migrate-backend"
    content: "Migrate worker/ backend to TS (Bindings, Hono types)"
    status: pending
  - id: "migrate-frontend"
    content: "Migrate src/ frontend to TS (Props, Contexts, Hooks)"
    status: pending
  - id: "fix-ts-errors"
    content: "Run typecheck and fix remaining strict TS errors"
    status: pending
isProject: false
---
# TypeScript Migration Plan

## 1. Setup Dependencies
- Install core TypeScript packages: `typescript`, `@types/react`, `@types/react-dom`
- Install Cloudflare & Hono types: `@cloudflare/workers-types`
- Install TS linting: `typescript-eslint`

## 2. Configuration Files
- Rename `vite.config.js` to `vite.config.ts`
- Create `tsconfig.json` (root), `tsconfig.app.json` (frontend), and `tsconfig.node.json` (Vite) following standard Vite templates.
- Update `eslint.config.js` to use `typescript-eslint` rules for type-aware linting.
- Update `package.json` scripts (`typecheck: "tsc --noEmit"`).

## 3. Backend (Hono Worker) Migration
- Rename all `worker/**/*.js` to `.ts`.
- **Environment Bindings:** Create an interface `Bindings` for Cloudflare variables (`DATABASE_URL`, `MEDIA` R2Bucket, Neon Auth).
- **App Instance:** Update `new Hono()` to `new Hono<{ Bindings: Bindings }>()` across all routes.
- **Type Database Rows:** Add types for DB schemas and `mapProduct` utility.
- Add return types for middleware and generic utility functions.

## 4. Frontend (React SPA) Migration
- Rename all `src/**/*.jsx` to `.tsx` and `src/**/*.js` to `.ts`.
- Update `index.html` script source pointing to `main.tsx`.
- **Contexts:** Define and apply interfaces for `AuthContext` and `CartContext`.
- **Components:** Type `props` for components (e.g., `children: React.ReactNode`, custom component props).
- **API calls:** Type responses from Hono backend so React state hooks (e.g. `useState<Product[]>`) get correct typings.

## 5. Clean up & Verification
- Fix all emerging type errors globally.
- Ensure `bun run typecheck`, `bun run build`, and `bun run lint` pass successfully.