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

const gameGrid = document.querySelector<HTMLElement>("#game-grid");
const shelfMessage = document.querySelector<HTMLElement>("#shelf-message");

if (!gameGrid || !shelfMessage) {
  throw new Error("Shelf page elements were not found");
}

async function loadGames(): Promise<void> {
  const response = await fetch("/api/games");

  if (!response.ok) {
    throw new Error(`Failed to load games: ${response.status}`);
  }

  const games = (await response.json()) as Game[];

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
    const card = document.createElement("article");
    card.className = "game-card";
    card.dataset.gameId = String(game.id);
    card.dataset.status = game.status;

    const title = document.createElement("h2");
    title.textContent = game.title;

    const platform = document.createElement("p");
    platform.textContent = `Platform: ${game.platform}`;

    const status = document.createElement("p");
    status.textContent = `Status: ${game.status}`;

    const priority = document.createElement("p");
    priority.textContent = `Priority: ${game.priority ?? "None"}`;

    const rating = document.createElement("p");
    rating.textContent = `Rating: ${game.rating ?? "Not rated"}`;

    const archived = document.createElement("p");
    archived.textContent = `Archived: ${game.archived ? "Yes" : "No"}`;

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-game-button";
    editButton.textContent = "Edit";

    card.append(
      title,
      platform,
      status,
      priority,
      rating,
      archived,
      editButton,
    );

    if (game.notes) {
      const notes = document.createElement("p");
      notes.textContent = `Notes: ${game.notes}`;
      card.append(notes);
    }

    gameGrid.append(card);
  }
}

loadGames().catch((error: unknown) => {
  console.error(error);
  shelfMessage.textContent = "Could not load your games.";
});
