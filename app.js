const USERNAME = 'Boardgamebudapest';
const BGG_API_TOKEN = '8affd03f-7be3-47df-8bcd-747ebdead50e'; // PASTE YOUR TOKEN HERE WHEN YOU GET IT - Leave empty to use local JSON file

let gamesCollection = [];
let suggestedGames = []; // Will store the curated game suggestions
let isLoading = false;
let currentLanguage = 'hu'; // Default language is Hungarian

const SHELF_ZONE_MAP = {
  ground: [
    { range: [35, 36],   zoneId: "zone-top-1" },
    { range: [25, 34],   zoneId: "zone-top-2" },

    { range: [20, 24],  zoneId: "zone-right-1" },
    { range: [18, 19], zoneId: "zone-right-2" },
    { range: [16, 17], zoneId: "zone-right-3" },
    { range: [11, 15], zoneId: "zone-right-4" },
    { range: [9, 10], zoneId: "zone-right-5" },
    { range: [8, 8], zoneId: "zone-right-6" },
    { range: [7, 7], zoneId: "zone-right-7" },
    { range: [4, 6], zoneId: "zone-right-8" },
    { range: [3, 3], zoneId: "zone-right-9" },

    { range: [37, 38], zoneId: "zone-bottom-1" },
    { range: [1, 2], zoneId: "zone-bottom-2" }
  ],
  first: [
    { range: [81, 84], zoneId: "zone-top-1" },
    { range: [73, 80], zoneId: "zone-top-2" },

    { range: [72, 72], zoneId: "zone-right-1" },
    { range: [70, 71], zoneId: "zone-right-2" },
    { range: [63, 69], zoneId: "zone-right-3" },
    { range: [61, 62], zoneId: "zone-right-4" },
    { range: [57, 60], zoneId: "zone-right-5" },
    { range: [53, 56], zoneId: "zone-right-6" },

    { range: [50, 51], zoneId: "zone-bottom-1" },
    { range: [52, 52], zoneId: "zone-bottom-2" }
  ]
};

// ============== LANGUAGE SWITCHING ==============

function switchLanguage() {
    currentLanguage = currentLanguage === 'hu' ? 'en' : 'hu';
    console.log('Switching to language:', currentLanguage);

    // Update flag
    const flagImg = document.getElementById('langFlag');
    flagImg.src = currentLanguage === 'hu' ? 'img/flag-en.png' : 'img/flag-hu.png';
    flagImg.alt = currentLanguage === 'hu' ? 'Switch to English' : 'Váltás magyarra';

    // Update all elements with data-hu and data-en attributes
    document.querySelectorAll('[data-hu][data-en]').forEach(element => {
        if (element.tagName === 'INPUT' && element.hasAttribute('data-hu-placeholder')) {
            element.placeholder = element.getAttribute(`data-${currentLanguage}-placeholder`);
        } else if (element.tagName === 'OPTION') {
            element.textContent = element.getAttribute(`data-${currentLanguage}`);
        } else {
            element.textContent = element.getAttribute(`data-${currentLanguage}`);
        }
    });

    console.log('Language switched to:', currentLanguage);
}

// Add click listener to language flag
document.getElementById('langFlag').addEventListener('click', switchLanguage);

// ============== TRANSLATIONS ==============

