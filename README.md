# JCGG Suite

Restaurant operations and books for Joshi's Corner in one browser app: accounts, inventory, KOT and tables, staff and payroll, directory, investments, fixed assets, insurance, and old-data import. Every module posts into one double-entry book.

- **Sign-in:** Google accounts only. Nothing else in the app loads until you sign in.
- **Access:** limited to the owner and the Google accounts the owner adds under **Settings → Users & roles**. The Firestore security rules enforce the same list, so it can't be bypassed from the browser.
- **Data:** stored in your own Firebase project (Cloud Firestore). It syncs live across devices and works offline.
- **Hosting:** static files on GitHub Pages. There is no build step and no server to run.

## One-time setup

1. **Create the Firebase project** at <https://console.firebase.google.com>.
   - **Authentication → Sign-in method:** enable **Google**. Leave every other provider off.
   - **Authentication → Settings → Authorized domains:** add `ssjs1mu.github.io`.
   - **Firestore Database:** create the database in production mode (region `asia-south1`).
2. **Publish the security rules.** Go to **Firestore → Rules**, paste the contents of [`firestore.rules`](firestore.rules), replace `OWNER_EMAIL` with the owner's Google address in lower case, then click **Publish**. Keep the placeholder as it is in this repository, so the address isn't public.
3. **Connect the app.** In `js/firebase-config.js`:
   - Paste the web app's `firebaseConfig` values from **Project settings → Your apps**.
   - Set `ownerHash` to the SHA-256 of the owner's email in lower case. To get it, run this in any browser console:
     `crypto.subtle.digest("SHA-256",new TextEncoder().encode("you@gmail.com")).then(b=>console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")))`
4. **Turn on GitHub Pages.** In **Settings → Pages**, deploy from the `main` branch, root folder. The app is served at `https://ssjs1mu.github.io/jcgg/`.

On the owner's first sign-in, the default chart of accounts is created automatically.

## Moving data from the earlier version

1. In the old JCGG Suite page, open **Settings → Backup & data → Download full backup**.
2. Here, open **Settings → Backup & data → Restore** and load that file. Restoring only adds or replaces records; it never deletes anything.

## Roles

| Role | Sees |
|---|---|
| Super Admin (owner) | Everything, including who has access |
| Admin | Every module |
| Manager | Operations, accounts, assets, insurance |
| Accountant | Accounts, payroll, investments, assets, insurance |
| Chef | Inventory, KOT, directory |
| Auditor | Every module, read-only; the database refuses Auditor writes |

## Market data

There is no built-in price feed. Prices and daily OHLC come only from what you enter or upload, such as NSE/BSE history CSVs or an ODIN export, and each is shown with its date. Unpriced holdings stay blank and are never estimated.

## Files

```
index.html              page shell and sign-in gate
css/app.css             styles (light and dark, print)
js/firebase-config.js   your Firebase project settings
js/core.js              data layer, Google sign-in, routing
js/mod-*.js             one file per module
firestore.rules         database security rules (publish in the Firebase console)
```
