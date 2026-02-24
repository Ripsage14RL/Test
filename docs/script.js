const form = document.getElementById("auth-form");
const title = document.getElementById("form-title");
const toggle = document.getElementById("toggle-form");
const submitBtn = document.getElementById("submit-btn");
const message = document.getElementById("message");

let isLogin = true;

toggle.addEventListener("click", () => {
  isLogin = !isLogin;

  if (isLogin) {
    title.textContent = "Login";
    submitBtn.textContent = "Login";
    toggle.textContent = "Create one";
    document.querySelector(".toggle-text").innerHTML =
      `Don't have an account? <span id="toggle-form">Create one</span>`;
  } else {
    title.textContent = "Create Account";
    submitBtn.textContent = "Create Account";
    document.querySelector(".toggle-text").innerHTML =
      `Already have an account? <span id="toggle-form">Login</span>`;
  }

  message.textContent = "";
  document.getElementById("toggle-form").addEventListener("click", () => {
    toggle.click();
  });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    message.style.color = "red";
    message.textContent = "Please fill in all fields.";
    return;
  }

  const storedUser = JSON.parse(localStorage.getItem("user"));

  if (isLogin) {
    if (
      storedUser &&
      storedUser.username === username &&
      storedUser.password === password
    ) {
      message.style.color = "lightgreen";
      message.textContent = "Login successful!";
    } else {
      message.style.color = "red";
      message.textContent = "Invalid username or password.";
    }
  } else {
    localStorage.setItem(
      "user",
      JSON.stringify({ username, password })
    );
    message.style.color = "lightgreen";
    message.textContent = "Account created! You can now login.";
  }
});
