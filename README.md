# Collab Code Editor

Real-time collaborative code editor. Multiple authorized members edit the same files inside a **workspace** (room), with multi-file management (create/rename/delete) like a lightweight VS Code.

- **Frontend:** React + TypeScript + Vite + Tailwind + Monaco Editor + Zustand
- **Backend:** Node + Express + TypeScript + `ws` (WebSockets) + Mongoose
- **Auth:** JWT (httpOnly cookie for REST, token for WS) with role-based authorization
- **Realtime:** room per workspace, live file sync, presence, cursor events

## Features

- Register / login / logout, protected routes
- Workspaces with roles: **owner**, **editor**, **viewer**
- Owner can invite members by email, change roles, remove members, rename/delete workspace
- Project templates on create (Blank, Node.js, React, Python)
- File explorer: create / rename / delete files (recursive), editor tabs
- Live collaborative editing per file (broadcast to other clients), debounced persistence
- Online presence; viewers are read-only (enforced server-side)
- Docker Compose for Mongo (dev) and full stack (prod-like)

## Project structure

```
collab-code-editor/
├── server/                 # Express + ws API
│   └── src/
│       ├── config/         # db connection
│       ├── controllers/    # auth, workspace, file
│       ├── middlewares/    # auth, RBAC, error handling
│       ├── models/         # User, Workspace, File
│       ├── routes/         # express routers
│       ├── utils/          # jwt, errors, templates
│       ├── validations/    # zod schemas
│       ├── ws/             # websocket server
│       ├── app.ts          # express app
│       └── server.ts       # http + ws bootstrap
└── client/                 # React app
    └── src/
        ├── app/            # router, guards
        ├── features/       # explorer, editor, workspace UI
        ├── hooks/          # useWorkspaceSocket
        ├── lib/            # axios
        ├── pages/          # login, register, dashboard, workspace
        ├── store/          # zustand stores
        └── types/          # shared types
```

## Local development

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally **or** use Docker / Atlas

### 2. Start MongoDB (option A: Docker)
```bash
docker compose up -d         # mongo on :27017, mongo-express on :8081
```

### 3. Server
```bash
cd server
cp .env.example .env          # edit values
npm install
npm run dev                   # http://localhost:5000
```

### 4. Client
```bash
cd client
npm install
npm run dev                   # http://localhost:5173
```

Open http://localhost:5173, register two accounts, create a workspace, invite the second user by email, and edit the same file together.

## Using MongoDB Atlas
1. Create a free cluster at https://cloud.mongodb.com
2. Create a database user and allow your IP (Network Access)
3. Copy the connection string and set it in `server/.env`:
   ```
   MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/collab_code_editor?retryWrites=true&w=majority
   ```
4. Restart the server. No other changes needed.

## Environment variables (server/.env)
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/collab_code_editor
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

## Environment variables (client, optional)
```
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

## Full stack via Docker
```bash
docker compose -f docker-compose.full.yml up --build
# client: http://localhost:5173  (served by nginx)
# server: http://localhost:5000
```
Set `JWT_SECRET`, `CLIENT_URL`, `VITE_API_URL`, `VITE_WS_URL` as needed (env or a root `.env`).

## Testing

Both sides run on **Vitest**.

```bash
# server (node env): templates, zod validations, jwt, AppError
cd server && npm test            # or: npm run test:watch

