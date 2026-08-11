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
  // GET /api/games embeds the play log, newest session first.
  sessions: PlaySession[];
  totalHours: number;
};

type PlaySession = {
  id: number;
  gameId: number;
  userId: string;
  hours: number;
  sessionDate: string;
  notes: string | null;
};

type GameSearchResult = {
  igdbId: number;
  title: string;
  coverUrl: string | null;
  releaseYear: number | null;
  platforms: string[];
  genres: string[];
  rating: number | null;
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
const saveGameButton =
  getRequiredElement<HTMLButtonElement>("#save-game-button");

const sessionFormDialog = getRequiredElement<HTMLDialogElement>(
  "#session-form-dialog",
);
const sessionForm = getRequiredElement<HTMLFormElement>("#session-form");
const sessionFormTitle = getRequiredElement<HTMLElement>("#session-form-title");
const sessionGameLabel = getRequiredElement<HTMLElement>("#session-game-label");
const cancelSessionFormButton = getRequiredElement<HTMLButtonElement>(
  "#cancel-session-form",
);
const closeSessionFormButton = getRequiredElement<HTMLButtonElement>(
  "#close-session-form",
);
const saveSessionButton = getRequiredElement<HTMLButtonElement>(
  "#save-session-button",
);
const sessionHoursField =
  getRequiredElement<HTMLInputElement>("#session-hours");
const sessionDateField = getRequiredElement<HTMLInputElement>("#session-date");
const sessionNotesField =
  getRequiredElement<HTMLTextAreaElement>("#session-notes");

/** The game being edited, or null when the form is adding a new one. */
let editingGameId: number | null = null;

/** The game a session is being logged against. */
let loggingSessionGame: Game | null = null;

function field<T extends Element>(name: string): T {
  return getRequiredElement<T>(`#game-form [name="${name}"]`);
}

const titleField = field<HTMLInputElement>("title");
const platformField = field<HTMLSelectElement>("platform");
const statusField = field<HTMLSelectElement>("status");
const ratingField = field<HTMLInputElement>("rating");
const archivedField = field<HTMLInputElement>("archived");
const notesField = field<HTMLTextAreaElement>("notes");
const coverUrlField = field<HTMLInputElement>("coverUrl");
const searchStatus = getRequiredElement<HTMLElement>("#game-search-status");
const searchResults = getRequiredElement<HTMLElement>("#game-search-results");
const coverPreview = getRequiredElement<HTMLElement>("#cover-preview");
const coverPreviewImage = getRequiredElement<HTMLImageElement>(
  "#cover-preview-image",
);
const clearCoverButton = getRequiredElement<HTMLButtonElement>("#clear-cover");

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

/** Maps IGDB platform names onto the shelf dropdown values when possible. */
const PLATFORM_ALIASES: { match: RegExp; value: string }[] = [
  { match: /nintendo switch/i, value: "Nintendo Switch" },
  { match: /playstation\s*5|ps5/i, value: "PS5" },
  { match: /xbox/i, value: "Xbox" },
  { match: /\bpc\b|windows|steam/i, value: "PC" },
];

let searchTimer: ReturnType<typeof setTimeout> | null = null;
let searchRequestId = 0;

function clearSearchUi(): void {
  searchRequestId += 1;
  if (searchTimer !== null) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
  searchResults.replaceChildren();
  searchResults.hidden = true;
  searchStatus.hidden = true;
  searchStatus.textContent = "";
}

function setCoverUrl(url: string | null): void {
  coverUrlField.value = url ?? "";
  if (url) {
    coverPreviewImage.src = url;
    coverPreview.hidden = false;
  } else {
    coverPreviewImage.removeAttribute("src");
    coverPreview.hidden = true;
  }
}

function pickPlatform(platforms: string[]): void {
  for (const alias of PLATFORM_ALIASES) {
    if (platforms.some((name) => alias.match.test(name))) {
      selectValue(platformField, alias.value);
      return;
    }
  }
  if (platforms[0]) selectValue(platformField, platforms[0].slice(0, 30));
}

function applySearchResult(result: GameSearchResult): void {
  titleField.value = result.title;
  setCoverUrl(result.coverUrl);
  pickPlatform(result.platforms);
  if (result.rating !== null && !ratingField.value) {
    ratingField.value = String(
      Math.min(10, Math.max(1, Math.round(result.rating))),
    );
  }
  clearSearchUi();
  titleField.focus();
}

function renderSearchResults(results: GameSearchResult[]): void {
  searchResults.replaceChildren();

  if (results.length === 0) {
    searchStatus.textContent =
      "No IGDB matches — you can still save this title.";
    searchStatus.hidden = false;
    searchResults.hidden = true;
    return;
  }

  searchStatus.hidden = true;

  for (const result of results) {
    const item = document.createElement("li");
    item.className = "game-search-result";
    item.setAttribute("role", "option");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "game-search-result-button";

    if (result.coverUrl) {
      const thumb = document.createElement("img");
      thumb.src = result.coverUrl;
      thumb.alt = "";
      thumb.loading = "lazy";
      thumb.className = "game-search-thumb";
      button.append(thumb);
    } else {
      button.append(element("span", "game-search-thumb empty"));
    }

    const meta = element("span", "game-search-meta");
    meta.append(element("span", "game-search-title", result.title));

    const details = [
      result.releaseYear ? String(result.releaseYear) : null,
      result.platforms.slice(0, 2).join(", ") || null,
    ]
      .filter(Boolean)
      .join(" · ");
    if (details) meta.append(element("span", "game-search-details", details));

    button.append(meta);
    button.addEventListener("click", () => applySearchResult(result));
    item.append(button);
    searchResults.append(item);
  }

  searchResults.hidden = false;
}

async function searchIgdb(query: string): Promise<void> {
  const requestId = ++searchRequestId;
  searchStatus.textContent = "Searching IGDB…";
  searchStatus.hidden = false;
  searchResults.hidden = true;

  try {
    const response = await fetch(
      `/api/igdb/search?q=${encodeURIComponent(query)}`,
    );
    if (!response.ok) {
      throw new Error(`IGDB search failed: ${response.status}`);
    }
    const results: GameSearchResult[] = await response.json();
    if (requestId !== searchRequestId) return;
    renderSearchResults(results);
  } catch (error) {
    if (requestId !== searchRequestId) return;
    console.error(error);
    searchResults.replaceChildren();
    searchResults.hidden = true;
    searchStatus.textContent =
      "Game search is unavailable — you can still enter a title manually.";
    searchStatus.hidden = false;
  }
}

function scheduleIgdbSearch(): void {
  if (searchTimer !== null) clearTimeout(searchTimer);

  const query = titleField.value.trim();
  if (query.length < MIN_SEARCH_LENGTH) {
    clearSearchUi();
    return;
  }

  searchTimer = setTimeout(() => {
    searchTimer = null;
    void searchIgdb(query);
  }, SEARCH_DEBOUNCE_MS);
}

function openGameForm(): void {
  editingGameId = null;
  gameForm.reset();
  clearSearchUi();
  setCoverUrl(null);
  gameFormTitle.textContent = "Add Game";
  saveGameButton.textContent = "Save Game";
  gameFormDialog.showModal();
}

function openEditGameForm(game: Game): void {
  editingGameId = game.id;
  gameForm.reset();
  clearSearchUi();
  gameFormTitle.textContent = "Edit Game";
  saveGameButton.textContent = "Save Changes";

  titleField.value = game.title;
  selectValue(platformField, game.platform);
  statusField.value = game.status;
  ratingField.value = game.rating === null ? "" : String(game.rating);
  archivedField.checked = game.archived;
  notesField.value = game.notes ?? "";
  setCoverUrl(game.coverUrl);

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
  clearSearchUi();
  gameFormDialog.close();
}

function todayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function openSessionForm(game: Game): void {
  loggingSessionGame = game;
  sessionForm.reset();
  sessionFormTitle.textContent = "Log Session";
  sessionGameLabel.textContent = game.title;
  sessionDateField.value = todayDateInputValue();
  saveSessionButton.textContent = "Log Session";
  sessionFormDialog.showModal();
}

function closeSessionForm(): void {
  sessionFormDialog.close();
}

function formatHours(totalHours: number): string {
  if (totalHours === 0) return "0 hrs";
  const formatted = Number.isInteger(totalHours)
    ? String(totalHours)
    : totalHours.toFixed(1);
  return `${formatted} hr${totalHours === 1 ? "" : "s"}`;
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
  const hoursLink = document.createElement("a");
  hoursLink.className = "game-hours";
  hoursLink.href = `/shelf/games/${game.id}/log`;
  hoursLink.textContent = formatHours(game.totalHours);
  hoursLink.setAttribute("aria-label", `View play log for ${game.title}`);

  meta.append(hoursLink);
  if (game.rating !== null) {
    meta.append(element("span", "game-rating", `★ ${game.rating}`));
  }

  body.append(title, platform, meta);

  if (game.sessions.length > 0) {
    const recent = game.sessions[0];
    const recentLine = recent.notes
      ? `Last played ${recent.sessionDate}: ${recent.notes}`
      : `Last played ${recent.sessionDate}`;
    body.append(element("p", "game-recent-session", recentLine));
  }

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

  const logSessionButton = document.createElement("button");
  logSessionButton.type = "button";
  logSessionButton.className = "log-session-button";
  logSessionButton.textContent = "Log Session";
  logSessionButton.setAttribute(
    "aria-label",
    `Log a session for ${game.title}`,
  );
  logSessionButton.addEventListener("click", () => openSessionForm(game));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-game-button";
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", `Delete ${game.title}`);
  deleteButton.addEventListener("click", () => {
    void deleteGame(game).catch(handleActionError);
  });

  const actions = element("div", "game-card-actions");
  actions.append(logSessionButton, editButton, deleteButton);

  const foot = element("div", "game-foot");
  foot.append(
    element(
      "span",
      "game-added",
      `Added ${new Date(game.addedAt).toLocaleDateString()}`,
    ),
    actions,
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

  const coverUrlValue = formData.get("coverUrl");

  const gameInput = {
    title: String(formData.get("title")),
    platform: String(formData.get("platform")),
    status: String(formData.get("status")),
    priority: priorityValue ? String(priorityValue) : null,
    archived: formData.get("archived") === "on",
    rating: ratingValue ? Number(ratingValue) : null,
    coverUrl: coverUrlValue ? String(coverUrlValue) : null,
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

async function deleteGame(game: Game): Promise<void> {
  const confirmed = confirm(
    `Delete "${game.title}"? Its play sessions will be removed too.`,
  );
  if (!confirmed) return;

  const response = await fetch(`/api/games/${game.id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(`Failed to delete game: ${response.status}`);
  }

  if (editingGameId === game.id) closeGameForm();
  await loadGames();
}

async function handleSessionSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  if (!loggingSessionGame) return;

  const formData = new FormData(sessionForm);
  const notesValue = formData.get("notes");

  const sessionInput = {
    hours: Number(formData.get("hours")),
    sessionDate: String(formData.get("sessionDate")),
    notes: notesValue ? String(notesValue) : null,
  };

  const response = await fetch(`/api/games/${loggingSessionGame.id}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sessionInput),
  });

  if (!response.ok) {
    throw new Error(`Failed to log session: ${response.status}`);
  }

  closeSessionForm();
  await loadGames();
}

function handleActionError(error: unknown): void {
  console.error(error);

  if (error instanceof Error && error.message.includes("401")) {
    shelfMessage.textContent =
      "Your session expired. Sign in again from the home page.";
  } else if (error instanceof Error && error.message.includes("500")) {
    shelfMessage.textContent =
      "The database connection dropped. Restart npm run dev, then refresh.";
  } else if (error instanceof Error && error.message.includes("delete")) {
    shelfMessage.textContent = "Could not delete that game.";
  } else {
    shelfMessage.textContent = "Something went wrong. Try again.";
  }

  shelfMessage.hidden = false;
}

function handleLoadError(error: unknown): void {
  handleActionError(error);
  if (
    error instanceof Error &&
    !error.message.includes("401") &&
    !error.message.includes("500") &&
    !error.message.includes("delete")
  ) {
    shelfMessage.textContent = "Could not load your games.";
  }
}

async function handleSignOut(): Promise<void> {
  await fetch("/api/auth/sign-out", { method: "POST" });
  location.href = "/";
}

addGameButton.addEventListener("click", openGameForm);
cancelGameFormButton.addEventListener("click", closeGameForm);
closeGameFormButton.addEventListener("click", closeGameForm);
clearCoverButton.addEventListener("click", () => setCoverUrl(null));
titleField.addEventListener("input", scheduleIgdbSearch);
gameForm.addEventListener("submit", handleGameSubmit);
cancelSessionFormButton.addEventListener("click", closeSessionForm);
closeSessionFormButton.addEventListener("click", closeSessionForm);
sessionForm.addEventListener("submit", handleSessionSubmit);
signOutButton.addEventListener("click", handleSignOut);

// A click landing on the dialog itself, rather than the form filling it, is a
// click on the backdrop.
gameFormDialog.addEventListener("click", (event) => {
  if (event.target === gameFormDialog) closeGameForm();
});

// Covers Escape too, which closes the dialog without going through our buttons.
gameFormDialog.addEventListener("close", () => {
  clearSearchUi();
  setCoverUrl(null);
  gameForm.reset();
  editingGameId = null;
});

sessionFormDialog.addEventListener("click", (event) => {
  if (event.target === sessionFormDialog) closeSessionForm();
});

sessionFormDialog.addEventListener("close", () => {
  sessionForm.reset();
  loggingSessionGame = null;
});

loadGames().catch(handleLoadError);

export {};
