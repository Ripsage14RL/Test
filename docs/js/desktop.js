const ACCESS_KEY = "deton_access";

if (sessionStorage.getItem(ACCESS_KEY) !== "granted") {
  window.location.replace("index.html");
} else {
  sessionStorage.removeItem(ACCESS_KEY);
}

const startBtn = document.getElementById("start-btn");
const startMenu = document.getElementById("start-menu");
const timeEl = document.getElementById("taskbar-time");
const dateEl = document.getElementById("taskbar-date");

const openDexBrowserBtn = document.getElementById("open-dex-browser");
const openDexAppBtn = document.getElementById("open-dex-app");
const taskbarDexBrowser = document.getElementById("taskbar-dex-browser");
const taskbarDexApp = document.getElementById("taskbar-dex-app");

const dexBrowserWindow = document.getElementById("dex-browser-window");
const dexBrowserTabs = document.getElementById("dex-browser-tabs");
const dexBrowserNewTab = document.getElementById("dex-browser-new-tab");
const dexBrowserForm = document.getElementById("dex-browser-form");
const dexBrowserAddress = document.getElementById("dex-browser-address");
const dexBrowserFrame = document.getElementById("dex-browser-frame");
const dexBrowserMeta = document.getElementById("dex-browser-meta");
const dexBrowserFallback = document.getElementById("dex-browser-fallback");
const dexBrowserOpenTab = document.getElementById("dex-browser-open-tab");
const dexBrowserBack = document.getElementById("dex-browser-back");
const dexBrowserForward = document.getElementById("dex-browser-forward");
const dexBrowserReload = document.getElementById("dex-browser-reload");
const dexBrowserHome = document.getElementById("dex-browser-home");
const dexBrowserMin = document.getElementById("dex-browser-min");
const dexBrowserMax = document.getElementById("dex-browser-max");
const dexBrowserClose = document.getElementById("dex-browser-close");

const dexAppWindow = document.getElementById("dex-app-window");
const dexAppMin = document.getElementById("dex-app-min");
const dexAppMax = document.getElementById("dex-app-max");
const dexAppClose = document.getElementById("dex-app-close");

const DOUBLE_D_WINDOW_MS = 420;
const DEX_BROWSER_HOME_URL = "https://example.com";
let lastDPressAt = 0;
let fallbackTimer = null;
let topWindowZ = 30;

const dexBrowserState = { open: false, visible: false };
const dexAppState = { open: false, visible: false };

let tabCounter = 0;
let activeTabId = "";
const browserTabs = [];

function updateClock() {
  const now = new Date();
  timeEl.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  dateEl.textContent = now.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function setStartMenuState(isOpen) {
  startMenu.classList.toggle("hidden", !isOpen);
  startBtn.classList.toggle("is-open", isOpen);
  startBtn.setAttribute("aria-expanded", String(isOpen));
}

function isTypingContext(target) {
  if (!target) {
    return false;
  }
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

function normalizeAddress(input) {
  const value = input.trim();
  if (!value) {
    return { url: DEX_BROWSER_HOME_URL, error: "" };
  }

  if (/^https?:\/\//i.test(value)) {
    return { url: value, error: "" };
  }

  if (value.includes(".") && !value.includes(" ")) {
    return { url: `https://${value}`, error: "" };
  }

  return {
    url: "",
    error: "DEX Browser only supports direct URLs right now. Example: https://example.com"
  };
}

function setDexBrowserMeta(text) {
  dexBrowserMeta.textContent = text;
}

function setDexBrowserFallbackVisible(isVisible) {
  dexBrowserFallback.classList.toggle("hidden", !isVisible);
}

function syncDexBrowserWindowState() {
  dexBrowserWindow.classList.toggle("hidden", !dexBrowserState.visible);
  taskbarDexBrowser.classList.toggle("hidden", !dexBrowserState.open);
  taskbarDexBrowser.classList.toggle("active", dexBrowserState.open && dexBrowserState.visible);
}

function syncDexAppWindowState() {
  dexAppWindow.classList.toggle("hidden", !dexAppState.visible);
  taskbarDexApp.classList.toggle("hidden", !dexAppState.open);
  taskbarDexApp.classList.toggle("active", dexAppState.open && dexAppState.visible);
}

function bringWindowToFront(windowEl) {
  if (!windowEl || windowEl.classList.contains("hidden")) {
    return;
  }
  topWindowZ += 1;
  windowEl.style.zIndex = String(topWindowZ);
}

function clearFallbackTimer() {
  if (fallbackTimer) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }
}

function getActiveBrowserTab() {
  return browserTabs.find((tab) => tab.id === activeTabId) || null;
}

function updateDexBrowserNavState() {
  const tab = getActiveBrowserTab();
  if (!tab) {
    dexBrowserBack.disabled = true;
    dexBrowserForward.disabled = true;
    return;
  }
  dexBrowserBack.disabled = tab.historyIndex <= 0;
  dexBrowserForward.disabled = tab.historyIndex >= tab.history.length - 1;
}

function browserTabLabelFromUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname || "New Tab";
  } catch {
    return "New Tab";
  }
}

