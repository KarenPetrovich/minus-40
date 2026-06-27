# Vercel Production Deploy

This project must stay host-independent.
Vercel is only a static build host here; all trusted data logic lives in Supabase.

## Required Vercel Environment Variables

Set these in the Vercel project environment for the production target:

- `VITE_SUPABASE_URL=<supabase-project-url>`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<supabase-publishable-key>`

Do not commit real secrets to the repository.

## Build Command

Use the existing Vite build:

```bash
npm run build
```

If the build machine is short on Node heap, set:

```bash
NODE_OPTIONS=--max-old-space-size=4096
```

## What To Verify After Redeploy

- The newest Vercel deployment is the one connected to `https://minus-40.vercel.app`.
- The production bundle contains the Supabase project URL.
- The production bundle contains the Supabase publishable key.
- The production bundle contains the `telegram-sync` function call path.

## Expected Outcome

After the redeploy, the live frontend should bootstrap cloud state through Supabase instead of falling back to local-only state.
