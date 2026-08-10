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
const formContainer = getRequiredElement<HTMLElement>("#game-form-container");
const gameForm = getRequiredElement<HTMLFormElement>("#game-form");

const cancelGameFormButton =
  getRequiredElement<HTMLButtonElement>("#cancel-game-form");

function openGameForm(): void {
  gameForm.reset();
  formContainer.hidden = false;
}

function closeGameForm(): void {
  gameForm.reset();
  formContainer.hidden = true;
}

// Load games from /api/games
async function loadGames(): Promise<void> {
  const response = await fetch("/api/games");

  if (!response.ok) {
    throw new Error(`Failed to load games: ${response.status}`);
  }
  const games: Game[] = await response.json();
  renderGames(games);
}

function renderGames(games: Game[]): void {
  gameGrid.replaceChildren();
  if (games.length === 0) {
    shelfMessage.textContent = "Your shelf is empty.";
    return;
  }
  shelfMessage.textContent = "";
  for (const game of games) {
    const card = createGameCard(game);
    gameGrid.append(card);
  }
}

// Helper function for <p>
function createParagraph(text: string): HTMLParagraphElement {
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  return paragraph;
}

function createGameCard(game: Game): HTMLElement {
  const card = document.createElement("article");
  card.className = "game-card";
  card.dataset.gameId = String(game.id);
  card.dataset.status = game.status;

  const coverImage = document.createElement("img");
  coverImage.className = "game-cover";
  if (game.coverUrl) {
    coverImage.src = game.coverUrl;
  } else {
    coverImage.src = "/images/placeholder-cover.png";
  }

  const addedDate = new Date(game.addedAt);

  const title = document.createElement("h2");
  title.textContent = game.title;

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "edit-game-button";
  editButton.textContent = "Edit";

  card.append(
    coverImage,
    title,
    createParagraph(`Platform: ${game.platform}`),
    createParagraph(`Status: ${game.status}`),
    createParagraph(`Priority: ${game.priority ?? "None"}`),
    createParagraph(`Rating: ${game.rating ?? "Not rated"}`),
    createParagraph(`Archived: ${game.archived ? "Yes" : "No"}`),
    createParagraph(`Added: ${addedDate.toLocaleDateString()}`),
  );

  if (game.notes) {
    const notes = document.createElement("p");
    notes.textContent = `Notes: ${game.notes}`;
    card.append(notes);
  }

  card.append(editButton);

  return card;
}

// add game
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

  const response = await fetch("/api/games", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(gameInput),
  });

  if (!response.ok) {
    throw new Error(`Failed to create game: ${response.status}`);
  }

  closeGameForm();
  await loadGames();
}

function handleLoadError(error: unknown): void {
  console.error(error);
  shelfMessage.textContent = "Could not load your games.";
}

addGameButton.addEventListener("click", openGameForm);
cancelGameFormButton.addEventListener("click", closeGameForm);
gameForm.addEventListener("submit", handleGameSubmit);

loadGames().catch(handleLoadError);
