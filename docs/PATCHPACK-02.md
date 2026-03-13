# PATCHPACK-02 (KCE-clean-main)

Contenido:

- scripts/smoke.mjs -> Fix spawn EINVAL en Windows/Git Bash (usa npm.cmd + args array)
- scripts/qa-gate.mjs -> QA-GATE: ya NO falla solo por existir .env.local; falla SOLO si está
  trackeado por git
- .gitattributes -> Normaliza EOL (LF) para evitar warnings CRLF

Cómo aplicar:

1. Descarga y descomprime este zip.
2. Copia/pega en la raíz de tu repo KCE-clean-main (reemplazando archivos).
3. Ejecuta:
   - npm run qa:ci
   - npm run qa:smoke
4. Commit + push.
