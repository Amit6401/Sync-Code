# Collab Code Editor — Build Plan (Sequence-wise)

Real-time collaborative code editor: multiple allowed members edit the same files inside a workspace (room), with multi-file management like VS Code, JWT auth, and role-based authorization.

Stack: MERN (MongoDB, Express, React, Node) + TypeScript + `ws` WebSockets + Monaco Editor + Tailwind CSS.

---

## Sequence 1: Setup & Structure
- [x] Root folders: `client/` and `server/`
- [x] Defined stack and folder architecture

## Sequence 2: Server Core (Express + TS)
- [x] env loading, cors, helmet, json (10mb), cookie-parser
- [x] MongoDB connection (Mongoose)
- [x] AppError + centralized error handler + asyncHandler
- [x] Zod validation error handling

## Sequence 3: Auth (JWT httpOnly)
- [x] User model (bcrypt hash via helpers)
- [x] register / login / logout / me
- [x] `protect` middleware (cookie or Bearer)
- [x] Returns token in body for WebSocket auth; httpOnly cookie for API auth

## Sequence 4: Workspace & File Models + Routes
- [x] Workspace (owner + members with roles owner/editor/viewer)
- [x] File (tree: path, parentId, isDirectory, content, language)
- [x] RBAC middleware `requireWorkspaceRole`
- [x] Workspace routes: create, list, get, add member
- [x] File routes: list, create, rename/update, delete (recursive)

## Sequence 5: WebSocket Server
- [x] `ws` attached to HTTP server
- [x] Auth on connect via query token + membership check
- [x] Rooms keyed by workspaceId
- [x] Events: `file:update`, `file:created/renamed/deleted`, `cursor:update`
- [x] `presence:update` broadcast on join/leave
- [x] Viewers blocked from mutating events (server enforced)

## Sequence 6: Client Setup (Vite + React + TS + Tailwind)
- [x] Vite config, Tailwind v4, Router, Axios (withCredentials)
- [x] Zustand auth store + workspace store
- [x] Route guards (RequireAuth, RedirectIfAuthed)
- [x] Login / Register / Dashboard pages

## Sequence 7: Editor + Realtime Sync
- [x] Monaco Editor integration
- [x] WS client hook `useWorkspaceSocket`
- [x] Per-fileId sync broadcast to other clients
- [x] Remote updates applied to store
- [x] Debounced persistence (PATCH content after 800ms)
- [x] Read-only mode for viewers
- [x] Cursor position broadcast (throttled)

## Sequence 8: File Explorer + Workspace UI
- [x] File explorer: create / rename / delete
- [x] Editor tabs (open/close/switch)
- [x] Members panel + online presence + invite (owner only)
- [x] Member role editing (owner only) + remove member
- [x] Populated member/owner names in API responses
- [x] Header with role badge + online count

## Sequence 9: Guards, Validation, Polish
- [x] Route guards, RBAC checks, Zod validation on all inputs
- [x] Centralized error handling, typed client/server
- [x] Production build verified (`vite build`)

## Sequence 10: Run & Verify
- [x] API smoke test (register, workspace, files CRUD)
- [x] WS broadcast test (two clients, editor edit propagates)
- [x] Both apps run: server :5000, client :5173

## Sequence 11: Workspace Settings, Templates & Docker
- [x] Rename/update workspace (name, description) — owner only
- [x] Delete workspace (cascades files) — owner only
- [x] Project templates on create (blank, node, react, python) + `/workspaces/templates`
- [x] Client settings modal + template picker + delete from dashboard
- [x] Docker: `docker-compose.yml` (mongo + mongo-express), `docker-compose.full.yml` (server + client + mongo)
- [x] Dockerfiles for server (tsc build) and client (vite build + nginx)
- [x] `VITE_API_URL` / `VITE_WS_URL` env support
- [x] README with local dev, Atlas, and Docker instructions

## Sequence 12: Deployment (Vercel + server host)
- [x] `client/vercel.json` (SPA rewrite, Vite) + root `vercel.json` for monorepo root
- [x] `VITE_API_URL` / `VITE_WS_URL` documented for Vercel env vars
- [x] Cross-site cookies: `sameSite=none` + `secure` in production, `trust proxy`
- [x] CORS supports comma-separated `CLIENT_URL` origins
- [x] README Deploy section (Vercel client, Render/Railway server for `ws`)
- [x] `client/.env.example`
- [x] `render.yaml` Blueprint (API web service, auto-generated JWT_SECRET)
- [x] `server/railway.json` (Nixpacks build + health check)

## Sequence 13: Tests (Vitest)
- [x] Server Vitest (node env) + `npm test` script
- [x] Server tests: templates, workspace/member zod schemas, jwt round-trip, AppError (16 tests)
- [x] Server `tsconfig` excludes `**/*.test.ts` so nothing lands in `dist/`
- [x] Client Vitest (jsdom) + React Testing Library + `npm test` script
- [x] Client tests: `refId`/`refName`, workspace store (role detection, tabs, file upsert, cascade delete, presence), LoginPage (submit + error) (24 tests)
- [x] Bug fix found by tests: deleting a folder now closes all descendant open tabs (`client/src/store/workspace.ts` `removeFile`)
- [x] Root `package.json` so `npm test` / `npm run build` run both sides
- [x] README "Testing" section

---

## How to run

### Prerequisites
- Node.js 18+
- MongoDB running locally (or set `MONGO_URI` to Atlas)

### Server
```
cd server
cp .env.example .env   # then edit values
npm install
npm run dev            # http://localhost:5000
```

### Client
```
cd client
npm install
npm run dev            # http://localhost:5173
```

### .env (server)
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/collab_code_editor
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

## WS Event reference
| Event | Direction | Notes |
|---|---|---|
| `join` (via query params) | client -> server | `?token=...&workspaceId=...` |
| `presence:update` | server -> clients | online user ids |
| `file:update` | both | `{ fileId, content }` (editors/owners) |
| `file:created` | both | `{ file }` |
| `file:renamed` | both | `{ file }` |
| `file:deleted` | both | `{ fileId }` |
| `cursor:update` | both | `{ fileId, line, column }` |

## REST API reference
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | public | creates user, sets cookie, returns token |
| POST | `/api/auth/login` | public | login |
| POST | `/api/auth/logout` | auth | clears cookie |
| GET | `/api/auth/me` | auth | current user |
| GET | `/api/workspaces/templates` | auth | list project templates |
| POST | `/api/workspaces` | auth | create workspace (optional `template`) |
| GET | `/api/workspaces` | auth | list my workspaces |
| GET | `/api/workspaces/:id` | member | get workspace (populated) |
| PATCH | `/api/workspaces/:id` | owner | rename / update description |
| DELETE | `/api/workspaces/:id` | owner | delete workspace + files |
| POST | `/api/workspaces/:id/members` | owner | add member by email |
| PATCH | `/api/workspaces/:id/members/:userId` | owner | update member role |
| DELETE | `/api/workspaces/:id/members/:userId` | owner | remove member |
| GET | `/api/workspaces/:id/files` | member | list files |
| POST | `/api/workspaces/:id/files` | editor+ | create file/folder |
| PATCH | `/api/workspaces/:id/files/:fileId` | editor+ | rename / update content |
| DELETE | `/api/workspaces/:id/files/:fileId` | editor+ | delete file (recursive) |

## Roles
- **owner**: full control, manage members, all file ops
- **editor**: edit content, create/rename/delete files
- **viewer**: read-only (server blocks mutating events)