function renderBrowserTabs() {
  dexBrowserTabs.innerHTML = "";

  browserTabs.forEach((tab) => {
    const tabEl = document.createElement("div");
    tabEl.className = `dex-tab${tab.id === activeTabId ? " active" : ""}`;
    tabEl.setAttribute("role", "button");
    tabEl.setAttribute("tabindex", "0");

    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = tab.title;
    tabEl.appendChild(title);

    const close = document.createElement("button");
    close.type = "button";
    close.className = "tab-close";
    close.textContent = "x";
    close.setAttribute("aria-label", "Close tab");
    close.addEventListener("click", (event) => {
      event.stopPropagation();
      closeBrowserTab(tab.id);
    });
    tabEl.appendChild(close);

    tabEl.addEventListener("click", () => activateBrowserTab(tab.id));
    tabEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activateBrowserTab(tab.id);
      }
    });

    dexBrowserTabs.appendChild(tabEl);
  });
}

function showActiveBrowserTab() {
  const tab = getActiveBrowserTab();
  clearFallbackTimer();
  setDexBrowserFallbackVisible(false);

  if (!tab || !tab.currentUrl) {
    dexBrowserAddress.value = "";
    dexBrowserFrame.removeAttribute("src");
    setDexBrowserMeta("New tab ready. Enter a full URL.");
    updateDexBrowserNavState();
    return;
  }

  dexBrowserAddress.value = tab.currentUrl;
  dexBrowserFrame.src = tab.currentUrl;
  dexBrowserOpenTab.href = tab.currentUrl;
  setDexBrowserMeta(`Loading ${tab.currentUrl}`);

  fallbackTimer = setTimeout(() => {
    setDexBrowserFallbackVisible(true);
    setDexBrowserMeta("This page is not supported in DEX Browser (embedding blocked).");
  }, 2600);

  updateDexBrowserNavState();
}

function applyUrlToBrowserTab(tab, url, addToHistory) {
  if (addToHistory) {
    tab.history.splice(tab.historyIndex + 1);
    tab.history.push(url);
    tab.historyIndex = tab.history.length - 1;
  }

  tab.currentUrl = url;
  tab.title = browserTabLabelFromUrl(url);
  renderBrowserTabs();
  if (tab.id === activeTabId) {
    showActiveBrowserTab();
  }
}

function createBrowserTab(initialUrl = "", activate = true) {
  const tab = {
    id: `dex-browser-tab-${++tabCounter}`,
    title: initialUrl ? browserTabLabelFromUrl(initialUrl) : "New Tab",
    currentUrl: "",
    history: [],
    historyIndex: -1
  };

  browserTabs.push(tab);
  if (activate) {
    activeTabId = tab.id;
  }

  if (initialUrl) {
    applyUrlToBrowserTab(tab, initialUrl, true);
  }

  renderBrowserTabs();
  if (activate) {
    showActiveBrowserTab();
  }

  return tab;
}

function activateBrowserTab(tabId) {
  activeTabId = tabId;
  renderBrowserTabs();
  showActiveBrowserTab();
}

