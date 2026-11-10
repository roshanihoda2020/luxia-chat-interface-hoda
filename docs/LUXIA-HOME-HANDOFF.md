# Luxia Home — Handoff

Checkpoint of the approved Luxia Home design (Chat Hero and Discover), ready to continue on another machine.

## Repository

| | |
|---|---|
| Repository | `luxia-chat-interface-hoda` — Luxia UI implementation and interactive product prototype |
| GitHub | https://github.com/roshanihoda2020/luxia-chat-interface-hoda |
| Branch | `feature/customizable-home-builder` |
| Checkpoint commit | Run `git rev-parse HEAD` on the branch. The commit that adds this file is the design checkpoint: `git log -1 --format=%H -- docs/LUXIA-HOME-HANDOFF.md` |

## Stack and architecture

- React 18 + TypeScript, built with Vite. Styled with Tailwind CSS v4 and Luxia design tokens (`--luxia-*` CSS variables), plus shadcn/Radix UI and some MUI.
- Single-page app. [src/app/App.tsx](../src/app/App.tsx) is the shell: it owns view state, modals (New Chat, New Project) and client-side routing (`history.pushState` / `popstate`).
- Features live in `src/app/features/<feature>/`. Path parsing lives in [src/app/features/project/projectPaths.ts](../src/app/features/project/projectPaths.ts) (`resolveLuxiaPathname`).
- No backend. All data is mock/prototype data held in memory, and preferences are kept in `localStorage`.

## Install and run

Requirements: Node.js 20+ (verified with Node 24) and npm.

```bash
npm install
npm run dev        # dev server at http://127.0.0.1:5241
npm run typecheck  # tsc --noEmit
npm run build      # production build to dist/
```

The dev server binds `127.0.0.1:5241` because Windows reserves TCP 5141–5240 ([vite.config.ts](../vite.config.ts)).

**Home** is at `/` (also `/home`). Open http://127.0.0.1:5241/.

## Routes

| Path | View |
|---|---|
| `/`, `/home` | Home |
| `/projects/...` | Projects, Project overview, Constellations, Galaxies |
| `/chats` | Chats and Galaxies history |
| `/explore` | Explore / What's New |
| `/data-sources` | Data Sources |
| `/document-ai`, `/tools` | Tools |
| `/organization`, `/settings` | Organization and personal settings |
| `/shared-review/...` | External Vidget review share |

## Home feature structure

```
src/app/features/home/
  HomePage.tsx            Home composition: header, Hero, What's New notice, Home Builder grid
  HomeHeader.tsx          "Welcome to Luxia" (first visit) / "Welcome back" + New Project, Customize Home
  HomeStartPanel.tsx      Approved Chat Hero
  DiscoverScene.tsx       2D illustrations for the four Discover cards
  LuxiaVignette.tsx       Small illustrated vignettes used on Home
  homeBuilder/            Home Builder (customizable tile grid)
    registry.ts           Tile type definitions (sizes, categories, targets)
    defaultLayout.ts      Luxia default Home layout
    GuideHomeTiles.tsx    Get started + Discover tiles
    HomeTileLibrary.tsx   "Add tile" library
    HomeTileGrid.tsx      12-column grid, drag/resize
    useHomeLayout.ts      Layout state, save, reset, "My default"
    storage.ts            localStorage persistence
    migration.ts, validation.ts   Saved-layout migration and validation
src/app/features/explore/
  WhatsNewNotice.tsx, exploreFeed.ts   What's New notice shown on Home
```

## Approved design — Home Chat Hero

Source: [HomeStartPanel.tsx](../src/app/features/home/HomeStartPanel.tsx). **Do not redesign.**

- Premium gradient surface with aurora band, soft glow, orbits and constellation artwork.
- A single composer: "What would you like to find out?"
- Compact Project context selector inside the composer: searchable, with Recent Projects listed first when there are many, and a warning when the Project has no knowledge. Answers only use the chosen Project's knowledge.
- **Luxia AI, Coming Soon**: shown but cannot be selected (see Limitations).
- Submitting opens the existing **New Chat** flow scoped to the selected Project. The typed question is shown in the dialog ("Your question") and pre-filled in the new Chat's input ([App.tsx](../src/app/App.tsx): `handleNewChatFromProject(projectId, question)`).
- **Continue** list of recent Chats and Galaxies, plus a **Chat history** link to Chats & Galaxies.
- Empty state when the user has no Project ("You're not in a Project yet"), with New Project if permitted.
- Responsive across mobile, tablet and desktop.

## Approved design — Discover what Luxia can do

Sources: [GuideHomeTiles.tsx](../src/app/features/home/homeBuilder/GuideHomeTiles.tsx) (`TryExampleHomeTile`), [DiscoverScene.tsx](../src/app/features/home/DiscoverScene.tsx), with card data in [HomePage.tsx](../src/app/features/home/HomePage.tsx). **Do not redesign.**

