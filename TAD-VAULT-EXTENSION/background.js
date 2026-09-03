// background.js — service worker
// Holds the TAD auth token (chrome.storage.local, never exposed to web pages)
// and talks to the TAD backend on behalf of the popup.

const API_BASE = "http://119.148.51.38:8000";

async function getToken() {
  const { tad_token } = await chrome.storage.local.get("tad_token");
  return tad_token || null;
}

async function apiFetch(path, options = {}) {
  const token = await getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Token ${token}`;
  // Never send this browser's TAD session/CSRF cookies — we authenticate
  // purely via the Token header. If a stale Django admin session cookie is
  // present, DRF's SessionAuthentication enforces CSRF on it and rejects
  // this request with 403 before the token/credentials are even checked.
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "omit" });
  if (res.status === 401) {
    await chrome.storage.local.remove("tad_token");
  }
  return res;
}

async function handleLogin(username, password) {
  const res = await fetch(`${API_BASE}/users/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    credentials: "omit",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    return { ok: false, error: data.error || "Login failed." };
  }
  await chrome.storage.local.set({ tad_token: data.token, tad_username: data.username });
  return { ok: true };
}

async function handleLogout() {
  await chrome.storage.local.remove(["tad_token", "tad_username"]);
  return { ok: true };
}

async function handleAuthStatus() {
  const token = await getToken();
  const { tad_username } = await chrome.storage.local.get("tad_username");
  return { loggedIn: !!token, username: tad_username || null };
}

async function handleGetMatches(domain) {
  const res = await apiFetch(`/api/vault/items/for-domain/?domain=${encodeURIComponent(domain)}`);
  if (!res.ok) return { ok: false, error: `Server returned ${res.status}` };
  const items = await res.json();
  return { ok: true, items };
}

async function handleAutoCheck(domain) {
  // Called by content.js on every page load. Only returns credentials when
  // there's exactly one unambiguous match for this domain — if there are
  // zero or several, we don't guess, and the user falls back to the popup.
  const loggedIn = !!(await getToken());
  if (!loggedIn) return { ok: false };

  const matchesResult = await handleGetMatches(domain);
  if (!matchesResult.ok || matchesResult.items.length !== 1) return { ok: false };

  const [item] = matchesResult.items;
  const res = await apiFetch(`/api/vault/items/${item.id}/reveal/`, { method: "POST" });
  if (!res.ok) return { ok: false };
  const { password } = await res.json();
  return { ok: true, username: item.username, password, title: item.title };
}

async function handleFillCurrentTab(itemId, tabId, username) {
  const res = await apiFetch(`/api/vault/items/${itemId}/reveal/`, { method: "POST" });
  if (!res.ok) return { ok: false, error: `Could not reveal password (${res.status})` };
  const { password } = await res.json();
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "TAD_VAULT_FILL_CREDENTIALS",
      username,
      password,
      submit: true,
    });
  } catch (e) {
    return { ok: false, error: "Could not reach the page. Try reloading it and retry." };
  }
  return { ok: true };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case "TAD_VAULT_LOGIN":
        sendResponse(await handleLogin(message.username, message.password));
        break;
      case "TAD_VAULT_LOGOUT":
        sendResponse(await handleLogout());
        break;
      case "TAD_VAULT_AUTH_STATUS":
        sendResponse(await handleAuthStatus());
        break;
      case "TAD_VAULT_GET_MATCHES":
        sendResponse(await handleGetMatches(message.domain));
        break;
      case "TAD_VAULT_AUTO_CHECK":
        sendResponse(await handleAutoCheck(message.domain));
        break;
      case "TAD_VAULT_FILL":
        sendResponse(await handleFillCurrentTab(message.itemId, message.tabId, message.username));
        break;
      default:
        sendResponse({ ok: false, error: "Unknown message type" });
    }
  })();
  return true; // keep the message channel open for the async response
});