# client (jsdom + React Testing Library): types helpers, workspace store, login UI
cd client && npm test            # or: npm run test:watch
```

- Server tests live in `server/src/**/*.test.ts` (excluded from `tsc` emit, so nothing is written to `dist/`).
- Client tests live in `client/src/**/*.test.{ts,tsx}`; the shared setup (`client/src/test/setup.ts`) installs jest-dom matchers and cleans up the DOM after each test.
- The client suite mocks `lib/axios`, so no backend needs to be running.
- A root convenience: `npm test` from `collab-code-editor/` runs both suites (see root `package.json`).

## Deploy

### Client → Vercel
The client is a static Vite SPA and deploys cleanly to Vercel. Config is included:

- **Recommended:** set the Vercel **Root Directory** to `client` (uses `client/vercel.json`).
- **Alternative:** keep the repo root as the project root (uses the root `vercel.json`, which builds `client/`).

`vercel.json` includes an SPA rewrite so client-side routes (`/workspace/:id`, `/login`) work on refresh.

Set these env vars in **Vercel → Project → Settings → Environment Variables**:

```
VITE_API_URL=https://<your-api-host>/api
VITE_WS_URL=wss://<your-api-host>
```

Then redeploy (Vite inlines `VITE_*` at build time).

CLI:
```bash
cd client
npx vercel        # preview
npx vercel --prod # production
```

### Server → a WebSocket-capable host (NOT Vercel)
Vercel serverless functions are short-lived and **cannot hold a persistent `ws` connection**, so the API/WebSocket server must run on a long-lived host such as **Render, Railway, Fly.io, or a VPS**.

Server deploy notes:
- Start command: `npm run build && npm start` (or `npm run dev` for a persistent process manager)
- Health check: `GET /api/health`
- Env vars:
  ```
  PORT=5000                 # most hosts inject PORT
  NODE_ENV=production
  MONGO_URI=mongodb+srv://...   # Atlas
  JWT_SECRET=<strong-secret>
  JWT_EXPIRES_IN=7d
  CLIENT_URL=https://<your-vercel-app>.vercel.app
  ```
- Ensure your host allows WebSocket upgrades (Render/Railway/Fly do by default).

> Cross-site cookies: the client and server are on different origins, so set the cookie `sameSite:'none'` + `secure:true` in production (`server/src/controllers/authController.ts`) and make sure `CLIENT_URL` matches the Vercel URL exactly for CORS.

### One-click server deploy

**Render** — `render.yaml` is included at the repo root. In Render: **New → Blueprint → select this repo**. It creates a Node web service rooted at `server/` (`buildCommand: npm install && npm run build`, `startCommand: npm start`, health check `/api/health`). Render will prompt for:
- `MONGO_URI` — your Atlas connection string
- `CLIENT_URL` — your Vercel URL (comma-separate to allow several)

`JWT_SECRET` is generated automatically. An optional static-site block for hosting the client on Render is included (commented out).

**Railway** — `server/railway.json` is included. Create a project, **Deploy from repo**, set the service **Root Directory** to `server`, then add a **MongoDB** database. Add a variable mapping Railway's connection string to what the server expects:
```
MONGO_URI=${{ MongoDB.MONGO_URL }}
JWT_SECRET=<strong-secret>
CLIENT_URL=https://<your-vercel-app>.vercel.app
```
Railway injects `PORT` automatically and supports WebSocket upgrades.

After either deploy, set the client's `VITE_API_URL` (`https://<api-host>/api`) and `VITE_WS_URL` (`wss://<api-host>`) in Vercel and redeploy.

## REST API
| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/logout` | auth |
| GET | `/api/auth/me` | auth |
| GET | `/api/workspaces/templates` | auth |
| POST | `/api/workspaces` | auth |
| GET | `/api/workspaces` | auth |
| GET | `/api/workspaces/:id` | member |
| PATCH | `/api/workspaces/:id` | owner |
| DELETE | `/api/workspaces/:id` | owner |
| POST | `/api/workspaces/:id/members` | owner |
| PATCH | `/api/workspaces/:id/members/:userId` | owner |
| DELETE | `/api/workspaces/:id/members/:userId` | owner |
| GET | `/api/workspaces/:id/files` | member |
| POST | `/api/workspaces/:id/files` | editor+ |
| PATCH | `/api/workspaces/:id/files/:fileId` | editor+ |
| DELETE | `/api/workspaces/:id/files/:fileId` | editor+ |

## WebSocket protocol
Connect: `ws://localhost:5000?token=<jwt>&workspaceId=<id>`

| Type | Direction | Payload |
|---|---|---|
| `connected` | server → client | `{ message }` |
| `presence:update` | server → clients | `{ online: string[] }` |
| `file:update` | client ↔ server | `{ fileId, content }` |
| `file:created` | client ↔ server | `{ file }` |
| `file:renamed` | client ↔ server | `{ file }` |
| `file:deleted` | client ↔ server | `{ fileId }` |
| `cursor:update` | client ↔ server | `{ fileId, line, column, name }` |

## Roles
- **owner** — manage members, roles, settings, delete workspace, all file ops
- **editor** — edit content, create/rename/delete files
- **viewer** — read-only (mutating WS events rejected by the server)
