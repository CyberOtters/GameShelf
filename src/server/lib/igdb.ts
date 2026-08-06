import apicalypse from "apicalypse";

type IgdbQueryBuilder = ReturnType<typeof apicalypse>;

export type IgdbSearchGame = {
	id: number;
	name: string;
	slug: string;
	cover?: { url: string } | null;
	first_release_date?: number | null;
	platforms?: Array<{ name: string }>;
	genres?: Array<{ name: string }>;
	rating?: number | null;
};

const IGDB_BASE_URL = "https://api.igdb.com/v4";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const TOKEN_BUFFER_MS = 60_000;

type CachedToken = {
	accessToken: string;
	expiresAt: number;
};

let cachedToken: CachedToken | null = null;

function requiredEnv(name: "TWITCH_CLIENT_ID" | "TWITCH_CLIENT_SECRET") {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

async function fetchTwitchAccessToken() {
	const clientId = requiredEnv("TWITCH_CLIENT_ID");
	const clientSecret = requiredEnv("TWITCH_CLIENT_SECRET");

	const response = await fetch(TWITCH_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: "client_credentials",
		}),
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(
			`Failed to get Twitch access token (${response.status}): ${body}`,
		);
	}

	const data = (await response.json()) as {
		access_token: string;
		expires_in: number;
	};

	cachedToken = {
		accessToken: data.access_token,
		expiresAt: Date.now() + data.expires_in * 1000,
	};

	return cachedToken.accessToken;
}

async function getTwitchAccessToken() {
	if (cachedToken && Date.now() < cachedToken.expiresAt - TOKEN_BUFFER_MS) {
		return cachedToken.accessToken;
	}
	return fetchTwitchAccessToken();
}

function createIgdbClient(token: string) {
	const clientId = requiredEnv("TWITCH_CLIENT_ID");

	return apicalypse({
		method: "POST",
		baseURL: IGDB_BASE_URL,
		headers: {
			Accept: "application/json",
			"Client-ID": clientId,
			Authorization: `Bearer ${token}`,
		},
	});
}

export async function queryIgdb<T>(
	endpoint: string,
	buildQuery: (query: IgdbQueryBuilder) => void,
) {
	const token = await getTwitchAccessToken();
	const query = createIgdbClient(token);

	buildQuery(query);

	const response = await query.request(endpoint);
	return response.data as T[];
}

export async function searchIgdbGames(search: string, limit = 20) {
	const trimmed = search.trim();
	if (!trimmed) return [];

	return queryIgdb<IgdbSearchGame>("/games", (query) => {
		query
			.fields([
				"id",
				"name",
				"slug",
				"cover.url",
				"first_release_date",
				"platforms.name",
				"genres.name",
				"rating",
			])
			.search(trimmed)
			.where("version_parent = null")
			.limit(limit);
	});
}

export async function getIgdbGamesByIds(ids: number[]) {
	const validIds = ids.filter((id) => Number.isInteger(id) && id > 0);
	if (validIds.length === 0) return [];

	return queryIgdb<IgdbSearchGame>("/games", (query) => {
		query
			.fields([
				"id",
				"name",
				"slug",
				"cover.url",
				"first_release_date",
				"platforms.name",
				"genres.name",
				"rating",
			])
			.where(`id = (${validIds.join(",")})`)
			.limit(validIds.length);
	});
}
