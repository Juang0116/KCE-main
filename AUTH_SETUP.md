# Auth setup (Magic Link) — KCE

## 1) Install dependency

```bash
npm i @supabase/ssr
```

## 2) Supabase dashboard config

Supabase → Authentication → URL Configuration

- Site URL:
  - http://localhost:3000

- Additional Redirect URLs:
  - http://localhost:3000/auth/callback
  - http://localhost:3000/\*
  - (si usas 127.0.0.1)
    - http://127.0.0.1:3000/auth/callback
    - http://127.0.0.1:3000/*

## 3) Run

```bash
rm -rf .next
npm run dev
```

## 4) Notes

- El error “For security purposes… after X seconds” es rate-limit/cooldown normal.
- Ya hay UX de cooldown en el botón.
