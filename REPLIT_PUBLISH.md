# Replit pull and publish

## First-time import

1. In Replit, choose **Create Repl → Import from GitHub** and select `stewartbailie-ops/Foundational-Expressions-App`.
2. Confirm the Run command is `npm run dev`. The checked-in `.replit` maps port 5000 and defines the production build/start commands.
3. In **Secrets**, add the six `VITE_PROFILE_*` values listed in `.env.example`.
4. Run the Repl and verify `/`, `/erica`, and `/request-callback`.

## Pull future GitHub changes

```sh
git status --short
git pull --ff-only origin main
npm ci
npm run check
npm run build
```

Do not pull over uncommitted Replit edits. Commit/push them first or intentionally discard them in the Replit Git pane.

## Publish

1. Open **Deployments** and choose **Reserved VM**.
2. Confirm build is `npm run build` and run is `npm run start` (already defined in `.replit`).
3. Add the same `VITE_PROFILE_*` values to the deployment environment.
4. Publish, open the deployment URL, and test call, WhatsApp, email, QR, save-contact, and callback actions on a phone.

The QR code uses `VITE_PROFILE_URL`; set it to the final custom-domain profile URL before the production build.
