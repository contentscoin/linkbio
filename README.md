# LinkBio

LinkBio is a small, separate link-in-bio app backed by Postgres. It includes
signup/login, a private admin editor, public `/{handle}` pages, Drizzle schema
management, and an optional golf profile seed.

## Getting Started

Create a local environment file:

```powershell
Copy-Item .env.example .env.local
```

Fill in:

- `DATABASE_URL`: Neon or another Postgres connection string.
- `SESSION_SECRET`: at least 32 random characters.
- `NEXT_PUBLIC_SITE_URL`: `http://localhost:3000` for local development.

Generate a session secret with Node:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Run the schema and app:

```bash
npm run db:push
npm run dev
```

Useful scripts:

- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run db:generate`
- `npm run db:push`
- `npm run db:studio`
- `npm run seed:golf`

The seed requires:

```powershell
$env:DATABASE_URL="postgresql://..."
$env:SEED_EMAIL="you@example.com"
$env:SEED_PASSWORD="10-character-minimum"
$env:SEED_HANDLE="bolbanjang"
npm run seed:golf
```

Security notes:

- Passwords are hashed with bcrypt cost 12.
- Sessions are HS256 JWTs in HttpOnly, SameSite=Lax cookies. Production cookies are Secure.
- Server Actions re-check authentication and ownership for mutations.
- Link URLs allow only `http` and `https`.
- Rate limiting is currently in-memory. Move it to Upstash Redis or Vercel KV before real traffic.
