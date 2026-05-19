# RaceHub Auth

## Included flows
- Email/password login + registration remain active.
- Forgot password: `POST /api/auth/forgot-password` always returns a generic message.
- Reset password: `POST /api/auth/reset-password` uses single-use SHA-256 token hashes with 30 minute expiry.
- Social login providers: Google and Discord.

## Required env vars
- `PUBLIC_SITE_URL`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `DISCORD_OAUTH_CLIENT_ID`
- `DISCORD_OAUTH_CLIENT_SECRET`
- `OAUTH_STATE_SECRET`

## Redirect URIs
Production:
- `https://www.racehub.gg/api/auth/google/callback`
- `https://www.racehub.gg/api/auth/discord/callback`

Local (default Astro port):
- `http://localhost:4321/api/auth/google/callback`
- `http://localhost:4321/api/auth/discord/callback`

## Security notes
- RaceHub session cookie system (`racehub_session`) is unchanged.
- OAuth secrets are server-side only (never `PUBLIC_`).
- OAuth state uses signed httpOnly cookie, sameSite=lax, 10 minute max age.
- Auth APIs return private/no-store cache headers.
- Password reset tokens are random, high entropy, never stored raw.

## PlayStation
PlayStation OAuth login is intentionally not implemented yet due to partner/official credential requirements. Use the existing `psnTag` profile field for player identity links.
