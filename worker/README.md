# Generated Search Worker

## Local development

1. `cd worker && npm install`
2. Copy `.dev.vars.example` to `.dev.vars`
3. Create the D1 database: `npx wrangler d1 create family-generated-search`
4. Put the returned `database_id` into `wrangler.jsonc`
5. Apply migrations locally: `npx wrangler d1 migrations apply family-generated-search --local`
6. Start the worker: `npm run dev`

## Required GitHub configuration

- Repository variable: `HANZI_API_BASE_URL`
- Repository secrets:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - `OPENAI_API_KEY`
  - `GENERATED_SEARCH_ADMIN_TOKEN`
