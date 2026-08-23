# BatteryCare OS

A field-service platform for battery diagnostics, dispatch, warranty management, and technician payouts — built as a single-file, installable web app (PWA) hosted on GitHub Pages, backed by Firebase (Authentication + Firestore).

**Live site:** https://enerpots2025.github.io/BatteryCare--Service/

---

## What it does

BatteryCare OS covers the full service lifecycle:

**Train → Certify → Authorize → Dispatch → Service → Verify → Pay → Learn**

It has four separate portals, each with its own access:

| Portal | Access | What they can do |
|---|---|---|
| **Customer** | No login — mobile number lookup | Report a battery problem, track their job |
| **Technician** | Real login (email/password) | See and complete only their own assigned jobs, track their own payouts |
| **OEM / Brand** | Real login (email/password) | Report issues for their brand, track only their own jobs and warranty claims |
| **Ops Console** | Real login (email/password, admin) | Full access — Job Register, Dispatch Board, Technicians, OEM Master, Service Catalogue, Warranty, Payouts, Battery Passport, Parts, SOP Checklist, Admins |

Technician and OEM accounts are strictly isolated — logging in only ever shows *your own* data, never anyone else's.

---

## Tech stack

- **Frontend:** Single `index.html` file — vanilla JavaScript, no build step, no framework
- **Backend:** [Firebase](https://firebase.google.com)
  - **Authentication** — Email/Password sign-in for Technician, OEM, and Ops portals
  - **Firestore** — all app data lives in one document, kept in sync live across every portal
- **Hosting:** [GitHub Pages](https://pages.github.com) (static hosting, free, HTTPS by default)
- **PWA:** installable on desktop and mobile, with an offline-capable app shell via a service worker

---

## File structure

```
├── index.html               # the entire app — UI, styling, and logic
├── manifest.json             # PWA manifest (name, icons, theme colors)
├── service-worker.js         # caches the app shell for offline/fast loading
├── icon-192.png               # PWA icon
├── icon-512.png               # PWA icon
├── icon-512-maskable.png      # PWA icon (Android adaptive icon safe zone)
├── apple-touch-icon.png       # iOS home-screen icon
└── README.md                  # this file
```

All 7 files must sit together in the repo root — `manifest.json` and the icons are referenced by relative path from `index.html`.

---

## One-time Firebase setup

1. Go to the [Firebase Console](https://console.firebase.google.com) and open (or create) your project.
2. **Authentication:** Build → Authentication → Sign-in method → enable **Email/Password**.
3. **Firestore:** Build → Firestore Database → Create database (choose a region, Test mode is fine to start — see [Security](#security--important-caveat) below).
4. **Web app config:** Project settings → gear icon → scroll to "Your apps" → Add app → choose the **`</>` Web** icon (not iOS/Android) → register it → copy the `firebaseConfig` object it shows you.
5. Paste that config into the `firebaseConfig` object near the top of `index.html`, inside the first `<script type="module">` block.

The very first person to sign up through the **Ops Console** login screen automatically becomes the first admin. From there, admins can create logins for other admins, technicians, and OEMs from inside the app — no need to touch the Firebase Console again for day-to-day account management.

---

## Deploying updates

GitHub Pages serves whatever is in the repo, so to publish a change:

1. Edit `index.html` (or the other files) **directly on GitHub**, or replace the existing file by clicking into it and using the edit (pencil) icon — not "Add file → Upload files" with a downloaded copy, which tends to create a duplicate with a slightly different filename instead of overwriting the original.
2. Commit to the branch GitHub Pages is configured to build from (check **Settings → Pages** to confirm which branch/folder).
3. Wait for the **Actions** tab to show a green checkmark for the Pages build.
4. Test in an **Incognito/Private window** or hard-refresh (Ctrl+Shift+R / Cmd+Shift+R) to bypass any cached copy.

> The file served at the site root **must be named exactly `index.html`** (lowercase, single extension) — GitHub Pages won't auto-serve anything else as the homepage.

---

## Installing as an app (PWA)

- **Android (Chrome):** open the site → menu → "Add to Home screen" / "Install app"
- **iOS (Safari):** open the site → Share → "Add to Home Screen"
- **Desktop (Chrome/Edge):** look for the install icon in the address bar

Once installed, the app shell loads instantly from cache even on a poor connection — though live data (jobs, technicians, etc.) always requires an actual network connection to Firebase.

---

## Security — important caveat

Firestore currently runs in **Test mode**, meaning anyone with the `firebaseConfig` (which is necessarily public, since it's embedded in client-side code) could technically read or write data directly, bypassing the app's login screens entirely.

The login system in this app controls what the **UI shows** to each portal — it does not yet enforce access at the **database** level. To properly lock this down, add [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started) that require authentication and restrict writes based on the signed-in user's role. This is a recommended next step before handling sensitive production data at scale.

---

## Known limitations

- All data lives in a **single Firestore document** rather than separate collections — simple and fast to build on, but means the whole state is read/written together. Splitting into proper collections (`jobs`, `technicians`, `oems`, etc.) would allow finer-grained security rules and better scale.
- Ops Console currently has no security-rule-level protection beyond the login screen (see above).
- No offline write support — the service worker caches the app shell for fast/offline *loading*, but creating or editing records still requires an active connection to Firestore.
