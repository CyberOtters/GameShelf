type PlaySession = {
  id: number;
  gameId: number;
  userId: string;
  hours: number;
  sessionDate: string;
  notes: string | null;
};

type SessionSummary = {
  totalHours: number;
  sessions: PlaySession[];
};

declare global {
  interface Window {
    GAME_LOG: { gameId: number };
  }
}

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required element not found: ${selector}`);
  return element;
}

const logMessage = getRequiredElement<HTMLElement>("#log-message");
const sessionLog = getRequiredElement<HTMLElement>("#session-log");
const totalHoursEl = getRequiredElement<HTMLElement>("#total-hours");
const openSessionFormButton =
  getRequiredElement<HTMLButtonElement>("#open-session-form");
const signOutButton = getRequiredElement<HTMLButtonElement>("#sign-out");
const sessionFormDialog =
  getRequiredElement<HTMLDialogElement>("#session-form-dialog");
const sessionForm = getRequiredElement<HTMLFormElement>("#session-form");
const cancelSessionFormButton =
  getRequiredElement<HTMLButtonElement>("#cancel-session-form");
const closeSessionFormButton =
  getRequiredElement<HTMLButtonElement>("#close-session-form");
const sessionDateField = getRequiredElement<HTMLInputElement>("#session-date");

function parseGameIdFromPath(): number {
  const match = /^\/shelf\/games\/(\d+)\/log\/?$/.exec(window.location.pathname);
  if (!match) throw new Error("Invalid play log URL");
  return Number(match[1]);
}

const gameId = parseGameIdFromPath();

function formatHours(totalHours: number): string {
  if (totalHours === 0) return "0 hrs";
  const formatted = Number.isInteger(totalHours)
    ? String(totalHours)
    : totalHours.toFixed(1);
  return `${formatted} hr${totalHours === 1 ? "" : "s"}`;
}

function todayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function openSessionForm(): void {
  sessionForm.reset();
  sessionDateField.value = todayDateInputValue();
  sessionFormDialog.showModal();
}

function closeSessionForm(): void {
  sessionFormDialog.close();
}

function renderSessions(summary: SessionSummary): void {
  totalHoursEl.textContent = formatHours(summary.totalHours);
  sessionLog.replaceChildren();

  if (summary.sessions.length === 0) {
    logMessage.textContent = "No sessions logged yet. Log your first session above.";
    logMessage.hidden = false;
    sessionLog.hidden = true;
    return;
  }

  logMessage.hidden = true;
  sessionLog.hidden = false;

  for (const session of summary.sessions) {
    const entry = document.createElement("article");
    entry.className = "session-entry";

    const head = document.createElement("div");
    head.className = "session-entry-head";

    const date = document.createElement("h3");
    date.className = "session-entry-date";
    date.textContent = session.sessionDate;

    const hours = document.createElement("span");
    hours.className = "session-entry-hours";
    hours.textContent = formatHours(session.hours);

    head.append(date, hours);
    entry.append(head);

    if (session.notes) {
      const notes = document.createElement("p");
      notes.className = "session-entry-notes";
      notes.textContent = session.notes;
      entry.append(notes);
    }

    sessionLog.append(entry);
  }
}

async function loadSessions(): Promise<void> {
  const response = await fetch(`/api/games/${gameId}/sessions`);
  if (!response.ok) {
    throw new Error(`Failed to load sessions: ${response.status}`);
  }

  const summary: SessionSummary = await response.json();
  renderSessions(summary);
}

async function handleSessionSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();

  const formData = new FormData(sessionForm);
  const notesValue = formData.get("notes");

  const sessionInput = {
    hours: Number(formData.get("hours")),
    sessionDate: String(formData.get("sessionDate")),
    notes: notesValue ? String(notesValue) : null,
  };

  const response = await fetch(`/api/games/${gameId}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sessionInput),
  });

  if (!response.ok) {
    throw new Error(`Failed to log session: ${response.status}`);
  }

  closeSessionForm();
  await loadSessions();
}

function handleError(error: unknown): void {
  console.error(error);
  logMessage.textContent = "Could not load the play log.";
  logMessage.hidden = false;
  sessionLog.hidden = true;
}

async function handleSignOut(): Promise<void> {
  await fetch("/api/auth/sign-out", { method: "POST" });
  location.href = "/";
}

openSessionFormButton.addEventListener("click", openSessionForm);
cancelSessionFormButton.addEventListener("click", closeSessionForm);
closeSessionFormButton.addEventListener("click", closeSessionForm);
sessionForm.addEventListener("submit", (event) => {
  void handleSessionSubmit(event).catch(handleError);
});
signOutButton.addEventListener("click", handleSignOut);

sessionFormDialog.addEventListener("click", (event) => {
  if (event.target === sessionFormDialog) closeSessionForm();
});

loadSessions().catch(handleError);

export {};
