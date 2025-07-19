// Game state
let currentGame = null;
let currentPlayer = null;

// Train colors
const trainColors = ['red', 'white', 'green', 'orange', 'brown', 'black', 'blue', 'pink', 'yellow'];

// DOM elements
const createGameForm = document.getElementById('createGameForm');
const joinGameForm = document.getElementById('joinGameForm');
const gameSetupForm = document.getElementById('gameSetupForm');
const scoreInputForm = document.getElementById('scoreInputForm');
const gameStatusSection = document.getElementById('gameStatusSection');
const scoreChartSection = document.getElementById('scoreChartSection');
const addPlayerSection = document.getElementById('addPlayerSection');
const gameIdDisplay = document.getElementById('gameIdDisplay');
const shareButton = document.getElementById('shareButton');
const joinExistingForm = document.getElementById('joinExistingForm');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check for game ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    
    if (gameId) {
        document.getElementById('joinGameId').value = gameId;
        document.getElementById('existingGameId').value = gameId;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize chart
    initializeChart();
});

function setupEventListeners() {
    // Create game form
    createGameForm.addEventListener('submit', handleCreateGame);
    
    // Join game form
    joinGameForm.addEventListener('submit', handleJoinGame);
    
    // Join existing game form
    joinExistingForm.addEventListener('submit', handleJoinExistingGame);
    
    // Game setup form
    gameSetupForm.addEventListener('submit', handleGameSetup);
    
    // Score input form
    scoreInputForm.addEventListener('submit', handleScoreSubmit);
    
    // Add player form
    document.getElementById('addPlayerForm').addEventListener('submit', handleAddPlayer);
    
    // Collapsible sections
    document.getElementById('addPlayerToggle').addEventListener('click', toggleAddPlayerSection);
    
    // Share button
    shareButton.addEventListener('click', shareGame);
    
    // Color selection
    setupColorSelection();
}

function setupColorSelection() {
    const colorButtons = document.querySelectorAll('.color-option');
    colorButtons.forEach(button => {
        button.addEventListener('click', function() {
            const color = this.dataset.color;
            selectColor(color);
        });
    });
}

function selectColor(color) {
    // Remove previous selection
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.remove('selected');
        btn.disabled = false;
    });
    
    // Select new color
    const selectedButton = document.querySelector(`[data-color="${color}"]`);
    selectedButton.classList.add('selected');
    
    // Disable taken colors
    if (currentGame) {
        currentGame.players.forEach(player => {
            const colorBtn = document.querySelector(`[data-color="${player.trainColor}"]`);
            if (colorBtn && player.trainColor !== color) {
                colorBtn.disabled = true;
            }
        });
    }
    
    // Enable join button if color is selected
    const joinButton = document.querySelector('#joinGameForm button[type="submit"]');
    if (joinButton) {
        joinButton.disabled = false;
    }
}

async function handleCreateGame(e) {
    e.preventDefault();
    
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
        const response = await fetch('/api/games', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                gameId: gameId,
                playerName: 'Host',
                trainColor: 'red'
            })
        });
        
        if (response.ok) {
            currentGame = await response.json();
            currentPlayer = currentGame.players[0];
            
            showGameSetup();
            updateGameStatus();
        } else {
            alert('Failed to create game');
        }
    } catch (error) {
        console.error('Error creating game:', error);
        alert('Failed to create game');
    }
}

async function handleJoinGame(e) {
    e.preventDefault();
    
    const gameId = document.getElementById('joinGameId').value.trim();
    const playerName = document.getElementById('joinPlayerName').value.trim();
    const selectedColor = document.querySelector('.color-option.selected');
    
    if (!selectedColor) {
        alert('Please select a train color');
        return;
    }
    
    const trainColor = selectedColor.dataset.color;
    
    try {
        // First, get the game to check if it exists
        const getResponse = await fetch(`/api/games/${gameId}`);
        if (!getResponse.ok) {
            alert('Game not found');
            return;
        }
        
        currentGame = await getResponse.json();
        
        // Add the player to the game
        const addResponse = await fetch(`/api/games/${gameId}/players`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                playerName: playerName,
                trainColor: trainColor
            })
        });
        
        if (addResponse.ok) {
            const newPlayer = await addResponse.json();
            currentPlayer = newPlayer;
            currentGame.players.push(newPlayer);
            
            showGameSetup();
            updateGameStatus();
        } else {
            alert('Failed to join game');
        }
    } catch (error) {
        console.error('Error joining game:', error);
        alert('Failed to join game');
    }
}

