# OBRIX ElizaOS service

A standalone ElizaOS runtime and small authenticated HTTP bridge for the OBRIX Copilot. It runs separately from Next.js so the frontend can remain on Vercel and the agent can run as a persistent service.

## Local setup

Run from this directory:

```bash
bun install
cp .env.example .env
```

Set `OPENAI_API_KEY` and generate a long random `OBRIX_COPILOT_TOKEN` in `.env`. Keep this file private; never commit secrets.

Start the runtime and bridge:

```bash
bun run start
```

The ElizaOS agent runtime listens internally on port 3001. The authenticated bridge listens on `PORT` (3002 by default) and exposes:

- `GET /healthz` — service health
- `POST /chat` — authenticated chat endpoint

The bridge uses the official `@elizaos/api-client` Jobs API to ask the running agent. Its request body is `{ "message": "...", "userId": "..." }`.

## Deploy as a separate Railway service

Create a new Railway service from this repository. Set the Dockerfile path to `Obrix-main/services/elizaos/Dockerfile` and use the repository root as the build context.

Add these service variables in Railway:

- `OPENAI_API_KEY` — your model provider key
- `OBRIX_COPILOT_TOKEN` — a long random shared secret
- `PORT` — set by Railway; otherwise the bridge defaults to 3002

Optional:

- `ELIZAOS_RUNTIME_API_KEY` — if the internal runtime is configured to require an API key
- `ELIZAOS_RUNTIME_URL` — defaults to `http://127.0.0.1:3001`

The Railway health check uses `/healthz`. After deployment, copy the public bridge domain and append `/chat`.

## Connect the OBRIX web app

Set these server-side variables in the OBRIX Vercel project:

- `ELIZAOS_CHAT_URL` — the full bridge URL, for example `https://YOUR-SERVICE.up.railway.app/chat`
- `OBRIX_COPILOT_TOKEN` — exactly the same secret configured in Railway

Redeploy the OBRIX web app after adding the variables. The Next.js `/api/copilot` route forwards requests to the bridge without exposing the service URL or shared token to the browser.

## Safety boundary

The Copilot is read/advice-only in this first phase. The character does not have wallet signing, token-launch, transfer, or private-key actions. OBRIX's existing Pons V2 launch page remains the only transaction preparation and wallet-approval flow. Any future launch handoff must produce a draft and send the user to that existing page for review and signing.

## Next phase

After the chat service is deployed and verified, add OBRIX-specific read-only plugins for Robinhood Chain data and launch monitoring. Autonomous background agents should run as separate persistent workers, not as Next.js serverless functions.
