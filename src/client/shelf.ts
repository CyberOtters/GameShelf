type GameStatus = "WISHLIST" | "BACKLOG" | "PLAYING" | "COMPLETED" | "DROPPED";

type Priority = "HIGH" | "MEDIUM" | "LOW";

type Game = {
  id: number;
  userId: string;
  title: string;
  platform: string;
  priority: Priority | null;
  status: GameStatus;
  archived: boolean;
  rating: number | null;
  coverUrl: string | null;
  addedAt: string;
  notes: string | null;
};

const STATUS_LABELS: Record<GameStatus, string> = {
  WISHLIST: "Wishlist",
  BACKLOG: "Backlog",
  PLAYING: "Playing",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Required element not found: ${selector}`);
  }

  return element;
}

const gameGrid = getRequiredElement<HTMLElement>("#game-grid");
const shelfMessage = getRequiredElement<HTMLElement>("#shelf-message");
const addGameButton = getRequiredElement<HTMLButtonElement>("#open-add-form");
const signOutButton = getRequiredElement<HTMLButtonElement>("#sign-out");
const gameFormDialog =
  getRequiredElement<HTMLDialogElement>("#game-form-dialog");
const gameForm = getRequiredElement<HTMLFormElement>("#game-form");

const cancelGameFormButton =
  getRequiredElement<HTMLButtonElement>("#cancel-game-form");
const closeGameFormButton =
  getRequiredElement<HTMLButtonElement>("#close-game-form");
const gameFormTitle = getRequiredElement<HTMLElement>("#game-form-title");
const saveGameButton = getRequiredElement<HTMLButtonElement>("#save-game-button");

/** The game being edited, or null when the form is adding a new one. */
let editingGameId: number | null = null;

function field<T extends Element>(name: string): T {
  return getRequiredElement<T>(`#game-form [name="${name}"]`);
}

const titleField = field<HTMLInputElement>("title");
const platformField = field<HTMLSelectElement>("platform");
const statusField = field<HTMLSelectElement>("status");
const ratingField = field<HTMLInputElement>("rating");
const archivedField = field<HTMLInputElement>("archived");
const notesField = field<HTMLTextAreaElement>("notes");

function openGameForm(): void {
  editingGameId = null;
  gameForm.reset();
  gameFormTitle.textContent = "Add Game";
  saveGameButton.textContent = "Save Game";
  gameFormDialog.showModal();
}

function openEditGameForm(game: Game): void {
  editingGameId = game.id;
  gameForm.reset();
  gameFormTitle.textContent = "Edit Game";
  saveGameButton.textContent = "Save Changes";

  titleField.value = game.title;
  selectValue(platformField, game.platform);
  statusField.value = game.status;
  ratingField.value = game.rating === null ? "" : String(game.rating);
  archivedField.checked = game.archived;
  notesField.value = game.notes ?? "";

  for (const radio of gameForm.querySelectorAll<HTMLInputElement>(
    'input[name="priority"]',
  )) {
    radio.checked = radio.value === game.priority;
  }

  gameFormDialog.showModal();
}

/**
 * Platforms saved through the API aren't limited to the four in the dropdown,
 * so add a one-off option rather than silently blanking the field.
 */
function selectValue(select: HTMLSelectElement, value: string): void {
  const known = [...select.options].some((option) => option.value === value);
  if (!known) select.add(new Option(value, value));
  select.value = value;
}

function closeGameForm(): void {
  gameFormDialog.close();
}

// Load games from /api/games. `archived=all` because the shelf shows the whole
// collection — the endpoint hides archived rows otherwise, which would make a
// game vanish the moment it was archived from the edit form.
async function loadGames(): Promise<void> {
  const response = await fetch("/api/games?archived=all");

  if (!response.ok) {
    throw new Error(`Failed to load games: ${response.status}`);
  }
  const games: Game[] = await response.json();
  renderGames(games);
}

