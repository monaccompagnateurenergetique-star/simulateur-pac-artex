# Artex 360 — Simulateur CEE & CRM

## Stack
- React 19 + Vite 8 + Tailwind CSS 4
- Firebase Auth + Firestore (real-time)
- Lucide React (icons), jsPDF (PDF generation)
- Zustand (state management minimal)

## Structure
```
src/
  components/ui/       → Composants réutilisables (Button, Card, Input, etc.)
  components/layout/   → Header, Footer, NotificationBell
  components/auth/     → ProtectedRoute, PublicOnlyRoute
  pages/               → Pages principales
  pages/simulators/    → 8 simulateurs CEE + PTZ + MaPrimeAdapt + LocAvantage
  pages/admin/         → Super admin
  pages/installer/     → TeamPage, CeeDealsPage
  pages/tickets/       → Système tickets
  pages/auth/          → AccessDenied, AccountDisabled, PendingApproval
  hooks/               → 16 custom hooks (Firestore, RBAC, projets, leads, etc.)
  lib/                 → Logique métier, permissions, calculs
  lib/calculators/     → Moteurs de calcul par fiche BAR
  lib/constants/       → Constantes réglementaires
  contexts/            → AuthContext, RoleContext
  utils/               → Formatters, postal code, DPE API
```

## Rôles
- `super_admin` — Gestion complète plateforme
- `installer_admin` — Admin organisation + équipe + deals CEE
- `installer_member` — Simulations + leads + projets
- `beneficiary` — Vue limitée (en développement)

## Conventions
- JS pur (pas de TypeScript)
- Composants fonctionnels uniquement
- Tailwind utility-first, pas de CSS modules
- Hooks préfixés `use*`, pages suffixées `*Page.jsx`
- Design: dark header (#121212), lime (#84cc16), indigo (#4f46e5), slate bg (#f0f4f8)
- Font: Inter (Google Fonts)

## Commandes
- `npm run dev` — Dev server (port 5173)
- `npm run build` — Build production
- `npm run preview` — Preview build

## Skills
- `.claude/skills/artex-ui-expert.md` — Design system, patterns UI, optimisation tokens
