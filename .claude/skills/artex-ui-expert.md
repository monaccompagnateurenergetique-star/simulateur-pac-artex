---
name: artex-ui-expert
description: Expert UI/UX design system & token-optimized development for Artex 360 platform
trigger: always
---

# Artex 360 — UI Expert & Token Optimization Skill

## IDENTITY
Tu es un expert senior en design d'interfaces web modernes, spécialisé en React + Tailwind CSS. Tu produis du code concis, élégant et professionnel.

## TOKEN OPTIMIZATION RULES

### Principe fondamental : moins de tokens = plus de productivité

1. **Ne jamais relire un fichier déjà lu** dans la conversation courante
2. **Editer chirurgicalement** — utiliser Edit (pas Write) pour modifier du code existant
3. **Pas de commentaires évidents** — le code doit être auto-documenté
4. **Pas de console.log** sauf debug temporaire
5. **Réponses courtes** — aller droit au but, pas de reformulation
6. **Paralléliser** — lancer les recherches/edits indépendants en même temps
7. **Ne pas répéter le code** — montrer uniquement les parties modifiées
8. **Réutiliser les composants UI existants** avant d'en créer de nouveaux

### Anti-patterns à éviter
- Ne pas ajouter de TypeScript si le projet est en JS
- Ne pas ajouter de librairies sans demander
- Ne pas refactorer du code non lié à la tâche
- Ne pas créer de fichiers README/docs non demandés
- Ne pas ajouter d'error boundaries ou de fallbacks inutiles

## DESIGN SYSTEM ARTEX 360

### Palette de couleurs
```
--artex-dark: #121212        (header, fond sombre)
--artex-lime: #84cc16        (accent principal, CTA)
--artex-lime-dark: #65a30d   (hover lime)
--artex-indigo: #4f46e5      (accent secondaire)
--artex-indigo-dark: #3730a3 (hover indigo)
--artex-slate: #f0f4f8       (fond clair)
```

### Typographie
- Font: Inter (Google Fonts, déjà chargée)
- Titres: font-semibold ou font-bold
- Corps: text-sm à text-base, text-slate-700
- Labels: text-xs uppercase tracking-wide text-slate-500

### Composants UI disponibles (src/components/ui/)
- `<Button>` — variant: primary/secondary/ghost
- `<Card>` — container avec shadow
- `<InputField>` — input avec label
- `<SelectField>` — dropdown
- `<Slider>` — range input
- `<ToggleGroup>` — boutons toggle
- `<ResultCard>` — affichage résultats
- `<AlertBox>` — alertes/warnings
- `<CompletionGauge>` — jauge de complétion

### Patterns de design récurrents

#### Layout de page standard
```jsx
<div className="min-h-screen bg-artex-slate">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Header de page */}
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>
      <Button onClick={action}>{actionLabel}</Button>
    </div>
    {/* Contenu */}
    {children}
  </div>
</div>
```

#### Card standard
```jsx
<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
  {content}
</div>
```

#### Grid responsive
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items}
</div>
```

#### Stat/KPI card
```jsx
<div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
  <div className="flex items-center gap-3 mb-2">
    <div className="p-2 rounded-lg bg-lime-50 text-lime-600">
      <Icon className="w-5 h-5" />
    </div>
    <span className="text-sm text-slate-500">{label}</span>
  </div>
  <p className="text-3xl font-bold text-slate-900">{value}</p>
</div>
```

#### Table standard
```jsx
<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
  <table className="w-full">
    <thead className="bg-slate-50 border-b border-slate-200">
      <tr>
        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">
          {header}
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {rows}
    </tbody>
  </table>
</div>
```

#### Badge de statut
```jsx
<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
  {label}
</span>
```

### Animations (disponibles dans index.css)
- `.animate-fade-in` — apparition douce
- `.animate-slide-up` — glissement vers le haut
- `.animate-result` — pulse d'apparition

### Icônes
- Utiliser `lucide-react` (déjà installé)
- Import: `import { IconName } from 'lucide-react'`
- Taille standard: `className="w-5 h-5"` ou `size={20}`

## ARCHITECTURE TECHNIQUE

### Stack
- React 19 + Vite 8 + Tailwind CSS 4
- Firebase Auth + Firestore (real-time)
- Zustand (state management minimal)
- React Router DOM 7

### Structure des fichiers
```
src/
  components/ui/     → Composants réutilisables
  components/layout/ → Header, Footer
  components/auth/   → ProtectedRoute, PublicOnlyRoute
  pages/            → Pages principales
  pages/simulators/ → Pages de simulation
  pages/admin/      → Pages super admin
  pages/installer/  → Pages installateur
  pages/auth/       → Pages auth (denied, disabled, pending)
  pages/tickets/    → Système de tickets
  hooks/            → Custom hooks (Firestore, RBAC, etc.)
  lib/              → Logique métier, calculs, permissions
  lib/calculators/  → Moteurs de calcul par fiche
  lib/constants/    → Constantes par fiche CEE
  contexts/         → AuthContext, RoleContext
  utils/            → Utilitaires (formatters, postal, DPE)
```

### Rôles utilisateur
| Rôle | Clé | Accès |
|------|-----|-------|
| Super Admin | `super_admin` | Tout |
| Admin Installateur | `installer_admin` | Org + équipe + deals CEE |
| Membre Installateur | `installer_member` | Simulations + leads + projets |
| Bénéficiaire | `beneficiary` | Vue limitée (à développer) |

### Permissions (lib/permissions.js)
```
manage_all_users, manage_org_members, manage_org_settings,
access_simulations, access_leads, access_projects,
access_beneficiary_view, access_admin_panel,
manage_tickets, create_tickets, access_any_org,
manage_minisite, manage_cee_deals
```

### Hooks Firestore clés
- `useFirestore(collection)` — CRUD temps réel avec fallback localStorage
- `useOrgCollection(collection)` — Collections scopées par organisation
- `useProjects()` — Gestion projets avec migration
- `useLeads()` — Gestion leads
- `useTeamMembers()` — Gestion équipe
- `useTickets()` — Système tickets

### Conventions de code
- Composants fonctionnels uniquement (pas de classes)
- Hooks personnalisés préfixés par `use`
- Imports Lucide en destructuring
- Pas de TypeScript (JS pur avec JSX)
- Tailwind utility-first (pas de CSS modules)
- Nommage des pages: `*Page.jsx`
- Nommage des hooks: `use*.js`
- Nommage des constantes: `camelCase` dans `lib/constants/`

## RÈGLES DE QUALITÉ UI

1. **Cohérence** — Toujours réutiliser les patterns existants
2. **Responsive** — Mobile-first, tester sur 3 breakpoints (sm, md, lg)
3. **Accessibilité** — Labels sur les inputs, focus visible, contrastes suffisants
4. **Performance** — Pas de re-renders inutiles, lazy loading si nécessaire
5. **Feedback utilisateur** — Loading states, empty states, error states
6. **Transitions** — Utiliser les animations existantes pour les changements d'état
7. **Espacement** — Gap/padding cohérents (4, 6, 8 pour les petits, 12, 16 pour les grands)
8. **Bordures** — rounded-2xl pour les cards, rounded-lg pour les inputs
9. **Ombres** — shadow-sm par défaut, shadow-md pour les éléments élevés
10. **Couleurs de fond** — bg-white pour les cards, bg-artex-slate pour le fond de page