- Four large illustrated capability cards with 2D artwork:
  1. Ask questions about a Project (`ask`)
  2. Write or improve content (`write`), which opens the Writing Assistant
  3. Work with your data (`data`), which opens Data Sources
  4. Assistants for your customers (`vidget`, "See Vidgets"), shown only when relevant
- Each card opens the real feature. When the user can't use a feature, the card shows a reason ("Needs a Project with knowledge", "Not available here") in place of the action.
- It is a Home Builder tile: internal type `try-example`, label **Discover**, section title "Discover what Luxia can do". Sizes: small, medium, large or wide. It can be dismissed, and re-added from the tile library.

## Home Builder

Users can customize Home with **Customize Home**:
- Add tiles from the library (Projects, Constellations, Galaxies, Chats, Writing Assistant, Dashboards, Data Sources, Vidgets, Your focus, Get started, Discover, What's New, …).
- Move, resize (size presets on a 12-column grid), restyle (surface), configure and remove tiles.
- **Save as My default** and **Reset to Luxia default**.
- Older saved layouts are migrated and validated on load, and a pre-migration backup is kept.

Naming: this feature is **Home Builder** / **Home Tile**. Never call it "Widget". ("Vidget" is a separate product feature: customer-facing assistants.)

## Default Home layout — status

[defaultLayout.ts](../src/app/features/home/homeBuilder/defaultLayout.ts), `createDefaultHomeLayout()`:

```
Get started   · full width · soft (dismissible)   rows 0–4
Discover      · full width (dismissible)           rows 4–8
Projects | Writing Assistant | Dashboards (soft)   rows 8–12
```

The header, Hero and What's New notice sit above the grid and are not tiles. Only users without a saved layout, or who reset to the Luxia default, see this layout. **The composition is pending review** (see Next task).

## Operational vs. mock

| Operational in the prototype | Mock / prototype only |
|---|---|
| Navigation and routing, New Chat / New Project flows | All data: users, Projects, Chats, knowledge, Vidgets |
| Hero → New Chat with the question carried over | Chat answers (simulated) |
| Home Builder add/move/resize/style/save/reset | Persistence is browser `localStorage` only, with no server |
| Role-based visibility of actions | Authentication |
| What's New notice (read/dismiss state) | Luxia AI platform assistant (Coming Soon) |

## Luxia AI — Coming Soon

Luxia AI (a platform assistant for help with using Luxia) is **planned, not implemented**. The Hero shows it as disabled with the note "Today, questions are answered from a Project." Every Hero question goes to a Project. Do not wire it up without a product decision.

## Saved-layout storage

Stored in browser `localStorage`, per user id:
- `luxia-home-layout:v1:<userId>`: the current layout
- `luxia-home-my-default:v1:<userId>`: the user's "My default"
- `luxia-home-layout:pre-migration-backup:<userId>`: backup made before a migration

Layouts do not sync between browsers or computers. A new machine starts on the Luxia default layout. Clearing site data resets Home.

## Permissions and navigation

- Actions follow the viewer's role: New Project only appears when `canCreateProject()` allows it, and adding knowledge needs a Project role that can create Constellations.
- Home lists Vidgets only for Projects the user manages or reviews.
- Discover cards that can't be used show a reason, not a broken action.
- The Hero never sends a question directly. It always opens the New Chat flow so the user picks the Chat type and scope.
- Leaving pages with unsaved changes goes through a leave-confirmation guard in `App.tsx`.

## Validation

```bash
npm run typecheck
npm run build
npx --yes tsx scripts/verify-home-tiles.mjs           # Home Builder: registry, grid, default layout, migration
npx --yes tsx scripts/verify-home-recent-preview.mjs  # Home recent-list slicing
```

There is no unit-test runner (no `npm test`). The Hero and Discover have no automated UI tests, so check them visually in the browser.

## Known limitations

- No backend, auth or real AI. Everything runs on mock data.
- Home layouts live only in the browser's `localStorage`.
- Large single JS chunk (Vite warns about it). Not a functional problem.
- `package-lock.json` can show `"peer": true` churn depending on the npm version. That is not a dependency change.

## Next task: Default Home composition review

Review and refine the **default Home composition**: the order, sizes and content of the tiles below the Hero in `createDefaultHomeLayout()` and how they read with the Hero and What's New notice.
- Keep the approved Hero and Discover designs unchanged.
- Changing the default only affects users with no saved layout, or after "Reset to Luxia default". Keep `scripts/verify-home-tiles.mjs` passing, and update its expectations deliberately if the default changes.

## Continue on another computer (Windows)

```powershell
git clone https://github.com/roshanihoda2020/luxia-chat-interface-hoda.git
cd luxia-chat-interface-hoda
git checkout feature/customizable-home-builder
git pull
git rev-parse HEAD        # confirm the checkpoint commit
npm install
npm run dev               # open http://127.0.0.1:5241/
```

If the repository is already cloned:

```powershell
git fetch origin
git checkout feature/customizable-home-builder
git pull --ff-only
```
