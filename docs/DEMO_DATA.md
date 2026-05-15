# RaceHub demo data seed

`prisma/seed-demo.ts` intentionally creates fictional, realistic RaceHub activity for local development or for the live production Supabase database when explicitly confirmed.

## Safety model

The demo seed is opt-in. It will not run unless `DEMO_SEED_ENABLED=true` is set.

When `NODE_ENV="production"`, it also refuses to run unless `DEMO_SEED_PRODUCTION_CONFIRM=true` is set. Use that production confirmation only when you intentionally want to populate the live site.

Before running any command, check `DATABASE_URL` and `DIRECT_URL`. This seed writes to the database your environment points to. Do not paste Supabase service role keys, cookies, tokens, or any other secret into the repository or terminal output.

Demo records are designed to be safely identifiable and removable:

- demo users use emails ending in `@racehub.demo`
- demo communities use known stable slugs such as `apex-syndicate`, `sunday-sprint-club`, and `monza-after-dark`
- demo leagues use stable `*-demo-league` slugs linked to those communities
- demo race slots are recreated only when linked to demo leagues/profiles
- clear mode removes only demo records and never deletes users whose email does not end in `@racehub.demo`

The seed creates at least 100 fictional users, 15 public communities backed by `OrganiserProfile`, memberships and staff roles, leagues, public and community-only races, registrations, completed results, leaderboard-impacting rating/honour changes, honour events, and fictional dispute/admin activity.

## Local development

PowerShell local:

```powershell
$env:DEMO_SEED_ENABLED="true"
npm run db:seed:demo
```

Optional target label for startup logs:

```powershell
$env:DEMO_SEED_TARGET="local"
```

If `DEMO_USER_PASSWORD` is not provided, all demo accounts use the demo-only default password `RaceHubDemo123!`.

## Live production Supabase

PowerShell production:

```powershell
$env:DEMO_SEED_ENABLED="true"
$env:DEMO_SEED_PRODUCTION_CONFIRM="true"
$env:NODE_ENV="production"
$env:DEMO_SEED_TARGET="production"
npm run db:seed:demo
```

Use the production confirmation only when intentionally populating the live RaceHub site. Confirm `DATABASE_URL` / `DIRECT_URL` point to the intended Supabase database first.

## Clear demo data

Clear mode only removes demo records created by the demo seed.

PowerShell production clear:

```powershell
$env:DEMO_SEED_ENABLED="true"
$env:DEMO_SEED_PRODUCTION_CONFIRM="true"
$env:NODE_ENV="production"
$env:DEMO_SEED_TARGET="production"
npm run db:seed:demo:clear
```

Local clear can omit the production confirmation when `NODE_ENV` is not `production`:

```powershell
$env:DEMO_SEED_ENABLED="true"
npm run db:seed:demo:clear
```

## Verification checklist

After seeding, verify the populated experience:

- `/communities` shows the 15 public demo communities
- `/communities/[slug]` works for known demo slugs such as `/communities/apex-syndicate`
- `/race-slots` shows upcoming public `OPEN`, `FULL`, or `LOCKED` races
- `/leaderboards` includes demo users with rating and honour changes
- `/leagues` includes demo leagues
- a demo organiser can log in with a `@racehub.demo` account
- the demo platform admin can log in with `magicmonkey@racehub.demo`
