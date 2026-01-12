const USERNAME = 'Boardgamebudapest';
const BGG_API_TOKEN = ''; // PASTE YOUR TOKEN HERE WHEN YOU GET IT - Leave empty to use local JSON file

let gamesCollection = [];
let suggestedGames = []; // Will store the curated game suggestions
let isLoading = false;

// Main function to fetch collection - uses API if token is available, otherwise loads from JSON
async function fetchCollection() {
    console.log('=== STARTING COLLECTION FETCH ===');
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '<div class="loading">Gyűjtemény betöltése... / Loading collection...</div>';
    
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
            resultsDiv.innerHTML = '<div class="loading">A gyűjtemény feldolgozás alatt... Újrapróbálkozás 3 másodperc múlva... / Collection is being processed... Retrying in 3 seconds...</div>';
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
                ✓ ${gamesCollection.length} játék betöltve (BGG API) / games loaded (BGG API)<br>
                <small>${gamesCollection.filter(g => g.shelf).length} játéknak van polc információja / games have shelf info</small>
            </div>
        `;
        console.log('=== COLLECTION FETCH FROM API COMPLETE ===');
        
    } catch (error) {
        console.error('=== ERROR DURING API FETCH ===');
        console.error('Error:', error);
        
        resultsDiv.innerHTML = `
            <div class="error">
                <strong>Hiba a BGG API-ból való betöltéskor / Error loading from BGG API</strong><br>
                ${error.message}<br><br>
                <small>Ellenőrizd a Bearer tokent vagy próbáld újra! / Check your Bearer token or try again!</small><br>
                <small>Ha a probléma továbbra is fennáll, távolítsd el a tokent a kódból, hogy a helyi JSON fájlt használja.</small><br>
                <small>If the problem persists, remove the token from the code to use the local JSON file.</small>
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
                ✓ ${gamesCollection.length} játék betöltve (Helyi fájl) / games loaded (Local file)<br>
                <small>${gamesCollection.filter(g => g.shelf).length} játéknak van polc információja / games have shelf info</small><br>
                <small style="color: #666;">💡 Tipp: Add hozzá a BGG API tokent az élő adatokért / Tip: Add BGG API token for live data</small>
            </div>
        `;
        console.log('=== COLLECTION LOAD FROM JSON COMPLETE ===');
        
    } catch (error) {
        console.error('=== ERROR LOADING JSON ===');
        console.error('Error:', error);
        
        resultsDiv.innerHTML = `
            <div class="error">
                <strong>Hiba a gyűjtemény betöltésekor / Error loading collection</strong><br>
                ${error.message}<br><br>
                <strong>Megoldás / Solution:</strong><br>
                1. Győződj meg róla, hogy a <code>games.json</code> fájl létezik a projekt gyökérkönyvtárában<br>
                   Make sure <code>games.json</code> file exists in the project root<br><br>
                2. Exportáld a BGG gyűjteményt CSV formátumban:<br>
                   Export your BGG collection as CSV:<br>
                   <a href="https://boardgamegeek.com/collection/user/${USERNAME}?exportcsv=1" target="_blank">
                   Kattints ide a CSV letöltéséhez / Click here to download CSV
                   </a><br><br>
                3. Használd a konvertert a CSV → JSON átalakításhoz<br>
                   Use the converter to convert CSV → JSON<br><br>
                <strong>VAGY / OR:</strong><br>
                Regisztrálj BGG API tokenért: <a href="https://boardgamegeek.com/applications" target="_blank">boardgamegeek.com/applications</a>
            </div>
        `;
    }
}

// Function to search games
function searchGames(query) {
    console.log('=== SEARCHING FOR:', query, '===');
    const resultsDiv = document.getElementById('searchResults');
    
    if (!query.trim()) {
        console.log('Empty query, showing error');
        resultsDiv.innerHTML = '<div class="error">Kérlek írj be egy játék nevet! / Please enter a game name!</div>';
        return;
    }
    
    if (gamesCollection.length === 0) {
        console.log('Collection not loaded yet');
        resultsDiv.innerHTML = '<div class="error">Gyűjtemény még betöltés alatt... / Collection still loading...</div>';
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
    
    // Display results
    if (matches.length === 0) {
        resultsDiv.innerHTML = '<div class="error">Nem találtunk ilyen játékot. / No game found.</div>';
    } else {
        let html = `<div><strong>${matches.length} találat / match(es):</strong></div>`;
        matches.forEach(game => {
            html += `
                <div class="game-item">
                    <div class="game-name">${game.name}</div>
                    ${game.shelf ? 
                        `<div class="shelf-info">📍 Polc / Shelf: ${game.shelf}</div>` : 
                        '<div style="color: #999;">Nincs polc információ / No shelf info</div>'
                    }
                </div>
            `;
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

// Load collection on page load
console.log('Page loaded, starting collection fetch...');
console.log('BGG_API_TOKEN configured:', BGG_API_TOKEN ? 'Yes' : 'No (using local JSON)');
fetchCollection();

// Load suggested games on page load
loadSuggestedGames();

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
function getSuggestions() {
    console.log('=== GETTING SUGGESTIONS ===');
    const resultsDiv = document.getElementById('suggestionResults');
    
    // Get user inputs
    const playerCount = document.getElementById('playerCount').value;
    const selectedTypes = Array.from(document.querySelectorAll('input[name="type"]:checked')).map(cb => cb.value);
    const complexity = document.getElementById('complexity').value;
    const selectedTimes = Array.from(document.querySelectorAll('input[name="time"]:checked')).map(cb => cb.value);
    
    console.log('User preferences:', { playerCount, selectedTypes, complexity, selectedTimes });
    
    // Validation
    if (!playerCount) {
        resultsDiv.innerHTML = '<div class="error">Kérlek válaszd ki, hányan játszotok! / Please select player count!</div>';
        return;
    }
    
    if (selectedTypes.length === 0) {
        resultsDiv.innerHTML = '<div class="error">Kérlek válassz legalább egy játéktípust! / Please select at least one game type!</div>';
        return;
    }
    
    if (!complexity) {
        resultsDiv.innerHTML = '<div class="error">Kérlek válaszd ki a bonyolultságot! / Please select complexity!</div>';
        return;
    }
    
    if (selectedTimes.length === 0) {
        resultsDiv.innerHTML = '<div class="error">Kérlek válassz legalább egy időtartamot! / Please select at least one time option!</div>';
        return;
    }
    
    // Check if suggested games are loaded
    if (suggestedGames.length === 0) {
        resultsDiv.innerHTML = `
            <div class="error">
                A javasolt játékok adatbázisa még nem töltődött be. / Suggested games database not loaded yet.<br>
                <small>Ellenőrizd, hogy a suggested-games.json fájl létezik-e! / Check if suggested-games.json exists!</small>
            </div>
        `;
        return;
    }
    
    // Score and filter games
    const playerNum = parseInt(playerCount);
    
    // Validate player number
    if (isNaN(playerNum) || playerNum < 1 || playerNum > 30) {
        resultsDiv.innerHTML = '<div class="error">Kérlek adj meg egy érvényes játékosszámot (1-30)! / Please enter a valid player count (1-30)!</div>';
        return;
    }
    
    const scoredGames = suggestedGames.map(game => {
        let score = 0;
        
        // Player count match (must match)
        const supportsPlayerCount = game.players.includes(playerNum);
        if (!supportsPlayerCount) return null;
        
        // Type match (at least one type must match)
        const typeMatches = selectedTypes.filter(t => game.type.includes(t)).length;
        if (typeMatches === 0) return null;
        score += typeMatches * 10; // 10 points per matching type
        
        // Complexity match (exact match preferred)
        if (game.complexity === complexity) {
            score += 20;
        } else {
            return null; // Complexity must match exactly
        }
        
        // Time match (at least one time must match)
        const timeMatches = selectedTimes.filter(t => game.time.includes(t)).length;
        if (timeMatches === 0) return null;
        score += timeMatches * 5; // 5 points per matching time
        
        return { ...game, score };
    }).filter(g => g !== null);
    
    console.log('Scored games:', scoredGames);
    
    // Sort by score (highest first) and take top 5
    const topGames = scoredGames
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    
    console.log('Top suggestions:', topGames);
    
    // Display results
    if (topGames.length === 0) {
        resultsDiv.innerHTML = `
            <div class="error">
                Sajnos nem találtunk megfelelő játékot ezekkel a beállításokkal. 😔<br>
                Unfortunately, we couldn't find a matching game with these settings. 😔<br><br>
                <small>Próbálj meg más beállításokat! / Try different settings!</small>
            </div>
        `;
    } else {
        console.log('Displaying top games with images...');
        let html = `<div><strong>Javasolt játékok / Suggested games (${topGames.length}):</strong></div>`;
        topGames.forEach(game => {
            const imagePath = game.image ? `img/${game.image}` : '';
            console.log(`Game: ${game.name}, Image path: ${imagePath || 'No image'}`);
            html += `
                <div class="game-item">
                    ${imagePath ? `<img src="${imagePath}" alt="${game.name}" class="game-image" onerror="this.style.display='none'; console.error('Failed to load image: ${imagePath}')">` : ''}
                    <div class="game-info">
                        <div class="game-name">${game.name}</div>
                        <div style="font-size: 14px; color: #666; margin-top: 5px;">
                            👥 ${Math.min(...game.players)}-${Math.max(...game.players)} játékos / players<br>
                            🎮 ${game.type.join(', ')}<br>
                            ⏱️ ${game.time.join(', ')}
                        </div>
                    </div>
                </div>
            `;
        });
        resultsDiv.innerHTML = html;
    }
    
    console.log('=== SUGGESTIONS COMPLETE ===');
}

// Event listener for suggestion button
document.getElementById('suggestBtn').addEventListener('click', getSuggestions);

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