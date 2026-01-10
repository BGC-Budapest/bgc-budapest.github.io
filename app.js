const USERNAME = 'Boardgamebudapest';
const BGG_API_TOKEN = ''; // PASTE YOUR TOKEN HERE WHEN YOU GET IT - Leave empty to use local JSON file

let gamesCollection = [];
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