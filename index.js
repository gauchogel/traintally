console.log('Tally Train is starting up!');
console.log('Hello from your new Node.js application!');

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Game state storage
const games = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create a new game room
  socket.on('createGame', (callback) => {
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    games.set(gameId, {
      id: gameId,
      players: [],
      rounds: [],
      currentRound: 1,
      maxPlayers: 8
    });
    socket.join(gameId);
    callback({ gameId, game: games.get(gameId) });
    console.log(`Game ${gameId} created`);
  });

  // Join a game room
  socket.on('joinGame', ({ gameId, playerName, trainColor }, callback) => {
    const game = games.get(gameId);
    if (!game) {
      callback({ error: 'Game not found' });
      return;
    }
    
    if (game.players.length >= game.maxPlayers) {
      callback({ error: 'Game is full' });
      return;
    }

    const player = {
      id: socket.id,
      name: playerName,
      trainColor: trainColor,
      scores: []
    };

    game.players.push(player);
    socket.join(gameId);
    socket.playerId = socket.id;
    socket.gameId = gameId;
    
    io.to(gameId).emit('gameUpdate', game);
    callback({ success: true, game });
    console.log(`Player ${playerName} joined game ${gameId}`);
  });

  // Add scores for a round
  socket.on('addRoundScores', ({ gameId, roundScores }, callback) => {
    const game = games.get(gameId);
    if (!game) {
      callback({ error: 'Game not found' });
      return;
    }

    // Validate scores
    const validScores = game.players.map(player => {
      const score = roundScores.find(s => s.playerId === player.id);
      return {
        playerId: player.id,
        playerName: player.name,
        score: score ? parseInt(score.score) || 0 : 0
      };
    });

    game.rounds.push({
      roundNumber: game.currentRound,
      scores: validScores
    });

    // Update player total scores
    game.players.forEach(player => {
      const roundScore = validScores.find(s => s.playerId === player.id);
      player.scores.push(roundScore ? roundScore.score : 0);
    });

    game.currentRound++;
    
    io.to(gameId).emit('gameUpdate', game);
    callback({ success: true, game });
    console.log(`Round ${game.currentRound - 1} scores added to game ${gameId}`);
  });

  // Add another player (for offline players)
  socket.on('addOtherPlayer', ({ gameId, playerName, trainColor }, callback) => {
    console.log('addOtherPlayer called:', { gameId, playerName, trainColor });
    
    const game = games.get(gameId);
    if (!game) {
      console.log('Game not found:', gameId);
      callback({ error: 'Game not found' });
      return;
    }
    
    if (game.players.length >= game.maxPlayers) {
      console.log('Game is full:', game.players.length);
      callback({ error: 'Game is full' });
      return;
    }

    // Check if color is already taken
    const colorTaken = game.players.some(player => player.trainColor === trainColor);
    if (colorTaken) {
      console.log('Color already taken:', trainColor);
      callback({ error: 'This color is already taken' });
      return;
    }

    // Check if name is already taken
    const nameTaken = game.players.some(player => player.name.toLowerCase() === playerName.toLowerCase());
    if (nameTaken) {
      console.log('Name already taken:', playerName);
      callback({ error: 'A player with this name already exists' });
      return;
    }

    // Create offline player
    const offlinePlayer = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name: playerName,
      trainColor: trainColor,
      scores: [],
      isOffline: true
    };

    game.players.push(offlinePlayer);
    
    console.log('Offline player added successfully:', offlinePlayer);
    console.log('Total players in game:', game.players.length);
    
    io.to(gameId).emit('gameUpdate', game);
    callback({ success: true, game });
    console.log(`Offline player ${playerName} added to game ${gameId}`);
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.gameId) {
      const game = games.get(socket.gameId);
      if (game) {
        game.players = game.players.filter(p => p.id !== socket.playerId);
        if (game.players.length === 0) {
          games.delete(socket.gameId);
          console.log(`Game ${socket.gameId} deleted (no players left)`);
        } else {
          io.to(socket.gameId).emit('gameUpdate', game);
        }
      }
    }
  });
});

// API routes
app.get('/api/games/:gameId', (req, res) => {
  const game = games.get(req.params.gameId);
  if (game) {
    res.json(game);
  } else {
    res.status(404).json({ error: 'Game not found' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Mexican Train Score Tracker running at http://localhost:${PORT}/`);
}); 