function closeBrowserTab(tabId) {
  const idx = browserTabs.findIndex((tab) => tab.id === tabId);
  if (idx === -1) {
    return;
  }

  const wasActive = browserTabs[idx].id === activeTabId;
  browserTabs.splice(idx, 1);

  if (browserTabs.length === 0) {
    createBrowserTab("", true);
    return;
  }

  if (wasActive) {
    const nextIndex = Math.max(0, idx - 1);
    activeTabId = browserTabs[nextIndex].id;
  }

  renderBrowserTabs();
  showActiveBrowserTab();
}

function resetDexBrowserSession() {
  clearFallbackTimer();
  browserTabs.length = 0;
  tabCounter = 0;
  activeTabId = "";
  dexBrowserAddress.value = "";
  dexBrowserFrame.removeAttribute("src");
  dexBrowserOpenTab.href = "#";
  setDexBrowserMeta("DEX Browser supports URL navigation. Search queries are disabled in this version.");
  setDexBrowserFallbackVisible(false);
  dexBrowserWindow.classList.remove("maximized");
  renderBrowserTabs();
  updateDexBrowserNavState();
}

function ensureDexBrowserStarted() {
  if (!dexBrowserState.open) {
    dexBrowserState.open = true;
    dexBrowserState.visible = true;
    syncDexBrowserWindowState();
    if (browserTabs.length === 0) {
      createBrowserTab("", true);
    }
  }
}

function openDexBrowser() {
  ensureDexBrowserStarted();
  dexBrowserState.visible = true;
  syncDexBrowserWindowState();
  bringWindowToFront(dexBrowserWindow);
  setStartMenuState(false);
}

function openUrlInDexBrowserNewTab(url) {
  ensureDexBrowserStarted();
  createBrowserTab(url, true);
  dexBrowserState.visible = true;
  syncDexBrowserWindowState();
  bringWindowToFront(dexBrowserWindow);
  setStartMenuState(false);
}

function ensureDexAppStarted() {
  if (!dexAppState.open) {
    dexAppState.open = true;
    dexAppState.visible = true;
    syncDexAppWindowState();
  }
}

function openDexApp() {
  ensureDexAppStarted();
  dexAppState.visible = true;
  syncDexAppWindowState();
  bringWindowToFront(dexAppWindow);
  setStartMenuState(false);
}

function resolveDexNavigableUrl(anchor, baseUrl) {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return "";
  }

  try {
    const resolved = new URL(href, baseUrl);
    if (!/^https?:$/i.test(resolved.protocol)) {
      return "";
    }
    return resolved.href;
  } catch {
    return "";
  }
}

function bindFrameLinkInterception() {
  try {
    const frameDoc = dexBrowserFrame.contentDocument;
    if (!frameDoc) {
      return;
    }
    const frameWin = dexBrowserFrame.contentWindow;

    if (frameWin && !frameWin.__dexBrowserOpenPatched) {
      const originalOpen = frameWin.open ? frameWin.open.bind(frameWin) : null;
      frameWin.open = (url, target) => {
        const resolved = resolveDexNavigableUrl(
          { getAttribute: () => (typeof url === "string" ? url : "") },
          frameWin.location.href
        );
        if (resolved) {
          openUrlInDexBrowserNewTab(resolved);
          return null;
        }
        if (originalOpen) {
          return originalOpen(url, target);
        }
        return null;
      };
      frameWin.__dexBrowserOpenPatched = true;
    }

    const bindAnchor = (anchor) => {
      if (!anchor || anchor.dataset.dexBound === "1") {
        return;
      }
      anchor.dataset.dexBound = "1";
      anchor.setAttribute("target", "_self");
      anchor.addEventListener("click", (event) => {
        const resolved = resolveDexNavigableUrl(anchor, dexBrowserFrame.contentWindow.location.href);
        if (!resolved) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        openUrlInDexBrowserNewTab(resolved);
      }, true);
    };

    frameDoc.querySelectorAll("a[href]").forEach(bindAnchor);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) {
            return;
          }
          if (node.matches && node.matches("a[href]")) {
            bindAnchor(node);
          }
          if (node.querySelectorAll) {
            node.querySelectorAll("a[href]").forEach(bindAnchor);
          }
        });
      });
    });
    observer.observe(frameDoc.documentElement, { childList: true, subtree: true });

    frameDoc.addEventListener("click", (event) => {
      const anchor = event.target.closest("a[href]");
      if (!anchor) {
        return;
      }

      const resolved = resolveDexNavigableUrl(anchor, dexBrowserFrame.contentWindow.location.href);
      if (!resolved) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      openUrlInDexBrowserNewTab(resolved);
    }, true);
  } catch {
    // Cross-origin frames are not script-accessible.
  }
}

