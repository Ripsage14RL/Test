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

startBtn.addEventListener("click", () => {
  const isOpen = startMenu.classList.contains("hidden");
  setStartMenuState(isOpen);
});

document.addEventListener("click", (event) => {
  if (startMenu.classList.contains("hidden")) {
    return;
  }

  if (!startMenu.contains(event.target) && !startBtn.contains(event.target)) {
    setStartMenuState(false);
  }
});

updateClock();
setInterval(updateClock, 30000);
