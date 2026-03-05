const form = document.getElementById("auth-form");
const passwordInput = document.getElementById("password");
const revealBtn = document.getElementById("reveal-btn");
const message = document.getElementById("message");
const continueLink = document.getElementById("continue-link");

const REQUIRED_PASSWORD = "Detondev";
const ACCESS_KEY = "deton_access";

function setMessage(type, text) {
  message.classList.remove("error", "success");
  message.classList.add(type);
  message.textContent = text;
}

revealBtn.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  revealBtn.textContent = isHidden ? "Hide" : "Show";
  revealBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const password = passwordInput.value;

  if (!password) {
    setMessage("error", "Enter your password.");
    passwordInput.focus();
    return;
  }

  if (password !== REQUIRED_PASSWORD) {
    setMessage("error", "Access denied. Password does not match.");
    continueLink.classList.add("hidden");
    passwordInput.select();
    return;
  }

  setMessage("success", "Access granted. Welcome to Deton.");
  continueLink.classList.remove("hidden");
});

continueLink.addEventListener("click", (event) => {
  event.preventDefault();
  sessionStorage.setItem(ACCESS_KEY, "granted");
  window.location.href = "desktop.html";
});