async function handleJoinExistingGame(e) {
    e.preventDefault();
    
    const gameId = document.getElementById('existingGameId').value.trim();
    
    if (!gameId) {
        alert('Please enter a game ID');
        return;
    }
    
    try {
        const response = await fetch(`/api/games/${gameId}`);
        if (response.ok) {
            currentGame = await response.json();
            showGameSetup();
            updateGameStatus();
        } else {
            alert('Game not found');
        }
    } catch (error) {
        console.error('Error joining existing game:', error);
        alert('Failed to join game');
    }
}

async function handleGameSetup(e) {
    e.preventDefault();
    
    const playerName = document.getElementById('setupPlayerName').value.trim();
    const selectedColor = document.querySelector('.color-option.selected');
    
    if (!selectedColor) {
        alert('Please select a train color');
        return;
    }
    
    const trainColor = selectedColor.dataset.color;
    
    if (!currentGame) {
        alert('No game found');
        return;
    }
    
    // Update current player info
    currentPlayer = {
        id: `player_${Date.now()}`,
        name: playerName,
        trainColor: trainColor,
        scores: [],
        isOffline: false
    };
    
    // Update the first player in the game
    currentGame.players[0] = currentPlayer;
    
    showGameInterface();
    updateGameStatus();
}

async function handleAddPlayer(e) {
    e.preventDefault();
    
    const playerName = document.getElementById('addPlayerName').value.trim();
    const selectedColor = document.querySelector('.color-option.selected');
    
    if (!selectedColor) {
        alert('Please select a train color');
        return;
    }
    
    const trainColor = selectedColor.dataset.color;
    
    if (!currentGame) {
        alert('No game found');
        return;
    }
    
    try {
        const response = await fetch(`/api/games/${currentGame.id}/players`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                playerName: playerName,
                trainColor: trainColor
            })
        });
        
        if (response.ok) {
            const newPlayer = await response.json();
            currentGame.players.push(newPlayer);
            
            // Clear form
            document.getElementById('addPlayerName').value = '';
            document.querySelector('.color-option.selected')?.classList.remove('selected');
            
            updateGameStatus();
            updateScoreInputForm();
        } else {
            alert('Failed to add player');
        }
    } catch (error) {
        console.error('Error adding player:', error);
        alert('Failed to add player');
    }
}

