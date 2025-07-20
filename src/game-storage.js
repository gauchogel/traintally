export class GameStorage {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.game = null;
    this.connections = new Set();
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case '/get-game':
          return this.getGame();
        case '/create-game':
          return this.createGame(request);
        case '/add-player':
          return this.addPlayer(request);
        case '/submit-scores':
          return this.submitScores(request);
        case '/websocket':
          return this.handleWebSocket(request);
        default:
          return new Response('Not found', { status: 404 });
      }
    } catch (error) {
      console.error('GameStorage Error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async getGame() {
    // Load game from storage
    const storedGame = await this.state.storage.get('game');
    
    if (!storedGame) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(storedGame), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async createGame(request) {
    const body = await request.json();
    const { gameId, name } = body;

    // Check if game already exists
    const existingGame = await this.state.storage.get('game');
    if (existingGame) {
      return new Response(JSON.stringify({ error: 'Game already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create new game
    this.game = {
      id: gameId,
      name: name || `Mexican Train Game ${gameId}`,
      players: [],
      rounds: [],
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // Save to storage
    await this.state.storage.put('game', this.game);

    return new Response(JSON.stringify(this.game), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async addPlayer(request) {
    const body = await request.json();
    const { name, trainColor, isOffline = false } = body;

    // Load game if not in memory
    if (!this.game) {
      this.game = await this.state.storage.get('game');
      if (!this.game) {
        return new Response(JSON.stringify({ error: 'Game not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Check if name already exists
    if (this.game.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'A player with this name already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if color is already taken
    if (this.game.players.some(p => p.trainColor === trainColor)) {
      return new Response(JSON.stringify({ error: 'This color is already taken' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add player
    const newPlayer = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: name,
      trainColor: trainColor,
      scores: [],
      isOffline: isOffline,
      createdAt: new Date().toISOString()
    };

    this.game.players.push(newPlayer);

    // Save to storage
    await this.state.storage.put('game', this.game);

    // Notify connected clients
    this.broadcastUpdate();

    return new Response(JSON.stringify(newPlayer), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async submitScores(request) {
    const body = await request.json();
    const { roundNumber, scores } = body;

    // Load game if not in memory
    if (!this.game) {
      this.game = await this.state.storage.get('game');
      if (!this.game) {
        return new Response(JSON.stringify({ error: 'Game not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Create round
    const round = {
      roundNumber: roundNumber,
      scores: scores,
      timestamp: new Date().toISOString()
    };

    this.game.rounds.push(round);

    // Update player scores
    scores.forEach(scoreEntry => {
      const player = this.game.players.find(p => p.id === scoreEntry.playerId);
      if (player) {
        player.scores.push(scoreEntry.score);
      }
    });

    // Save to storage
    await this.state.storage.put('game', this.game);

    // Notify connected clients
    this.broadcastUpdate();

    return new Response(JSON.stringify(round), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async handleWebSocket(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();

    // Add to connections
    this.connections.add(server);

    // Send current game state
    if (this.game) {
      server.send(JSON.stringify({
        type: 'game-update',
        game: this.game
      }));
    }

    // Handle messages
    server.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'ping':
            server.send(JSON.stringify({ type: 'pong' }));
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    // Handle close
    server.addEventListener('close', () => {
      this.connections.delete(server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  broadcastUpdate() {
    if (!this.game) return;

    const message = JSON.stringify({
      type: 'game-update',
      game: this.game
    });

    this.connections.forEach(connection => {
      try {
        connection.send(message);
      } catch (error) {
        console.error('Error broadcasting update:', error);
        this.connections.delete(connection);
      }
    });
  }
} 