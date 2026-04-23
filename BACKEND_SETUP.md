# Backend setup

## Environment
Copy `.env.example` to `.env` and configure:
- `DATABASE_URL`
- `PUBLIC_SITE_URL` (set to `https://racehub.gg` in production)
- `UPLOAD_STORAGE_DIR` (mount to persistent storage in production)
- `RESEND_API_KEY` and `EMAIL_FROM` for dispute and moderation emails

## First-time local setup
1. `npm install`
2. `npm run db:generate`
3. `npm run db:migrate -- --name init`
4. `npm run db:seed`
5. `npm run dev`

## Applying new schema changes
1. `npm run db:status`
2. `npm run db:deploy`
3. `npm run db:generate`
4. Restart app server (`npm run dev`)

For development databases, you can also use:
- `npm run db:migrate -- --name <descriptive_name>`

## Seed login credentials
- Admin: `admin@racehub.local` / `ChangeMe123!`
- Organiser: `organiser1@racehub.local` / `ChangeMe123!`
- Player: `player1@racehub.local` / `ChangeMe123!`
