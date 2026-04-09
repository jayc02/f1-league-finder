# Backend setup

## Environment
Copy `.env.example` to `.env` and set `DATABASE_URL` for your local PostgreSQL instance.

## Commands
1. `npm install`
2. `npm run db:generate`
3. `npm run db:migrate -- --name init`
4. `npm run db:seed`
5. `npm run dev`

## Seed login credentials
- Admin: `admin@f1grid.local` / `ChangeMe123!`
- Organiser: `organiser1@f1grid.local` / `ChangeMe123!`
- Player: `player1@f1grid.local` / `ChangeMe123!`
