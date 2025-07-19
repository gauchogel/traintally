const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON bodies
app.use(express.json());

// In-memory storage for games (for demo purposes)
const games = new Map();

// API Routes
app.get('/api/games/:gameId', (req, res) => {
    const gameId = req.params.gameId;
    const game = games.get(gameId);
    
    if (!game) {
        return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json(game);
});

app.post('/api/games', (req, res) => {
    const { gameId, playerName, trainColor } = req.body;
    
    if (!gameId || !playerName || !trainColor) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const game = {
        id: gameId,
        players: [{
            id: `player_${Date.now()}`,
            name: playerName,
            trainColor: trainColor,
            scores: [],
            isOffline: false
        }],
        rounds: [],
        createdAt: new Date().toISOString()
    };
    
    games.set(gameId, game);
    console.log(`Game ${gameId} created with player ${playerName}`);
    
    res.json(game);
});

app.post('/api/games/:gameId/players', (req, res) => {
    const gameId = req.params.gameId;
    const { playerName, trainColor } = req.body;
    
    const game = games.get(gameId);
    if (!game) {
        return res.status(404).json({ error: 'Game not found' });
    }
    
    const newPlayer = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: playerName,
        trainColor: trainColor,
        scores: [],
        isOffline: true
    };
    
    game.players.push(newPlayer);
    console.log(`Offline player ${playerName} added to game ${gameId}`);
    
    res.json(newPlayer);
});

app.post('/api/games/:gameId/scores', (req, res) => {
    const gameId = req.params.gameId;
    const { roundNumber, scores } = req.body;
    
    const game = games.get(gameId);
    if (!game) {
        return res.status(404).json({ error: 'Game not found' });
    }
    
    // Add round scores
    const round = {
        roundNumber: roundNumber,
        scores: scores,
        timestamp: new Date().toISOString()
    };
    
    game.rounds.push(round);
    
    // Update player scores
    scores.forEach(scoreEntry => {
        const player = game.players.find(p => p.id === scoreEntry.playerId);
        if (player) {
            player.scores.push(scoreEntry.score);
        }
    });
    
    console.log(`Round ${roundNumber} scores added to game ${gameId}`);
    res.json(round);
});

// Serve the main page for all routes (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Tally Train is starting up!`);
    console.log(`Mexican Train Score Tracker running at http://localhost:${PORT}/`);
}); 