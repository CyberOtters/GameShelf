import "./shared.css";
import "./auth.css";

const tabLogin = document.getElementById("tab-login") as HTMLButtonElement;
const tabRegister = document.getElementById("tab-register") as HTMLButtonElement;
const formLogin = document.getElementById("form-login") as HTMLFormElement;
const formRegister = document.getElementById("form-register") as HTMLFormElement;

function input(id: string) {
  return (document.getElementById(id) as HTMLInputElement).value;
}

function showTab(which: "login" | "register") {
  const login = which === "login";
  tabLogin.classList.toggle("active", login);
  tabRegister.classList.toggle("active", !login);
  tabLogin.setAttribute("aria-selected", String(login));
  tabRegister.setAttribute("aria-selected", String(!login));
  formLogin.hidden = !login;
  formRegister.hidden = login;
  history.replaceState(null, "", login ? "/login" : "/register");
}

tabLogin.addEventListener("click", () => showTab("login"));
tabRegister.addEventListener("click", () => showTab("register"));
if (location.pathname === "/register") showTab("register");

async function submit(
  form: HTMLFormElement,
  url: string,
  body: Record<string, string>,
  okText: string,
) {
  const msg = form.querySelector(".msg")!;
  const button = form.querySelector(".submit") as HTMLButtonElement;
  msg.className = "msg";
  button.disabled = true;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Something went wrong. Try again.");
    }
    msg.textContent = okText;
    msg.classList.add("ok");
    setTimeout(() => (location.href = "/"), 600);
  } catch (err) {
    msg.textContent = (err as Error).message;
    msg.classList.add("error");
    button.disabled = false;
  }
}

formLogin.addEventListener("submit", (e) => {
  e.preventDefault();
  submit(
    formLogin,
    "/api/auth/sign-in/email",
    { email: input("li-email"), password: input("li-password") },
    "Welcome back! Loading save file…",
  );
});

formRegister.addEventListener("submit", (e) => {
  e.preventDefault();
  submit(
    formRegister,
    "/api/auth/sign-up/email",
    {
      name: input("re-name"),
      email: input("re-email"),
      password: input("re-password"),
    },
    "Account created! Starting new game…",
  );
});
