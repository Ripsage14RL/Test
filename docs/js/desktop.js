const ACCESS_KEY = "deton_access";

if (sessionStorage.getItem(ACCESS_KEY) !== "granted") {
  window.location.replace("index.html");
} else {
  sessionStorage.removeItem(ACCESS_KEY);
}
