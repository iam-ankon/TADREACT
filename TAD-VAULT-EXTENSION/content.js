// content.js — injected into every page.
// Waits for a TAD_VAULT_FILL_CREDENTIALS message, finds the best-guess login
// form on the page, fills it, and (if requested) submits it.

function setNativeValue(element, value) {
  // Directly assigning element.value doesn't notify React/Vue/Angular's
  // change tracking, since they patch the setter on the prototype. Call the
  // native setter first, then dispatch the events the framework listens for.
  const proto = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
  if (descriptor && descriptor.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function isVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function findPasswordField() {
  const candidates = Array.from(document.querySelectorAll('input[type="password"]')).filter(isVisible);
  return candidates[0] || null;
}

function findUsernameField(passwordField) {
  const form = passwordField.closest("form");
  const scope = form || document;
  const selector = [
    'input[type="email"]',
    'input[type="text"]',
    'input[autocomplete="username"]',
    'input:not([type])',
  ].join(",");

  const candidates = Array.from(scope.querySelectorAll(selector)).filter(
    (el) => isVisible(el) && el !== passwordField
  );
  if (candidates.length === 0) return null;

  // Prefer the field that appears just before the password field in the DOM.
  const passwordIndex = candidates.findIndex(
    (el) => el.compareDocumentPosition(passwordField) & Node.DOCUMENT_POSITION_FOLLOWING
  );
  return candidates[passwordIndex] || candidates[0];
}

function findSubmitControl(passwordField) {
  const form = passwordField.closest("form");
  const scope = form || document;
  const selector = [
    'button[type="submit"]',
    'input[type="submit"]',
    "button",
    '[role="button"]',
  ].join(",");
  const candidates = Array.from(scope.querySelectorAll(selector)).filter(isVisible);
  const loginLike = candidates.find((el) =>
    /log ?in|sign ?in|submit|continue|next/i.test(el.innerText || el.value || "")
  );
  return loginLike || candidates[0] || null;
}

// Google (and other SSO providers) split login into two screens under one
// URL: an email-only step, then — after the user/script clicks Next — a
// password step rendered into the DOM afterwards. There is no password field
// to find until that happens.
function findEmailStepField() {
  const selector = [
    'input[type="email"]',
    'input[name="identifier"]',
    'input[autocomplete="username"]',
    'input[type="text"]',
  ].join(",");
  const candidates = Array.from(document.querySelectorAll(selector)).filter(isVisible);
  return candidates[0] || null;
}

function findNextControl(emailField) {
  const form = emailField.closest("form");
  const scope = form || document;
  const selector = ["button", '[role="button"]', 'input[type="submit"]'].join(",");
  const candidates = Array.from(scope.querySelectorAll(selector)).filter(isVisible);
  const nextLike = candidates.find((el) =>
    /next|continue|log ?in|sign ?in/i.test(el.innerText || el.value || "")
  );
  return nextLike || candidates[0] || null;
}

function submitPasswordField(passwordField) {
  // Give any framework's onChange handlers a tick to process, then submit by
  // clicking the actual button when one exists. Many sites (cPanel included)
  // attach a click handler to the submit button that injects a CSRF/security
  // token before letting the form go through; calling form.requestSubmit()
  // or form.submit() directly skips that handler entirely, so the request
  // arrives without the token the site expects.
  setTimeout(() => {
    const submitControl = findSubmitControl(passwordField);
    const form = passwordField.closest("form");
    if (submitControl) {
      submitControl.click();
    } else if (form && typeof form.requestSubmit === "function") {
      form.requestSubmit();
    } else if (form) {
      form.submit();
    }
  }, 200);
}

// Waits for a password field to appear after the email step is submitted
// (Google-style staged login renders it into the DOM rather than navigating).
function waitForPasswordField(password, submit, timeoutMs = 8000) {
  const existing = findPasswordField();
  if (existing) {
    setNativeValue(existing, password);
    if (submit) submitPasswordField(existing);
    return;
  }
  const observer = new MutationObserver(() => {
    const field = findPasswordField();
    if (!field) return;
    observer.disconnect();
    setNativeValue(field, password);
    if (submit) submitPasswordField(field);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), timeoutMs);
}

function fillAndSubmit(username, password, submit) {
  const passwordField = findPasswordField();
  if (passwordField) {
    const usernameField = findUsernameField(passwordField);
    if (usernameField) setNativeValue(usernameField, username);
    setNativeValue(passwordField, password);
    if (submit) submitPasswordField(passwordField);
    return { ok: true };
  }

  // No password field yet — try the staged-login path (email step first).
  const emailField = findEmailStepField();
  if (!emailField) {
    return { ok: false, error: "No login form found on this page." };
  }
  setNativeValue(emailField, username);
  if (submit) {
    setTimeout(() => {
      const nextControl = findNextControl(emailField);
      if (nextControl) nextControl.click();
      waitForPasswordField(password, true);
    }, 200);
  }
  return { ok: true, staged: true };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "TAD_VAULT_FILL_CREDENTIALS") return undefined;
  try {
    sendResponse(fillAndSubmit(message.username, message.password, message.submit));
  } catch (e) {
    sendResponse({ ok: false, error: String(e) });
  }
  return true;
});

// ─── Automatic login, no popup click required ────────────────────────────────
// On every page load, if this page has a visible login form and this user has
// exactly one saved credential for this domain, fill and submit automatically.

function showToast(text) {
  const toast = document.createElement("div");
  toast.textContent = text;
  toast.style.cssText = [
    "position:fixed", "bottom:20px", "right:20px", "z-index:2147483647",
    "background:#0f172a", "color:#fff", "padding:10px 16px", "border-radius:8px",
    "font:600 13px -apple-system,Segoe UI,Roboto,sans-serif",
    "box-shadow:0 4px 16px rgba(0,0,0,.25)", "opacity:0", "transition:opacity .2s",
  ].join(";");
  document.documentElement.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = "1"; });
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function tryAutoLogin() {
  // Nothing to fill yet — either a password field or a staged login's email
  // step (e.g. Google's identifier screen, where the password field only
  // renders after that step is submitted).
  if (!findPasswordField() && !findEmailStepField()) return;

  const hostname = location.hostname.replace(/^www\./i, "");
  const guardKey = `tad_vault_autofilled_${hostname}`;
  // Only attempt once per tab per domain per browsing session, so a failed
  // login (page reloads back to the login form) doesn't retry in a loop.
  if (sessionStorage.getItem(guardKey)) return;
  sessionStorage.setItem(guardKey, "1");

  let response;
  try {
    response = await chrome.runtime.sendMessage({ type: "TAD_VAULT_AUTO_CHECK", domain: hostname });
  } catch (e) {
    return; // extension context unavailable (e.g. it just reloaded)
  }
  if (!response || !response.ok) return;

  const result = fillAndSubmit(response.username, response.password, true);
  if (result.ok) showToast(`TAD Vault: signing in as ${response.username}…`);
}

tryAutoLogin();
// Some sites render their login form via JS after the initial load — give
// that a moment, then try once more (the guard above prevents a double-fire
// if the first attempt already succeeded).
setTimeout(tryAutoLogin, 1200);
