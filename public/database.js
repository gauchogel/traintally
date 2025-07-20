// Database operations for Tally Train
// All Cloudflare Worker API interactions go through these functions

// Get the base URL for API calls
function getApiBaseUrl() {
    // In development, use localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8787';
    }
    // In production, use the same domain
    return window.location.origin;
}

// Create a new game
async function createGameInDatabase(gameId) {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/games?gameId=${gameId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                gameId: gameId,
                name: `Mexican Train Game ${gameId}`
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create game');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating game:', error);
        throw error;
    }
}

// Load a game by game ID
async function loadGameFromDatabase(gameId) {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/games?gameId=${gameId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null; // Game not found
            }
            const error = await response.json();
            throw new Error(error.error || 'Failed to load game');
        }

        return await response.json();
    } catch (error) {
        console.error('Error loading game:', error);
        throw error;
    }
}

// Add a player to a game
async function addPlayerToDatabase(gameId, playerName, trainColor, isOffline = false) {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/players?gameId=${gameId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: playerName,
                trainColor: trainColor,
                isOffline: isOffline
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add player');
        }

        return await response.json();
    } catch (error) {
        console.error('Error adding player:', error);
        throw error;
    }
}

// Submit scores for a round
async function submitScoresToDatabase(gameId, roundNumber, scores) {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/scores?gameId=${gameId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                roundNumber: roundNumber,
                scores: scores
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to submit scores');
        }

        return await response.json();
    } catch (error) {
        console.error('Error submitting scores:', error);
        throw error;
    }
}

// Set up WebSocket connection for real-time updates
function setupRealtimeConnection(gameId, onUpdate) {
    const wsUrl = getApiBaseUrl().replace('http', 'ws') + `/api/websocket?gameId=${gameId}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'game-update') {
                console.log('Game update received:', message.game);
                onUpdate(message.game);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Try to reconnect after a delay
        setTimeout(() => {
            setupRealtimeConnection(gameId, onUpdate);
        }, 5000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    return ws;
}

// Export functions for use in other files
window.database = {
    createGame: createGameInDatabase,
    loadGame: loadGameFromDatabase,
    addPlayer: addPlayerToDatabase,
    submitScores: submitScoresToDatabase,
    setupRealtime: setupRealtimeConnection
}; 