import { ApiError, apiError } from "./lib/api.ts";
import { dateInputValue, formatHours } from "./lib/format.ts";

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

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required element not found: ${selector}`);
  return element;
}

const logMessage = getRequiredElement<HTMLElement>("#log-message");
const sessionLog = getRequiredElement<HTMLElement>("#session-log");
const totalHoursEl = getRequiredElement<HTMLElement>("#total-hours");
// Absent for a wishlisted game — the API refuses play time on one, so the view
// does not render the button.
const openSessionFormButton = document.querySelector<HTMLButtonElement>(
  "#open-session-form",
);
const signOutButton = getRequiredElement<HTMLButtonElement>("#sign-out");
const sessionFormDialog =
  getRequiredElement<HTMLDialogElement>("#session-form-dialog");
const sessionForm = getRequiredElement<HTMLFormElement>("#session-form");
const cancelSessionFormButton =
  getRequiredElement<HTMLButtonElement>("#cancel-session-form");
const closeSessionFormButton =
  getRequiredElement<HTMLButtonElement>("#close-session-form");
const sessionDateField = getRequiredElement<HTMLInputElement>("#session-date");
const sessionHoursField =
  getRequiredElement<HTMLInputElement>("#session-hours");
const sessionNotesField =
  getRequiredElement<HTMLTextAreaElement>("#session-notes");
const sessionFormTitle = getRequiredElement<HTMLElement>("#session-form-title");
const saveSessionButton =
  getRequiredElement<HTMLButtonElement>("#save-session-button");

function parseGameIdFromPath(): number {
  const match = /^\/shelf\/games\/(\d+)\/log\/?$/.exec(window.location.pathname);
  if (!match) throw new Error("Invalid play log URL");
  return Number(match[1]);
}

const gameId = parseGameIdFromPath();

/** The session being edited, or null when the dialog is logging a new one. */
let editingSessionId: number | null = null;

function openSessionForm(): void {
  editingSessionId = null;
  sessionForm.reset();
  sessionFormTitle.textContent = "Log Session";
  saveSessionButton.textContent = "Log Session";
  sessionDateField.value = dateInputValue();
  sessionFormDialog.showModal();
}

/** Same dialog, pre-filled with the session's stored hours, date, and notes. */
function openEditSessionForm(session: PlaySession): void {
  editingSessionId = session.id;
  sessionForm.reset();
  sessionFormTitle.textContent = "Edit Session";
  saveSessionButton.textContent = "Save Changes";
  sessionHoursField.value = String(session.hours);
  sessionDateField.value = session.sessionDate;
  sessionNotesField.value = session.notes ?? "";
  sessionFormDialog.showModal();
}

function closeSessionForm(): void {
  sessionFormDialog.close();
}

function renderSessions(summary: SessionSummary): void {
  totalHoursEl.textContent = formatHours(summary.totalHours);
  sessionLog.replaceChildren();

  if (summary.sessions.length === 0) {
    logMessage.textContent = openSessionFormButton
      ? "No sessions logged yet. Log your first session above."
      : "This game is on your wishlist, so there is no play time to show yet.";
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

    entry.append(createSessionActions(session));
    sessionLog.append(entry);
  }
}

function createSessionActions(session: PlaySession): HTMLElement {
  const actions = document.createElement("div");
  actions.className = "session-entry-actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "session-edit-button";
  editButton.textContent = "Edit";
  editButton.setAttribute(
    "aria-label",
    `Edit the session on ${session.sessionDate}`,
  );
  editButton.addEventListener("click", () => openEditSessionForm(session));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "session-delete-button";
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute(
    "aria-label",
    `Delete the session on ${session.sessionDate}`,
  );
  deleteButton.addEventListener("click", () => {
    void deleteSession(session).catch(handleError);
  });

  actions.append(editButton, deleteButton);
  return actions;
}

async function deleteSession(session: PlaySession): Promise<void> {
  const confirmed = confirm(
    `Delete the ${formatHours(session.hours)} session on ${session.sessionDate}?`,
  );
  if (!confirmed) return;

  const response = await fetch(
    `/api/games/${gameId}/sessions/${session.id}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    throw await apiError(response, "Could not delete that session.");
  }

  await loadSessions();
}

async function loadSessions(): Promise<void> {
  const response = await fetch(`/api/games/${gameId}/sessions`);
  if (!response.ok) {
    throw await apiError(response, "Could not load the play log.");
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

  const editing = editingSessionId !== null;

  const response = await fetch(
    editing
      ? `/api/games/${gameId}/sessions/${editingSessionId}`
      : `/api/games/${gameId}/sessions`,
    {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionInput),
    },
  );

  if (!response.ok) {
    throw await apiError(
      response,
      editing
        ? "Could not save changes to that session."
        : "Could not log that session.",
    );
  }

  closeSessionForm();
  await loadSessions();
}

function handleError(error: unknown): void {
  console.error(error);
  logMessage.textContent =
    error instanceof ApiError ? error.message : "Could not load the play log.";
  logMessage.hidden = false;
}

async function handleSignOut(): Promise<void> {
  await fetch("/api/auth/sign-out", { method: "POST" });
  location.href = "/";
}

openSessionFormButton?.addEventListener("click", openSessionForm);
cancelSessionFormButton.addEventListener("click", closeSessionForm);
closeSessionFormButton.addEventListener("click", closeSessionForm);
sessionFormDialog.addEventListener("close", () => {
  sessionForm.reset();
  editingSessionId = null;
});
sessionForm.addEventListener("submit", (event) => {
  void handleSessionSubmit(event).catch(handleError);
});
signOutButton.addEventListener("click", handleSignOut);

sessionFormDialog.addEventListener("click", (event) => {
  if (event.target === sessionFormDialog) closeSessionForm();
});

loadSessions().catch(handleError);

export {};
