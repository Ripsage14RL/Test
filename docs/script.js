const form = document.getElementById("auth-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const revealBtn = document.getElementById("reveal-btn");
const message = document.getElementById("message");
const continueLink = document.getElementById("continue-link");

const REQUIRED_PASSWORD = "Detonge";

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

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username) {
    setMessage("error", "Enter your account name.");
    usernameInput.focus();
    return;
  }

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

  setMessage("success", `Access granted. Welcome, ${username}.`);

  if (document.getElementById("remember").checked) {
    localStorage.setItem("detonge_user", username);
  } else {
    localStorage.removeItem("detonge_user");
  }

  continueLink.classList.remove("hidden");
});

const rememberedUser = localStorage.getItem("detonge_user");
if (rememberedUser) {
  usernameInput.value = rememberedUser;
  document.getElementById("remember").checked = true;
}
