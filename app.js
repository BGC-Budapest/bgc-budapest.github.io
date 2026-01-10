/* ---------- LANGUAGE ---------- */
let currentLang = "hu";

const i18n = {
  hu: {
    title: "Társasjáték kereső",
    searchTitle: "Játék keresése",
    suggestTitle: "Játék ajánlás",
    searchPlaceholder: "Játék neve...",
    searchBtn: "Keresés",
    noResults: "Nincs megfelelő találat 😕"
  },
  en: {
    title: "Board Game Helper",
    searchTitle: "Find a game",
    suggestTitle: "Game suggestion",
    searchPlaceholder: "Game name...",
    searchBtn: "Search",
    noResults: "No matching results 😕"
  }
};

const langToggle = document.getElementById("langToggle");

langToggle.addEventListener("click", () => {
  currentLang = currentLang === "hu" ? "en" : "hu";
  langToggle.textContent = currentLang === "hu" ? "🇺🇸" : "🇭🇺";
  applyLang();
});

function applyLang() {
  const t = i18n[currentLang];
  document.getElementById("title").textContent = t.title;
  document.getElementById("searchTitle").textContent = t.searchTitle;
  document.getElementById("suggestTitle").textContent = t.suggestTitle;
  document.getElementById("searchInput").placeholder = t.searchPlaceholder;
  document.getElementById("searchBtn").textContent = t.searchBtn;
}

applyLang();

/* ---------- FEATURE 1: SEARCH (stub) ---------- */

console.log("JS loaded");

/* ---------- GAMES.JSON DEBUG ---------- */
console.log("Attempting to load games.json...");

fetch("./games.json")
  .then(res => {
    console.log("games.json fetch response:", res);
    return res.json();
  })
  .then(data => {
    console.log("games.json parsed successfully");
    console.table(data);
    window.games = data;
  })
  .catch(err => {
    console.error("❌ games.json fetch FAILED", err);
  });

/* ---------- BGG DEBUG ---------- */
const USERNAME = "Boardgamebudapest";
const BGG_URL = `https://boardgamegeek.com/xmlapi2/collection?username=${USERNAME}&own=1&comment=1`;
const PROXY = "https://api.allorigins.win/raw?url=";

console.log("BGG URL:", BGG_URL);
console.log("Proxy URL:", PROXY + encodeURIComponent(BGG_URL));

const MAX_RETRIES = 5;

async function fetchCollection(retry = 0) {
  console.log("Fetching BGG collection, attempt", retry + 1);

  const response = await fetch(PROXY + encodeURIComponent(BGG_URL));
  console.log("BGG response status:", response.status);

  const xmlText = await response.text();
  console.log("BGG raw XML length:", xmlText.length);

  if (response.status === 202 || xmlText.length === 0) {
    if (retry < MAX_RETRIES) {
      console.warn("Collection not ready yet, retrying in 3s...");
      await new Promise(r => setTimeout(r, 3000));
      return fetchCollection(retry + 1);
    } else {
      console.error("Max retries reached, collection still empty");
      return [];
    }
  }

  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "application/xml");

  const items = Array.from(xml.getElementsByTagName("item"));
  console.log("BGG items found:", items.length);

  const parsed = items.map(item => {
    const name = item.getElementsByTagName("name")[0]?.textContent?.trim();
    const comment = item.getElementsByTagName("comment")[0]?.textContent?.trim();
    return {
      name,
      shelf: comment || "(no comment)"
    };
  });

  console.table(parsed.slice(0, 10)); // first 10 for debug
  return parsed;
}


/* ---------- SEARCH DEBUG ---------- */
async function searchGame(query) {
  console.log("Search query:", query);

  const collection = await fetchCollection();
  console.log("Collection loaded, size:", collection.length);

  const normalizedQuery = query.toLowerCase();
  console.log("Normalized query:", normalizedQuery);

  const matches = collection.filter(g =>
    g.name && g.name.toLowerCase().includes(normalizedQuery)
  );

  console.log("Matches found:", matches.length);
  console.table(matches);

  return matches;
}




/* ---------- FEATURE 2: SUGGEST (fetch JSON) ---------- */

let games = [];
const complexityOrder = ["easy_party", "easy_family", "mid", "heavy"];

fetch("./games.json")
  .then(res => res.json())
  .then(data => {
    games = data;
    console.log("games loaded:", games);
  })
  .catch(err => console.error("games.json load error", err));

document.getElementById("suggestForm").addEventListener("submit", e => {
  e.preventDefault();

  if (!games.length) {
    alert("Games not loaded yet");
    return;
  }

  const players = Number(document.getElementById("players").value);
  const type = document.getElementById("type").value;
  const complexity = document.getElementById("complexity").value;
  const time = document.getElementById("time").value;

  const results = games
    .filter(g => g.players.includes(players))
    .map(g => {
      let score = 0;
      if (g.type.includes(type)) score++;
      if (
        complexityOrder.indexOf(g.complexity) <=
        complexityOrder.indexOf(complexity)
      ) score++;
      if (g.time.includes(time)) score++;
      return { ...g, score };
    })
    .filter(g => g.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const out = document.getElementById("suggestResult");
  out.innerHTML = "";

  if (!results.length) {
    out.textContent = "Nincs találat";
    return;
  }

  results.forEach(g => {
    out.innerHTML += `<div>🎲 ${g.name}</div>`;
  });
});