async function handleScoreSubmit(e) {
    e.preventDefault();
    
    if (!currentGame) {
        alert('No game found');
        return;
    }
    
    const roundNumber = currentGame.rounds.length + 1;
    const scores = [];
    
    currentGame.players.forEach(player => {
        const scoreInput = document.getElementById(`score-${player.id}`);
        const score = parseInt(scoreInput.value) || 0;
        scores.push({
            playerId: player.id,
            playerName: player.name,
            score: score
        });
    });
    
    try {
        const response = await fetch(`/api/games/${currentGame.id}/scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                roundNumber: roundNumber,
                scores: scores
            })
        });
        
        if (response.ok) {
            const round = await response.json();
            currentGame.rounds.push(round);
            
            // Update player scores
            scores.forEach(scoreEntry => {
                const player = currentGame.players.find(p => p.id === scoreEntry.playerId);
                if (player) {
                    player.scores.push(scoreEntry.score);
                }
            });
            
            // Clear form
            currentGame.players.forEach(player => {
                const scoreInput = document.getElementById(`score-${player.id}`);
                if (scoreInput) scoreInput.value = '';
            });
            
            updateScoreChart();
            updateGameStatus();
        } else {
            alert('Failed to submit scores');
        }
    } catch (error) {
        console.error('Error submitting scores:', error);
        alert('Failed to submit scores');
    }
}

function showGameSetup() {
    document.getElementById('mainPage').style.display = 'none';
    document.getElementById('gameSetup').style.display = 'block';
    document.getElementById('gameInterface').style.display = 'none';
    
    // Auto-fill game ID
    document.getElementById('setupGameId').value = currentGame.id;
    
    // Update available colors
    updateAvailableColors();
}

function showGameInterface() {
    document.getElementById('mainPage').style.display = 'none';
    document.getElementById('gameSetup').style.display = 'none';
    document.getElementById('gameInterface').style.display = 'block';
    
    // Update game ID display
    gameIdDisplay.textContent = currentGame.id;
    
    // Update forms and charts
    updateScoreInputForm();
    updateScoreChart();
    updateGameStatus();
}

function updateAvailableColors() {
    const takenColors = currentGame ? currentGame.players.map(p => p.trainColor) : [];
    
    document.querySelectorAll('.color-option').forEach(button => {
        const color = button.dataset.color;
        if (takenColors.includes(color)) {
            button.disabled = true;
            button.classList.add('taken');
        } else {
            button.disabled = false;
            button.classList.remove('taken');
        }
    });
}

function updateScoreInputForm() {
    const scoreInputs = document.getElementById('scoreInputs');
    scoreInputs.innerHTML = '';
    
    if (!currentGame) return;
    
    currentGame.players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'score-input-row';
        playerDiv.innerHTML = `
            <label for="score-${player.id}">
                <span class="color-dot ${player.trainColor}"></span>
                ${player.name}:
            </label>
            <input type="number" id="score-${player.id}" name="score-${player.id}" 
                   placeholder="Enter score" min="0" required>
        `;
        scoreInputs.appendChild(playerDiv);
    });
}

function updateScoreChart() {
    if (!currentGame || !currentGame.players.length) return;
    
    const ctx = document.getElementById('scoreChart').getContext('2d');
    
    // Destroy existing chart
    if (window.scoreChart) {
        window.scoreChart.destroy();
    }
    
    // Prepare data for horizontal bar chart
    const labels = currentGame.players.map(player => player.name);
    const datasets = [];
    
    // Create a dataset for each round
    currentGame.rounds.forEach((round, roundIndex) => {
        const roundData = currentGame.players.map(player => {
            const scoreEntry = round.scores.find(s => s.playerId === player.id);
            return scoreEntry ? scoreEntry.score : 0;
        });
        
        datasets.push({
            label: `Round ${round.roundNumber}`,
            data: roundData,
            backgroundColor: getColorForRound(roundIndex),
            borderColor: getColorForRound(roundIndex),
            borderWidth: 1
        });
    });
    
    // Create horizontal bar chart
    window.scoreChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Mexican Train Scores by Round'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Score'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Players'
                    }
                }
            }
        }
    });
}

function getColorForRound(roundIndex) {
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];
    return colors[roundIndex % colors.length];
}

function updateGameStatus() {
    if (!currentGame) return;
    
    const availableColors = trainColors.filter(color => 
        !currentGame.players.some(player => player.trainColor === color)
    );
    
    const playersList = currentGame.players.map(player => 
        `<span class="color-dot ${player.trainColor}"></span> ${player.name}`
    ).join(', ');
    
    document.getElementById('availableColors').textContent = availableColors.join(', ');
    document.getElementById('currentPlayers').innerHTML = playersList;
}

function toggleAddPlayerSection() {
    const section = document.getElementById('addPlayerSection');
    const toggle = document.getElementById('addPlayerToggle');
    
    if (section.style.display === 'none' || !section.style.display) {
        section.style.display = 'block';
        toggle.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Add Player';
    } else {
        section.style.display = 'none';
        toggle.innerHTML = '<i class="fas fa-chevron-down"></i> Add Another Player';
    }
}

function shareGame() {
    const gameUrl = `${window.location.origin}?game=${currentGame.id}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Join my Mexican Train game!',
            text: `Join my Mexican Train game with ID: ${currentGame.id}`,
            url: gameUrl
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(gameUrl).then(() => {
            alert('Game link copied to clipboard!');
        });
    } else {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = gameUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Game link copied to clipboard!');
    }
}

function initializeChart() {
    const ctx = document.getElementById('scoreChart').getContext('2d');
    window.scoreChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Mexican Train Scores by Round'
                }
            }
        }
    });
} 