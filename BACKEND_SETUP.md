# Backend setup

## Environment
Copy `.env.example` to `.env` and set `DATABASE_URL` for your local PostgreSQL instance.

## First-time local setup
1. `npm install`
2. `npm run db:generate`
3. `npm run db:migrate -- --name init`
4. `npm run db:seed`
5. `npm run dev`

## Applying new schema changes (like RaceSlot.track/eventNotes/visibility)
If your code has newer Prisma models but your DB is behind, apply committed migrations:

1. `npm run db:status`
2. `npm run db:deploy`
3. `npm run db:generate`
4. Restart app server (`npm run dev`)

For development databases, you can also use:
- `npm run db:migrate -- --name <descriptive_name>`

## Seed login credentials
- Admin: `admin@f1grid.local` / `ChangeMe123!`
- Organiser: `organiser1@f1grid.local` / `ChangeMe123!`
- Player: `player1@f1grid.local` / `ChangeMe123!`