const originalWindowOpen = window.open ? window.open.bind(window) : null;
window.open = (url, target) => {
  const resolved = resolveDexNavigableUrl(
    { getAttribute: () => (typeof url === "string" ? url : "") },
    window.location.href
  );
  if (resolved) {
    openUrlInDexBrowserNewTab(resolved);
    return null;
  }
  if (originalWindowOpen) {
    return originalWindowOpen(url, target);
  }
  return null;
};

startBtn.addEventListener("click", () => {
  const isOpen = startMenu.classList.contains("hidden");
  setStartMenuState(isOpen);
});

document.addEventListener("click", (event) => {
  if (!startMenu.classList.contains("hidden") &&
      !startMenu.contains(event.target) &&
      !startBtn.contains(event.target)) {
    setStartMenuState(false);
  }

  const anchor = event.target.closest("a[href]");
  if (!anchor) {
    return;
  }

  if (anchor.id === "dex-browser-open-tab") {
    event.preventDefault();
    const tab = getActiveBrowserTab();
    if (tab && tab.currentUrl) {
      openUrlInDexBrowserNewTab(tab.currentUrl);
    }
    return;
  }

  const navigableUrl = resolveDexNavigableUrl(anchor, window.location.href);
  if (navigableUrl) {
    event.preventDefault();
    event.stopPropagation();
    openUrlInDexBrowserNewTab(navigableUrl);
  }
}, true);

document.addEventListener("keydown", (event) => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return;
  }

  if (isTypingContext(event.target)) {
    return;
  }

  if (event.key.toLowerCase() !== "d") {
    return;
  }

  const now = Date.now();
  const timeSinceLastD = now - lastDPressAt;

  if (timeSinceLastD > 0 && timeSinceLastD <= DOUBLE_D_WINDOW_MS) {
    const shouldOpen = startMenu.classList.contains("hidden");
    setStartMenuState(shouldOpen);
    lastDPressAt = 0;
    return;
  }

  lastDPressAt = now;
});

openDexBrowserBtn.addEventListener("click", openDexBrowser);
openDexAppBtn.addEventListener("click", openDexApp);

taskbarDexBrowser.addEventListener("click", () => {
  if (!dexBrowserState.open) {
    openDexBrowser();
    return;
  }
  dexBrowserState.visible = true;
  syncDexBrowserWindowState();
  bringWindowToFront(dexBrowserWindow);
});

taskbarDexApp.addEventListener("click", () => {
  if (!dexAppState.open) {
    openDexApp();
    return;
  }
  dexAppState.visible = true;
  syncDexAppWindowState();
  bringWindowToFront(dexAppWindow);
});

dexBrowserNewTab.addEventListener("click", () => {
  ensureDexBrowserStarted();
  createBrowserTab("", true);
  dexBrowserState.visible = true;
  syncDexBrowserWindowState();
});

dexBrowserForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const tab = getActiveBrowserTab();
  if (!tab) {
    return;
  }

  const parsed = normalizeAddress(dexBrowserAddress.value);
  if (!parsed.url) {
    setDexBrowserMeta(parsed.error);
    return;
  }
  applyUrlToBrowserTab(tab, parsed.url, true);
});

dexBrowserBack.addEventListener("click", () => {
  const tab = getActiveBrowserTab();
  if (!tab || tab.historyIndex <= 0) {
    return;
  }
  tab.historyIndex -= 1;
  tab.currentUrl = tab.history[tab.historyIndex];
  tab.title = browserTabLabelFromUrl(tab.currentUrl);
  renderBrowserTabs();
  showActiveBrowserTab();
});

