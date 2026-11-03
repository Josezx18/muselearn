# Security policy

## Reporting a vulnerability

Please report security problems privately to **josejx18@gmail.com** instead of opening a public issue. Include the steps to reproduce and the impact you observed. You will get an answer within a few days.

The repository and its seeds contain only fictional data. Never test against accounts or data that are not yours.

## How MuseLearn protects data

- **Database:** Row Level Security on every table. Students see only their own work and teachers only their own classes; 214 automated checks (`npm run rls`) verify it against a local PostgreSQL.
- **Secrets:** model keys and the Supabase service key live only on the server. The browser receives only the public Supabase URL and anon key.
- **Sessions:** handled on the server; session cookies are `HttpOnly`, `Secure` in production and `SameSite=Lax`.
- **API:** every input is validated with Zod; requests that change data are rejected when they come from another site (CSRF origin check); daily AI limits per account.
- **Files:** private storage, PDF and images only, 10 MB maximum, paths checked on the server; teachers receive short-lived signed links only for their own classes.
- **Headers:** `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, a strict referrer policy, HSTS, and camera/microphone limited to the app itself.
- **AI:** model output is validated against schemas before it is used; images and student text are treated as data, never as instructions; student data is never sent to Meta's *Contributor* tier.
