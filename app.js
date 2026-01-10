const USERNAME = 'Boardgamebudapest';
let gamesCollection = [];
let isLoading = false;

// Function to fetch and parse BGG collection
async function fetchCollection() {
    console.log('=== STARTING COLLECTION FETCH ===');
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '<div class="loading">Gyűjtemény betöltése... / Loading collection...</div>';
    
    try {
        // Try different API endpoint variations
        const urls = [
            `https://boardgamegeek.com/xmlapi2/collection?username=${USERNAME}`,
            `https://www.boardgamegeek.com/xmlapi2/collection?username=${USERNAME}`,
            `https://api.geekdo.com/xmlapi2/collection?username=${USERNAME}`,
        ];
        
        let lastError = null;
        
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            console.log(`\nAttempt ${i + 1}/${urls.length}`);
            console.log('Fetching URL:', url);
            
            try {
                console.log('Sending fetch request...');
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/xml, text/xml, */*'
                    }
                });
                
                console.log('Response received:', response);
                console.log('Response status:', response.status);
                console.log('Response ok:', response.ok);
                console.log('Response headers:', [...response.headers.entries()]);
                
                // BGG API returns 202 when collection is being queued
                if (response.status === 202) {
                    console.log('Got 202 - Collection is being queued, will retry...');
                    resultsDiv.innerHTML = '<div class="loading">A gyűjtemény feldolgozás alatt... Újrapróbálkozás 3 másodperc múlva... / Collection is being processed... Retrying in 3 seconds...</div>';
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    return fetchCollection(); // Retry
                }
                
                if (!response.ok) {
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
                console.log('XML parsed, document:', xmlDoc);
                
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
                    console.warn('No items found in XML, trying next URL...');
                    throw new Error('No items found');
                }
                
                gamesCollection = Array.from(items).map((item, index) => {
                    const name = item.querySelector('name')?.textContent || 'Unknown';
                    const objectid = item.getAttribute('objectid');
                    const comment = item.querySelector('comment');
                    const shelf = comment ? comment.textContent.trim() : '';
                    
                    if (index < 3) {
                        console.log(`Game ${index}:`, { name, objectid, shelf });
                    }
                    
                    return { name, objectid, shelf };
                });
                
                console.log('Total games loaded:', gamesCollection.length);
                console.log('Sample games:', gamesCollection.slice(0, 3));
                
                resultsDiv.innerHTML = `<div style="color: green;">✓ ${gamesCollection.length} játék betöltve / games loaded</div>`;
                console.log('=== COLLECTION FETCH COMPLETE ===');
                return; // Success! Exit the loop
                
            } catch (error) {
                console.error(`Error with URL ${i + 1}:`, error.message);
                lastError = error;
                // Continue to next URL
            }
        }
        
        // If we get here, all URLs failed
        throw lastError || new Error('All API endpoints failed');
        
    } catch (error) {
        console.error('=== ERROR DURING FETCH ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', error);
        
        resultsDiv.innerHTML = `
            <div class="error">
                <strong>Hiba a gyűjtemény betöltésekor / Error loading collection</strong><br>
                ${error.message}<br><br>
                <small>Próbáld meg újratölteni az oldalt / Try reloading the page</small>
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
fetchCollection();