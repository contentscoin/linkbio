# Error log

[2026-08-03 13:35 KST] Error details:
- Error: `TS2345` — `(row: { table_name: string }) => string` not assignable to neon query `Record<string, any>` map callback
- Location: `scripts/apply-schema.ts` (before/after `existing.map` / `after.map`)
- Relation to AI: prior schema helper typed neon rows too narrowly
- Root cause: `@neondatabase/serverless` returns `Record<string, any>[]`; annotated parameter was incompatible under strict checking
- Fix: use unannotated `row` and `String(row.table_name)`
- Result: `npm run typecheck` · `npm run build` pass