function renderGames(games: Game[]): void {
  gameGrid.replaceChildren();
  if (games.length === 0) {
    shelfMessage.textContent = "Your shelf is empty. Add a game to start.";
    shelfMessage.hidden = false;
    return;
  }
  shelfMessage.hidden = true;
  for (const game of games) {
    const card = createGameCard(game);
    gameGrid.append(card);
  }
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/** The cover art, or a striped cartridge label carrying the title's initial. */
function createGameCover(game: Game): HTMLElement {
  const cover = element("div", "game-cover");

  if (game.coverUrl) {
    const image = document.createElement("img");
    image.src = game.coverUrl;
    image.alt = "";
    image.loading = "lazy";
    cover.append(image);
  } else {
    cover.classList.add("empty");
    cover.append(
      element("span", "initial", game.title.trim().charAt(0).toUpperCase()),
    );
  }

  return cover;
}

function createStatusPill(status: GameStatus): HTMLElement {
  const pill = element("span", "status-pill", STATUS_LABELS[status] ?? status);
  pill.dataset.status = status;
  return pill;
}

function createPriorityPill(priority: Priority): HTMLElement {
  const pill = element("span", "priority-pill");
  pill.dataset.priority = priority;
  pill.append(
    element("span", "dot"),
    element("span", undefined, PRIORITY_LABELS[priority] ?? priority),
  );
  return pill;
}

function createGameCard(game: Game): HTMLElement {
  const card = document.createElement("article");
  card.className = "game-card";
  card.dataset.gameId = String(game.id);
  card.dataset.status = game.status;

  const body = element("div", "game-card-body");

  const title = element("h2", "game-title", game.title);
  const platform = element("p", "game-platform", game.platform);

  const meta = element("div", "game-meta");
  meta.append(createStatusPill(game.status));
  if (game.rating !== null) {
    meta.append(element("span", "game-rating", `★ ${game.rating}`));
  }

  body.append(title, platform, meta);

  if (game.priority || game.archived) {
    const tags = element("div", "game-tags");
    if (game.priority) tags.append(createPriorityPill(game.priority));
    if (game.archived) tags.append(element("span", "archived-tag", "Archived"));
    body.append(tags);
  }

  if (game.notes) {
    body.append(element("p", "game-notes", game.notes));
  }

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "edit-game-button";
  editButton.textContent = "Edit";
  editButton.setAttribute("aria-label", `Edit ${game.title}`);
  editButton.addEventListener("click", () => openEditGameForm(game));

  const foot = element("div", "game-foot");
  foot.append(
    element(
      "span",
      "game-added",
      `Added ${new Date(game.addedAt).toLocaleDateString()}`,
    ),
    editButton,
  );
  body.append(foot);

  card.append(createGameCover(game), body);

  return card;
}

// add game, or save an edit when the form was opened from a card
async function handleGameSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();

  const formData = new FormData(gameForm);

  const ratingValue = formData.get("rating");
  const priorityValue = formData.get("priority");
  const notesValue = formData.get("notes");

  const gameInput = {
    title: String(formData.get("title")),
    platform: String(formData.get("platform")),
    status: String(formData.get("status")),
    priority: priorityValue ? String(priorityValue) : null,
    archived: formData.get("archived") === "on",
    rating: ratingValue ? Number(ratingValue) : null,
    notes: notesValue ? String(notesValue) : null,
  };

  const editing = editingGameId !== null;

  const response = await fetch(
    editing ? `/api/games/${editingGameId}` : "/api/games",
    {
      method: editing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gameInput),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to ${editing ? "update" : "create"} game: ${response.status}`,
    );
  }

  closeGameForm();
  await loadGames();
}

function handleLoadError(error: unknown): void {
  console.error(error);
  shelfMessage.textContent = "Could not load your games.";
  shelfMessage.hidden = false;
}

async function handleSignOut(): Promise<void> {
  await fetch("/api/auth/sign-out", { method: "POST" });
  location.href = "/";
}

addGameButton.addEventListener("click", openGameForm);
cancelGameFormButton.addEventListener("click", closeGameForm);
closeGameFormButton.addEventListener("click", closeGameForm);
gameForm.addEventListener("submit", handleGameSubmit);
signOutButton.addEventListener("click", handleSignOut);

// A click landing on the dialog itself, rather than the form filling it, is a
// click on the backdrop.
gameFormDialog.addEventListener("click", (event) => {
  if (event.target === gameFormDialog) closeGameForm();
});

// Covers Escape too, which closes the dialog without going through our buttons.
gameFormDialog.addEventListener("close", () => {
  gameForm.reset();
  editingGameId = null;
});

loadGames().catch(handleLoadError);