const translations = {
    hu: {
        loading: 'Betöltés...',
        emptySearch: 'Kérlek írj be egy játék nevet!',
        collectionStillLoading: 'Gyűjtemény még betöltés alatt...',
        noGameFound: 'Nem találtunk ilyen játékot.',
        matches: 'találat',
        shelf: 'Polc',
        noShelfInfo: 'Nincs polc információ',
        gamesLoaded: 'játék betöltve',
        gamesLoadedAPI: 'játék betöltve (BGG API)',
        gamesLoadedLocal: 'játék betöltve (Helyi fájl)',
        gamesWithShelf: 'játéknak van polc információja',
        selectPlayerCount: 'Kérlek válaszd ki, hányan játszotok!',
        selectComplexity: 'Kérlek válaszd ki a bonyolultságot!',
        validPlayerCount: 'Kérlek adj meg egy érvényes játékosszámot (1-30)!',
        noMatchingGame: 'Sajnos nem találtunk megfelelő játékot ezekkel a beállításokkal. 😔',
        tryDifferentSettings: 'Próbálj meg más beállításokat!',
        suggestedGames: 'Javasolt játékok',
        players: 'játékos',
        rating: 'Értékelés',
        // Extra options translations
        cooperative: 'Kooperatív',
        card_game: 'Kártyajáték',
        fast_paced: 'Gyorsasági',
        dexterity: 'Ügyességi',
        logic: 'Logikai',
        award_winning: 'Díjnyertes',
        conversational: 'Ismerkedős / beszélgetős',
        bluffing: 'Blöffölős',
        pretty: 'Szép asztalkép',
        race: 'Verseny',
        dice: 'Kockajáték',
        takeThat: 'Kiszúrós',
        // Info box messages
        englishGamesInfo: 'ℹ️🌍 Az összes angol nyelvű játékunk a földszinten, a 01-02 és 37-38-as polcon található.',
        twoPlayerGamesInfo: ' ℹ️🆚 Az összes dedikáltan 2 fős játékunk az 1. emeleten, az 50-56-os polcon található.',
        awardWinningInfo: 'ℹ️🏆 Minden Spiel des Jahres díjnyertes játék az 1. emeleten, az 57-62-es polcon található.',
        resetButton: 'Újrakezdés',
        firstFloor: '1. emelet',
        groundFloor: 'Földszint',
        shelfButton: 'Polc',
        showAllButton: 'Összes megjelenítése',
        showLessButton: 'Kevesebb',
        randomGame: 'Véletlen játék',
        matchingGames: 'egyező játék',
        clearButton: 'Törlés',
        //Popup
        playerCount: "Játékosszám",
        rating: "Értékelés",
        complexity: "Komplexitás",
        complexity_very_easy: "Nagyon könnyű",
        complexity_easy: "Könnyű",
        complexity_mid: "Közepes",
        complexity_hard: "Nehéz",
        complexity_hardcore: "Nagyon nehéz",
        mechanics: "Mechanikák"
    },
    en: {
        loading: 'Loading...',
        emptySearch: 'Please enter a game name!',
        collectionStillLoading: 'Collection still loading...',
        noGameFound: 'No game found.',
        matches: 'match(es)',
        shelf: 'Shelf',
        noShelfInfo: 'No shelf info',
        gamesLoaded: 'games loaded',
        gamesLoadedAPI: 'games loaded (BGG API)',
        gamesLoadedLocal: 'games loaded (Local file)',
        gamesWithShelf: 'games have shelf info',
        selectPlayerCount: 'Please select player count!',
        selectComplexity: 'Please select complexity!',
        validPlayerCount: 'Please enter a valid player count (1-30)!',
        noMatchingGame: 'Unfortunately, we couldn\'t find a matching game with these settings. 😔',
        tryDifferentSettings: 'Try different settings!',
        suggestedGames: 'Suggested games',
        players: 'players',
        rating: 'Rating',
        // Extra options translations
        cooperative: 'Cooperative',
        card_game: 'Card game',
        fast_paced: 'Fast-paced',
        dexterity: 'Dexterity',
        logic: 'Logic',
        award_winning: 'Award-winning',
        conversational: 'Conversational',
        bluffing: 'Bluffing',
        pretty: 'Pretty',
        race: 'Race',
        dice: 'Dicegame',
        takeThat: 'Take That',
        // Info box messages
        englishGamesInfo: 'ℹ️🌍 All of our English games can be found on the ground floor on shelf 01-02 and 37-38.',
        twoPlayerGamesInfo: 'ℹ️🆚 All of our dedicated 2 player games can be found on the 1st floor on shelf 50-56.',
        awardWinningInfo: 'ℹ️🏆 Every Spiel des Jahres award winning game can be found on the 1st floor on shelf 57-62.',
        resetButton: 'Reset',
        firstFloor: '1st floor',
        groundFloor: 'Ground floor',
        shelfButton: 'Shelf',
        showAllButton: 'Show All',
        showLessButton: 'Show Less',
        randomGame: 'Random Game',
        matchingGames: 'matching games',
        clearButton: 'Clear',
        //Popup
        playerCount: "Player count",
        rating: "Rating",
        complexity: "Complexity",
        complexity_very_easy: "Very easy",
        complexity_easy: "Easy",
        complexity_mid: "Mid",
        complexity_hard: "Hard",
        complexity_hardcore: "Hardcore",
        mechanics: "Mechanics"
    }
};

function t(key) {
    return translations[currentLanguage][key] || key;
}

