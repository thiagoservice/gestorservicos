---
name: Auth system
description: How authentication works after removing Replit OIDC — simple email+password with DB sessions.
---

Replit OIDC was removed. Auth now works as follows:

- `POST /api/auth/login` — checks `req.body.{email,password}` against `process.env.LOGIN_EMAIL` and `process.env.LOGIN_PASSWORD` (Replit Secrets). On success, creates a DB-backed session and sets `sid` HttpOnly cookie (7-day TTL).
- `GET /api/auth/user` — returns current user from session or null.
- `GET /api/logout` — clears session + cookie, redirects to `/`.
- Sessions stored in `sessionsTable` (same as before). `SessionData.access_token` is now optional.
- Frontend login form: email + password fields in `App.tsx`; `useAuth()` from `lib/replit-auth-web` has `login(email, password): Promise<void>` signature.
- Hard-coded owner user: `{ id: 'owner', email: LOGIN_EMAIL, firstName: 'Thiago' }`.

**Why:** Owner is the sole user; Replit OIDC failed in production and added unnecessary complexity.

**How to apply:** If adding new users ever becomes needed, extend `POST /api/auth/login` to check a users table instead of env vars.