dexBrowserForward.addEventListener("click", () => {
  const tab = getActiveBrowserTab();
  if (!tab || tab.historyIndex >= tab.history.length - 1) {
    return;
  }
  tab.historyIndex += 1;
  tab.currentUrl = tab.history[tab.historyIndex];
  tab.title = browserTabLabelFromUrl(tab.currentUrl);
  renderBrowserTabs();
  showActiveBrowserTab();
});

dexBrowserReload.addEventListener("click", () => {
  const tab = getActiveBrowserTab();
  if (!tab || !tab.currentUrl) {
    return;
  }
  showActiveBrowserTab();
});

dexBrowserHome.addEventListener("click", () => {
  const tab = getActiveBrowserTab();
  if (!tab) {
    return;
  }
  applyUrlToBrowserTab(tab, DEX_BROWSER_HOME_URL, true);
});

dexBrowserMin.addEventListener("click", () => {
  dexBrowserState.visible = false;
  syncDexBrowserWindowState();
});

dexBrowserMax.addEventListener("click", () => {
  if (!dexBrowserState.open) {
    return;
  }
  dexBrowserWindow.classList.toggle("maximized");
  bringWindowToFront(dexBrowserWindow);
});

dexBrowserClose.addEventListener("click", () => {
  dexBrowserState.open = false;
  dexBrowserState.visible = false;
  syncDexBrowserWindowState();
  resetDexBrowserSession();
});

dexAppMin.addEventListener("click", () => {
  dexAppState.visible = false;
  syncDexAppWindowState();
});

dexAppMax.addEventListener("click", () => {
  if (!dexAppState.open) {
    return;
  }
  dexAppWindow.classList.toggle("maximized");
  bringWindowToFront(dexAppWindow);
});

dexAppClose.addEventListener("click", () => {
  dexAppState.open = false;
  dexAppState.visible = false;
  dexAppWindow.classList.remove("maximized");
  syncDexAppWindowState();
});

dexBrowserFrame.addEventListener("load", () => {
  clearFallbackTimer();
  const tab = getActiveBrowserTab();
  if (!tab) {
    return;
  }
  tab.title = browserTabLabelFromUrl(tab.currentUrl);
  renderBrowserTabs();
  setDexBrowserMeta(`Viewing ${tab.currentUrl}`);
  bindFrameLinkInterception();
});

dexBrowserWindow.addEventListener("mousedown", () => {
  bringWindowToFront(dexBrowserWindow);
});

dexAppWindow.addEventListener("mousedown", () => {
  bringWindowToFront(dexAppWindow);
});

function setupWindowDrag(windowEl) {
  const handle = windowEl.querySelector(".app-window-head");
  if (!handle) {
    return;
  }

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  handle.addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest(".window-actions")) {
      return;
    }

    if (windowEl.classList.contains("maximized")) {
      return;
    }

    const rect = windowEl.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    isDragging = true;
    windowEl.style.transform = "none";
    windowEl.style.left = `${rect.left}px`;
    windowEl.style.top = `${rect.top}px`;
    bringWindowToFront(windowEl);
    event.preventDefault();
  });

  document.addEventListener("mousemove", (event) => {
    if (!isDragging) {
      return;
    }

    const rect = windowEl.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - rect.width);
    const maxTop = Math.max(0, window.innerHeight - rect.height - 64);
    const left = Math.min(Math.max(0, event.clientX - offsetX), maxLeft);
    const top = Math.min(Math.max(0, event.clientY - offsetY), maxTop);

    windowEl.style.left = `${left}px`;
    windowEl.style.top = `${top}px`;
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

setupWindowDrag(dexBrowserWindow);
setupWindowDrag(dexAppWindow);

updateClock();
syncDexBrowserWindowState();
syncDexAppWindowState();
updateDexBrowserNavState();
bringWindowToFront(dexBrowserWindow);
bringWindowToFront(dexAppWindow);
setInterval(updateClock, 30000);