// Main function to fetch collection - uses API if token is available, otherwise loads from JSON
async function fetchCollection() {
    console.log('=== STARTING COLLECTION FETCH ===');
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = `<div class="loading">${t('loading')}</div>`;

    // Check if we should use API or local JSON
    if (BGG_API_TOKEN && BGG_API_TOKEN.trim() !== '') {
        console.log('API token found - fetching from BGG API');
        await fetchFromAPI();
    } else {
        console.log('No API token - loading from local games.json file');
        await fetchFromJSON();
    }
}

// Fetch from BGG API (when token is available)
async function fetchFromAPI() {
    const resultsDiv = document.getElementById('searchResults');

    try {
        const url = `https://boardgamegeek.com/xmlapi2/collection?username=${USERNAME}`;
        console.log('Fetching URL:', url);
        console.log('Using token (first 10 chars):', BGG_API_TOKEN.substring(0, 10) + '...');

        // Make request with Authorization header
        console.log('Sending fetch request with Authorization header...');
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${BGG_API_TOKEN}`,
                'Accept': 'application/xml, text/xml, */*'
            }
        });

        console.log('Response received:', response);
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        // BGG API returns 202 when collection is being queued
        if (response.status === 202) {
            console.log('Got 202 - Collection is being queued, will retry in 3 seconds...');
            resultsDiv.innerHTML = `<div class="loading">${t('loading')}</div>`;
            await new Promise(resolve => setTimeout(resolve, 3000));
            return fetchFromAPI(); // Retry
        }

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized - Check if your API token is valid and correctly formatted');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Reading response text...');
        const xmlText = await response.text();
        console.log('XML Text length:', xmlText.length);
        console.log('XML Text preview (first 500 chars):', xmlText.substring(0, 500));

        // Parse XML
        console.log('Parsing XML...');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        // Check for errors
        const error = xmlDoc.querySelector('error');
        if (error) {
            console.error('BGG API returned an error:', error.textContent);
            throw new Error('BGG API error: ' + error.textContent);
        }

        // Check for parsing errors
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            console.error('XML parsing error:', parseError.textContent);
            throw new Error('XML parsing error');
        }

        // Extract games
        console.log('Extracting game items...');
        const items = xmlDoc.querySelectorAll('item');
        console.log('Found items:', items.length);

        if (items.length === 0) {
            throw new Error('No games found in collection');
        }

        gamesCollection = Array.from(items).map((item, index) => {
            const name = item.querySelector('name')?.textContent || 'Unknown';
            const objectid = item.getAttribute('objectid');
            const comment = item.querySelector('comment');
            const shelf = comment ? comment.textContent.trim() : '';

            if (index < 5) {
                console.log(`Game ${index}:`, { name, objectid, shelf });
            }

            return { name, objectid, shelf };
        });

        console.log('Total games loaded from API:', gamesCollection.length);
        console.log('Games with shelf info:', gamesCollection.filter(g => g.shelf).length);

        resultsDiv.innerHTML = `
            <div style="color: green;">
                ✓ ${gamesCollection.length} ${t('gamesLoadedAPI')}<br>
                <small>${gamesCollection.filter(g => g.shelf).length} ${t('gamesWithShelf')}</small>
            </div>
        `;
        console.log('=== COLLECTION FETCH FROM API COMPLETE ===');

    } catch (error) {
        console.error('=== ERROR DURING API FETCH ===');
        console.error('Error:', error);

        resultsDiv.innerHTML = `
            <div class="error">
                <strong>Error loading from BGG API</strong><br>
                ${error.message}
            </div>
        `;
    }
}

// Fetch from local JSON file (temporary solution while waiting for API token)
async function fetchFromJSON() {
    const resultsDiv = document.getElementById('searchResults');

    try {
        console.log('Attempting to load from games.json...');
        const response = await fetch('games.json');

        if (!response.ok) {
            throw new Error(`games.json not found (status: ${response.status})`);
        }

        const data = await response.json();
        console.log('JSON loaded successfully');

        gamesCollection = data.games || data;
        console.log('Total games loaded from JSON:', gamesCollection.length);
        console.log('Games with shelf info:', gamesCollection.filter(g => g.shelf).length);
        console.log('Sample games:', gamesCollection.slice(0, 3));

        resultsDiv.innerHTML = `
            <div style="color: green;">
                ✓ ${gamesCollection.length} ${t('gamesLoadedLocal')}<br>
                <small>${gamesCollection.filter(g => g.shelf).length} ${t('gamesWithShelf')}</small>
            </div>
        `;
        console.log('=== COLLECTION LOAD FROM JSON COMPLETE ===');

    } catch (error) {
        console.error('=== ERROR LOADING JSON ===');
        console.error('Error:', error);

        resultsDiv.innerHTML = `
            <div class="error">
                <strong>Error loading collection</strong><br>
                ${error.message}
            </div>
        `;
    }
}

// Function to search games
function searchGames(query) {
    console.log('=== SEARCHING FOR:', query, '===');
    const resultsDiv = document.getElementById('searchResults');
    const resetSearchBtn = document.getElementById('resetSearchBtn');

    if (!query.trim()) {
        console.log('Empty query, showing error');
        resultsDiv.innerHTML = `<div class="error">${t('emptySearch')}</div>`;
        resetSearchBtn.style.display = 'none';
        return;
    }

    if (gamesCollection.length === 0) {
        console.log('Collection not loaded yet');
        resultsDiv.innerHTML = `<div class="error">${t('collectionStillLoading')}</div>`;
        resetSearchBtn.style.display = 'none';
        return;
    }

    // Search for matching games (case insensitive)
    const searchTerm = query.toLowerCase();
    console.log('Search term (lowercase):', searchTerm);

    const matches = gamesCollection.filter(game =>
        game.name.toLowerCase().includes(searchTerm)
    );

    console.log('Matches found:', matches.length);
    console.log('Matched games:', matches);

    // Show reset button when there are results or input
    resetSearchBtn.style.display = 'block';

    // Display results
    if (matches.length === 0) {
        resultsDiv.innerHTML = `<div class="error">${t('noGameFound')}</div>`;
    } else {
        let html = `<div><strong>${matches.length} ${t('matches')}:</strong></div>`;
        matches.forEach(game => {
            if (game.shelf) {
                // Extract shelf number (before the -)
                const shelfMatch = game.shelf.match(/^(\d+)/);
                const shelfNumber = shelfMatch ? parseInt(shelfMatch[1]) : null;

                // Determine floor based on shelf number

                let floorText = '';

                if (shelfNumber !== null) {
                    if (shelfNumber <= 49) {
                        floorText = `${t('groundFloor')} - `;

                    } else if (shelfNumber >= 50) {
                        floorText = `${t('firstFloor')} - `;
                    }
                }
                
                const shelfText = `📍 ${floorText}${t('shelf')}: ${game.shelf}`;

                html += `
                    <div class="game-item"
                        data-objectid="${game.objectid || ''}"
                        data-gamename="${game.name}"
                        data-shelf="${shelfText}">
                        <div class="game-name">${game.name}</div>
                        <div class="shelf-info">${shelfText}</div>
                    </div>
                `;

            } else {
                const noShelfText = t('noShelfInfo');

                html += `
                    <div class="game-item"
                        data-objectid="${game.objectid || ''}"
                        data-gamename="${game.name}"
                        data-shelf="${noShelfText}">
                        <div class="game-name">${game.name}</div>
                        <div style="color: #999;">${noShelfText}</div>
                    </div>
                `;

            }
        });
        resultsDiv.innerHTML = html;
    }
    console.log('=== SEARCH COMPLETE ===');
}

// Event listeners
document.getElementById('searchBtn').addEventListener('click', () => {
    const query = document.getElementById('searchInput').value;
    searchGames(query);
});

document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = document.getElementById('searchInput').value;
        searchGames(query);
    }
});

// Reset search button event listener
document.getElementById('resetSearchBtn').addEventListener('click', () => {
    console.log('Reset search button clicked');
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('resetSearchBtn').style.display = 'none';
});

// Load collection on page load
console.log('Page loaded, starting collection fetch...');
console.log('BGG_API_TOKEN configured:', BGG_API_TOKEN ? 'Yes' : 'No (using local JSON)');
fetchCollection();

// Load suggested games on page load
loadSuggestedGames();

//=============== POPUP LOGIC =========================

const modalOverlay = document.getElementById("game-modal-overlay");
const modalContent = document.getElementById("modal-content");
const modalClose = document.getElementById("modal-close");

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => {
  if (e.target === modalOverlay) closeModal();
});

function closeModal() {
  modalOverlay.classList.add("hidden");
  modalContent.innerHTML = "";
}

async function fetchBggGameDetails(objectId) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${objectId}&stats=1`;
  const response = await fetch(url, {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${BGG_API_TOKEN}`,
          'Accept': 'application/xml, text/xml, */*'
      }
  });


  const text = await response.text();
  const xml = new DOMParser().parseFromString(text, "text/xml");

  const item = xml.querySelector("item");

  const minPlayers = item.querySelector("minplayers")?.getAttribute("value");
  const maxPlayers = item.querySelector("maxplayers")?.getAttribute("value");

  const rating = item.querySelector("statistics ratings average")?.getAttribute("value");
  const weight = item.querySelector("statistics ratings averageweight")?.getAttribute("value");

  const image = item.querySelector("image")?.textContent;

  const mechanisms = [...item.querySelectorAll("link[type='boardgamemechanic']")]
    .map(m => m.getAttribute("value"));

  return {
    minPlayers,
    maxPlayers,
    rating,
    weight,
    weightText: mapComplexity(parseFloat(weight)),
    mechanisms,
    image
  };
}

function mapComplexity(weight) {
  if (weight < 1.5) return t("complexity_very_easy");
  if (weight < 2.5) return t("complexity_easy");
  if (weight < 3.5) return t("complexity_mid");
  if (weight < 4.5) return t("complexity_hard");
  return t("complexity_hardcore");
}

async function openGameModal(gameName, objectId, shelfInfo) {
  if (!objectId) return;

  modalOverlay.classList.remove("hidden");
  modalContent.innerHTML = `
  <div class="skeleton skeleton-image"></div>
  <div class="skeleton skeleton-line"></div>
  <div class="skeleton skeleton-line"></div>
  <div class="skeleton skeleton-line"></div>
`;


  try {
    const data = await fetchBggGameDetails(objectId);

    modalContent.innerHTML = `
      ${data.image ? `<img src="${data.image}" alt="${gameName}">` : ""}

        <div class="modal-section">
        <div class="modal-label">👥 ${t("playerCount")}:</div>
        ${data.minPlayers}–${data.maxPlayers}
        </div>

        <div class="modal-section">
        <div class="modal-label">⭐ ${t("rating")}:</div>
        ${Number(data.rating).toFixed(2)}
        </div>

        <div class="modal-section">
        <div class="modal-label">🧠 ${t("complexity")}:</div>
        ${Number(data.weight).toFixed(2)} / 5 – ${data.weightText}
        </div>

        <div class="modal-section">
        <div class="modal-label">⚙️ ${t("mechanics")}:</div>
        ${data.mechanisms.join(", ")}
        </div>

        <div class="modal-section">
        <div class="modal-label">📍 ${t('shelf')}:</div>
        ${shelfInfo}
        </div>
    `;

    const floorData = resolveFloorAndShelf(shelfInfo);

    if (floorData) {
    modalContent.innerHTML += `
        <div class="floor-map-wrapper">
        <div class="floor-map-title">${floorData.floorLabel}</div>
        <div id="floor-map-container"></div>
        </div>
    `;

    loadFloorMap(
        floorData.floorKey,
        floorData.shelfNumber,
        floorData.svg
    );
    }

  } catch (err) {
    modalContent.innerHTML = `<p>Hiba történt az adatok betöltésekor.</p>`;
    console.error(err);
  }
}

const resultsDiv = document.getElementById("searchResults");

resultsDiv.addEventListener("click", (e) => {
    const gameItem = e.target.closest(".game-item");
    if (!gameItem) return;

    const objectId = gameItem.dataset.objectid;
    const gameName = gameItem.dataset.gamename;
    const rawShelfInfo = gameItem.dataset.shelf;

    if (!objectId) return;

    const shelfInfo = rawShelfInfo
        ? rawShelfInfo.replace(/^📍\s*/, "")
        : "";

    openGameModal(gameName, objectId, shelfInfo);
});

// ============== SHELF HIGHLIGHTING LOGIC ==============

const FLOOR_CONFIG = {
  ground: {
    label: t("groundFloor"),
    shelfRange: [1, 49],
    svg: "/img/floor-ground.svg"
  },
  first: {
    label: t("firstFloor"),
    shelfRange: [50, 99],
    svg: "/img/floor-first.svg"
  }
};

function resolveFloorAndShelf(shelfInfo) {
  const match = shelfInfo.match(/(\d+)-/);
  if (!match) return null;

  const shelfNumber = parseInt(match[1], 10);
  if (Number.isNaN(shelfNumber)) return null;

  for (const [key, floor] of Object.entries(FLOOR_CONFIG)) {
    const [min, max] = floor.shelfRange;
    if (shelfNumber >= min && shelfNumber <= max) {
      return {
        floorKey: key,
        shelfNumber,
        floorLabel: floor.label,
        svg: floor.svg
      };
    }
  }

  return null;
}

async function loadFloorMap(floorKey, shelfNumber, svgPath) {
  const container = document.getElementById("floor-map-container");
  const response = await fetch(svgPath);
  const svgText = await response.text();

  container.innerHTML = svgText;

  const zone = SHELF_ZONE_MAP[floorKey]?.find(z =>
    shelfNumber >= z.range[0] && shelfNumber <= z.range[1]
  );

  if (!zone) return;

  requestAnimationFrame(() => {
    const el = container.querySelector(`#${zone.zoneId}`);
    el?.classList.add("active");
  });
}



// ============== GAME SUGGESTION SYSTEM ==============

// Load suggested games data from JSON file
async function loadSuggestedGames() {
    console.log('=== LOADING SUGGESTED GAMES ===');

    try {
        console.log('Fetching suggested-games.json...');
        const response = await fetch('suggested-games.json');

        if (!response.ok) {
            throw new Error(`suggested-games.json not found (status: ${response.status})`);
        }

        const data = await response.json();
        suggestedGames = data.games || [];

        console.log(`✓ Loaded ${suggestedGames.length} suggested games`);
        console.log('Sample games:', suggestedGames.slice(0, 3));
        console.log('All suggested games:', suggestedGames);
    } catch (error) {
        console.error('=== ERROR LOADING SUGGESTED GAMES ===');
        console.error('Error:', error);
        console.log('Using empty suggested games list');
        suggestedGames = [];
    }
}

// Get suggestions based on user preferences
function getSuggestions(showAll = false) {
    console.log('=== GETTING SUGGESTIONS ===');
    const resultsDiv = document.getElementById('suggestionResults');
    const surveyForm = document.getElementById('surveyForm');

    // Get user inputs
    const playerCount = document.getElementById('playerCount').value;
    const complexity = document.querySelector('input[name="complexity"]:checked')?.value;
    const englishOnly = document.getElementById('englishOnly').checked;
    const selectedExtras = Array.from(document.querySelectorAll('input[name="extra"]:checked')).map(cb => cb.value);

    console.log('User preferences:', { playerCount, complexity, englishOnly, selectedExtras });

    // Validation
    if (!playerCount) {
        alert(t('selectPlayerCount'));
        return;
    }

    if (!complexity) {
        alert(t('selectComplexity'));
        return;
    }

    // Check if suggested games are loaded
    if (suggestedGames.length === 0) {
        alert('Suggested games database not loaded yet.');
        return;
    }

    // Score and filter games
    const playerNum = parseInt(playerCount);

    // Validate player number
    if (isNaN(playerNum) || playerNum < 1 || playerNum > 30) {
        alert(t('validPlayerCount'));
        return;
    }

const scoredGames = suggestedGames.map(game => {
        // Filter by English availability if checked
        if (englishOnly && !game.englishAvailable) {
            return null;
        }
        
        // Player count match (must match)
        const supportsPlayerCount = game.players.includes(playerNum);
        if (!supportsPlayerCount) return null;
        
        // Complexity match (must match exactly)
        if (game.complexity !== complexity) return null;
        
        // Extras match (if any extras selected, game must have at least one)
        if (selectedExtras.length > 0) {
            const hasMatchingExtra = selectedExtras.some(extra => game.extras && game.extras.includes(extra));
            if (!hasMatchingExtra) return null;
        }
        
        // Calculate score based on extras match count (if extras were selected)
        let extraScore = 0;
        if (selectedExtras.length > 0) {
            const matchingExtras = selectedExtras.filter(extra => game.extras && game.extras.includes(extra));
            extraScore = matchingExtras.length * 100; // Each matching extra is worth 100 points
        }
        
        // Total score: extras match count (prioritized) + BGG rating
        const totalScore = extraScore + game.bggRating;
        
        return { ...game, score: totalScore };
    }).filter(g => g !== null);
    
    console.log('Scored games:', scoredGames);
    
    // Sort by score (highest first)
    const sortedGames = scoredGames.sort((a, b) => b.score - a.score);
    
    // Determine how many to show
    const gamesToShow = showAll ? sortedGames : sortedGames.slice(0, 5);
    const hasMoreGames = sortedGames.length > 5;
    
    console.log('Games to display:', gamesToShow.length, 'Total matching:', sortedGames.length);
    
    displaySuggestionResults(gamesToShow, sortedGames.length, hasMoreGames, showAll, playerNum, englishOnly, selectedExtras);
}

// Display suggestion results
function displaySuggestionResults(games, totalCount, hasMoreGames, showingAll, playerNum, englishOnly, selectedExtras) {
    const resultsDiv = document.getElementById('suggestionResults');
    const surveyForm = document.getElementById('surveyForm');

    // Sort by BGG rating (descending)
    const sortedGames = games.sort((a, b) => b.bggRating - a.bggRating);

    // Take top 5
    const topGames = sortedGames.slice(0, 5);

    console.log('Top suggestions (sorted by rating):', topGames);

    // Hide form, show results
    surveyForm.style.display = 'none';
    resultsDiv.style.display = 'block';
    
    if (games.length === 0) {
        resultsDiv.innerHTML = `
            <div class="button-row">
                <button id="resetBtn" class="reset-btn search-btn" data-hu="${t('resetButton')}" data-en="${t('resetButton')}">${t('resetButton')}</button>
            </div>
            <div class="error">
                ${t('noMatchingGame')}<br><br>
                <small>${t('tryDifferentSettings')}</small>
            </div>
        `;
        document.getElementById('resetBtn').addEventListener('click', resetSuggestionForm);
    } else {
        console.log('Displaying games with images...');
        let html = `<div class="button-row">
        <button id="resetBtn" class="reset-btn search-btn" data-hu="${t('resetButton')}" data-en="${t('resetButton')}">${t('resetButton')}</button>
        </div>`;
        html += `<div><strong>${t('suggestedGames')} (${games.length}${hasMoreGames && !showingAll ? ` / ${totalCount} ${t('matchingGames')}` : ''}):</strong></div>`;
        
        games.forEach((game, index) => {
            const imagePath = game.image ? `img/${game.image}` : '';
            console.log(`Game: ${game.name}, Image path: ${imagePath || 'No image'}, Score: ${game.score}`);
            
            // Translate extras
            const translatedExtras = game.extras ? game.extras.map(extra => t(extra)).join(', ') : '';
            
            // Add language indicator
            const languageIndicator = game.englishAvailable ? '🌐 ' : '';
            
            html += `
                <div class="game-item">
                    ${imagePath ? `<img src="${imagePath}" alt="${game.name}" class="game-image" onerror="this.style.display='none'; console.error('Failed to load image: ${imagePath}')">` : ''}
                    <div class="game-info">
                        <div class="game-name">${languageIndicator}${game.name}</div>
                        <div style="font-size: 14px; color: #666; margin-top: 5px;">
                            👥 ${Math.min(...game.players)}-${Math.max(...game.players)} ${t('players')}<br>
                            ⭐ ${t('rating')}: ${game.bggRating.toFixed(1)}<br>
                            ${translatedExtras ? `🎯 ${translatedExtras}` : ''}
                        </div>
                    </div>
                    <button class="search-btn" data-game-name="${game.name}">${t('shelfButton')}</button>
                </div>
            `;
        });
        
        // Add "Show All" or "Show Less" button if needed
        if (hasMoreGames) {
            html += `<div class="button-row">`;
            if (!showingAll) {
                html += `<button id="showAllBtn" class="search-btn" style="margin-top: 15px;">${t('showAllButton')} (${totalCount})</button>`;
            } else {
                html += `<button id="showLessBtn" class="search-btn" style="margin-top: 15px;">${t('showLessButton')}</button>`;
            }
            html += `</div>`;
        }

        // Add info boxes
        if (englishOnly) {
            html += `<div class="info-box">${t('englishGamesInfo')}</div>`;
        }

        if (playerNum === 2) {
            html += `<div class="info-box">${t('twoPlayerGamesInfo')}</div>`;
        }

        if (selectedExtras.includes('award_winning')) {
            html += `<div class="info-box">${t('awardWinningInfo')}</div>`;
        }

        resultsDiv.innerHTML = html;
    }

    // Add reset button listener
    document.getElementById('resetBtn').addEventListener('click', resetSuggestionForm);

    // Add show all/less button listeners
    if (hasMoreGames) {
        const toggleBtn = document.getElementById(showingAll ? 'showLessBtn' : 'showAllBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => getSuggestions(!showingAll));
        }
    }

    // Add click listeners to shelf buttons

        document.querySelectorAll('.game-item .search-btn[data-game-name]').forEach(button => {

            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent triggering the parent click

                const gameName = this.getAttribute('data-game-name');

                console.log('Shelf button clicked for game:', gameName);

                // Fill search input with game name

                document.getElementById('searchInput').value = gameName;

                // Trigger search

                searchGames(gameName);

                // Scroll to search results

                setTimeout(() => {

                    document.getElementById('searchResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                }, 100);

            });

        });

        // Make entire game item clickable
        document.querySelectorAll('#suggestionResults .game-item').forEach(item => {
            item.style.cursor = 'pointer';
            
            item.addEventListener('click', function() {
                const button = this.querySelector('.search-btn[data-game-name]');
                if (button) {
                    const gameName = button.getAttribute('data-game-name');
                    
                    console.log('Game item clicked for game:', gameName);
                    
                    // Fill search input with game name
                    document.getElementById('searchInput').value = gameName;
                    
                    // Trigger search
                    searchGames(gameName);
                    
                    // Scroll to search results
                    setTimeout(() => {
                        document.getElementById('searchResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                }
            });
        });

    console.log('=== SUGGESTIONS COMPLETE ===');
}

// Reset suggestion form
function resetSuggestionForm() {
    console.log('Resetting suggestion form...');

    // Clear all inputs
    document.getElementById('playerCount').value = '';
    document.querySelectorAll('input[name="complexity"]').forEach(radio => radio.checked = false);
    document.getElementById('englishOnly').checked = false;
    document.querySelectorAll('input[name="extra"]').forEach(checkbox => checkbox.checked = false);

    // Show form, hide results
    document.getElementById('surveyForm').style.display = 'block';
    document.getElementById('suggestionResults').style.display = 'none';

    console.log('Form reset complete');
}

// Event listener for suggestion button
document.getElementById('suggestBtn').addEventListener('click', () => getSuggestions(false));

// Event listener for random game button
document.getElementById('randomBtn').addEventListener('click', getRandomGame);

// Get random game suggestion (excluding kids games)
function getRandomGame() {
    console.log('=== GETTING RANDOM GAME ===');
    
    // Filter out kids games
    const nonKidsGames = suggestedGames.filter(game => game.complexity !== 'kids');
    
    if (nonKidsGames.length === 0) {
        alert('No games available for random selection.');
        return;
    }
    
    // Pick a random game
    const randomIndex = Math.floor(Math.random() * nonKidsGames.length);
    const randomGame = nonKidsGames[randomIndex];
    
    console.log('Random game selected:', randomGame);
    
    // Fill search input with game name
    document.getElementById('searchInput').value = randomGame.name;
    
    // Trigger search
    searchGames(randomGame.name);
    
    // Scroll to search results
    setTimeout(() => {
        document.getElementById('searchResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// ============== PLAYER COUNT +/- BUTTONS ==============

const playerCountInput = document.getElementById('playerCount');
const decreaseBtn = document.getElementById('decreaseBtn');
const increaseBtn = document.getElementById('increaseBtn');

decreaseBtn.addEventListener('click', () => {
    let currentValue = parseInt(playerCountInput.value) || 1;
    if (currentValue > 1) {
        playerCountInput.value = currentValue - 1;
    }
});

increaseBtn.addEventListener('click', () => {
    let currentValue = parseInt(playerCountInput.value) || 0;
    if (currentValue < 30) {
        playerCountInput.value = currentValue + 1;
    }
});

// ============== AUTO-RELOAD AFTER 2 MINUTES OF INACTIVITY ==============

let inactivityTimer;
let hasInteracted = false;

function resetInactivityTimer() {
    // Only start the timer if user has interacted at least once
    if (hasInteracted) {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            console.log('No activity for 2 minutes - reloading page...');
            window.location.reload();
        }, 2 * 60 * 1000); // 2 minutes in milliseconds
    }
}

function markAsInteracted() {
    if (!hasInteracted) {
        hasInteracted = true;
        console.log('User interaction detected - auto-reload timer started');
    }
    resetInactivityTimer();
}

// Listen for various user interactions
const interactionEvents = ['click', 'touchstart', 'keypress', 'input', 'change'];
interactionEvents.forEach(eventType => {
    document.addEventListener(eventType, markAsInteracted);
});

console.log('Auto-reload system initialized - will reload after 2 minutes of inactivity (once user has interacted)');