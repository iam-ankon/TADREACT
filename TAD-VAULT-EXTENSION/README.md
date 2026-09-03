# TAD Password Vault — Browser Extension

Autofill and auto-login into any website using credentials stored in the TAD
Password Vault (`/vault` in the main TAD app).

## How it works

- **popup** — log in with your TAD account (same login as the main app).
  Your auth token is stored in the extension's own local storage, never in a
  web page's `localStorage`.
- **background.js** — the only piece that talks to the TAD API. On the
  current tab's domain, it asks the backend for matching vault items
  (`GET /api/vault/items/for-domain/`), and on your click, fetches the
  decrypted password via the audit-logged `/reveal/` endpoint.
- **content.js** — injected into the page you're viewing. Finds the visible
  password field (and the username field near it), fills both, and submits
  the form.

The decrypted password is fetched fresh for each fill and handed only to the
specific tab you clicked "Fill & Log in" from — it is never cached or stored
by the extension.

## Install (development / internal use)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select this `TAD-VAULT-EXTENSION` folder.
4. Pin the extension (puzzle-piece icon → pin) for easy access.
5. Click the icon, log in with your TAD username/password.
6. Visit a site you have a vault credential for, click the extension icon,
   and click **Fill & Log in**.

## Rolling this out to many PCs

These PCs aren't centrally managed (no Google Workspace, no Active Directory
Group Policy), so there's no way to push this to every machine remotely.
Chrome also deliberately does not allow any script to flip on Developer Mode
or pick the unpacked folder for you — that's a manual, one-time click by
design, to stop extensions from silently installing themselves.

What you *can* automate is everything around those two clicks:

1. Put this whole `TAD-VAULT-EXTENSION` folder somewhere every PC can reach
   it (a shared network drive, or a USB stick).
2. On each PC, right-click `install.ps1` → **Run with PowerShell**. It copies
   the extension to a fixed local folder, puts that folder's path on the
   clipboard, and opens `chrome://extensions` for you.
3. Turn on **Developer mode**, click **Load unpacked**, paste (Ctrl+V) the
   path, and select the folder.

That's the fastest a per-PC setup gets without buying into Google Workspace
or Active Directory. If TAD ever moves onto either of those, this extension
can instead be force-installed silently and auto-updated across every
machine — ask if you want that set up when the time comes.

## Known limitations

- Matching is by hostname (e.g. `cpanel.texweave.net`) — if a site changes
  domains, update the URL on the vault item.
- Sites with multi-step logins (username on one screen, password on the
  next), CAPTCHAs, or 2FA will fill what they can but may not fully
  auto-submit through every step.
- The backend URL is hardcoded in `background.js` and `manifest.json`
  (`http://119.148.51.38:8000`) — update both if the TAD backend moves.
