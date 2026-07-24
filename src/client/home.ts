import "./shared.scss";
import "./home.scss";

type Session = {
  user?: { name: string; email: string };
};

const stage = document.getElementById("stage")!;
const title = document.getElementById("card-title")!;
const body = document.getElementById("card-body")!;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function stat(label: string, value: string) {
  const box = el("div", "stat");
  box.append(el("span", "label", label), el("span", "value", value));
  return box;
}

async function render() {
  const res = await fetch("/api/me");
  const session: Session | null = res.ok ? await res.json() : null;

  if (session?.user) {
    const { name, email } = session.user;
    title.textContent = "Player Card";

    const badge = el("div", "badge");
    const avatar = el("div", "avatar", (name || "?").trim().charAt(0).toUpperCase());
    const who = el("div", "who");
    who.append(el("span", "label", "Now playing"), el("span", "name", name));
    badge.append(avatar, who);

    const signOut = el("button", "btn", "Sign Out");
    signOut.addEventListener("click", async () => {
      await fetch("/api/auth/sign-out", { method: "POST" });
      location.reload();
    });

    body.append(badge, stat("Email", email), signOut);
  } else {
    title.textContent = "No Player Found";
    const signIn = el("a", "btn", "Insert Coin");
    signIn.href = "/login";
    const register = el("a", "btn ghost", "New Game");
    register.href = "/register";
    body.append(signIn, register);
  }
  stage.classList.add("ready");
}

render();
