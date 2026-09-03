const loginView = document.getElementById("login-view");
const matchesView = document.getElementById("matches-view");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const loginSubmit = document.getElementById("login-submit");
const accountName = document.getElementById("account-name");
const logoutBtn = document.getElementById("logout-btn");
const domainLabel = document.getElementById("domain-label");
const matchesList = document.getElementById("matches-list");
const statusEl = document.getElementById("status");

function send(message) {
  return chrome.runtime.sendMessage(message);
}

function showStatus(text, isError) {
  statusEl.hidden = false;
  statusEl.textContent = text;
  statusEl.className = `status ${isError ? "err" : "ok"}`;
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (e) {
    return "";
  }
}

async function renderMatches() {
  const tab = await getCurrentTab();
  const domain = hostnameOf(tab?.url || "");
  domainLabel.textContent = domain ? `Site: ${domain}` : "No matching site detected.";

  if (!domain) {
    matchesList.innerHTML = '<div class="empty-state">Open the website you want to log into, then reopen this popup.</div>';
    return;
  }

  const result = await send({ type: "TAD_VAULT_GET_MATCHES", domain });
  if (!result.ok) {
    matchesList.innerHTML = `<div class="empty-state">${result.error}</div>`;
    return;
  }

  if (result.items.length === 0) {
    matchesList.innerHTML = '<div class="empty-state">No saved credentials for this site yet.</div>';
    return;
  }

  matchesList.innerHTML = "";
  result.items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "match-card";
    row.innerHTML = `
      <div class="match-info">
        <div class="match-title">${item.title}</div>
        <div class="match-username">${item.username || "no username"}</div>
      </div>
      <button class="fill-btn">Fill &amp; Log in</button>
    `;
    const btn = row.querySelector(".fill-btn");
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "Filling…";
      const fillResult = await send({
        type: "TAD_VAULT_FILL",
        itemId: item.id,
        tabId: tab.id,
        username: item.username,
      });
      if (fillResult.ok) {
        showStatus("Filled! Logging in…", false);
        window.close();
      } else {
        showStatus(fillResult.error || "Failed to fill credentials.", true);
        btn.disabled = false;
        btn.textContent = "Fill & Log in";
      }
    });
    matchesList.appendChild(row);
  });
}

async function showMatchesView(username) {
  loginView.hidden = true;
  matchesView.hidden = false;
  accountName.textContent = username ? `Logged in as ${username}` : "";
  await renderMatches();
}

async function init() {
  const status = await send({ type: "TAD_VAULT_AUTH_STATUS" });
  if (status.loggedIn) {
    await showMatchesView(status.username);
  } else {
    loginView.hidden = false;
    matchesView.hidden = true;
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  loginSubmit.disabled = true;
  loginSubmit.textContent = "Logging in…";

  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const result = await send({ type: "TAD_VAULT_LOGIN", username, password });

  loginSubmit.disabled = false;
  loginSubmit.textContent = "Log in";

  if (!result.ok) {
    loginError.hidden = false;
    loginError.textContent = result.error;
    return;
  }
  const status = await send({ type: "TAD_VAULT_AUTH_STATUS" });
  await showMatchesView(status.username);
});

logoutBtn.addEventListener("click", async () => {
  await send({ type: "TAD_VAULT_LOGOUT" });
  loginView.hidden = false;
  matchesView.hidden = true;
});

init();
