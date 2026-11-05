# OBRIX ElizaOS service

This directory is the deployment boundary for the OBRIX AI runtime. Keep it separate from the Next.js app so the frontend can remain on Vercel while the long-running agent service runs on a persistent Node/Bun host.

## Scaffold the ElizaOS project

From the repository root:

    bun install -g @elizaos/cli
    elizaos create obrix-copilot --type project --dir services/elizaos

If the CLI asks for a database, choose PostgreSQL for a persistent deployment (or its local development option while testing). Configure a model provider in the generated service's local environment, then:

    cd services/elizaos
    bun install
    bun run dev

Use the generated project's current CLI/API instructions as the source of truth for the agent server and chat endpoint. Do not copy the generated service into the Next.js app or add its runtime dependencies to the frontend package.

## Connect the OBRIX web app

Set these server-side variables in the OBRIX deployment (never NEXT_PUBLIC_):

- ELIZAOS_CHAT_URL: the full HTTPS URL of the ElizaOS agent's message endpoint.
- ELIZAOS_API_TOKEN: optional bearer token if the agent endpoint is protected.

The Next.js route /api/copilot sends { "text": "...", "userId": "..." } to that configured endpoint. Confirm the generated ElizaOS endpoint accepts this payload before connecting it. The route keeps the endpoint and token on the server.

For local development, the service may run on a local port; use an HTTPS URL in production. Localhost is accepted by the development proxy.

## Safety boundary

The Copilot is read/advice-only in this first phase. Do not install wallet-signing, token-launch, transfer, or private-key actions. OBRIX's existing Pons V2 launch page remains the only transaction preparation and wallet-approval flow. Any future launch handoff must produce a draft and send the user to the existing launch page for review and signing.

## Next phase

After chat is connected and verified, add OBRIX-specific ElizaOS plugins for read-only Robinhood Chain data and launch monitoring. Run background agents as persistent workers, not as Next.js serverless functions.
