// Socket.IO connection
const socket = io();

// Game state
let currentGame = null;
let scoreChart = null;

// DOM elements
const gameCreation = document.getElementById('gameCreation');
const gameSetup = document.getElementById('gameSetup');
const gameInfo = document.getElementById('gameInfo');
const playersDisplay = document.getElementById('playersDisplay');
const scoreInput = document.getElementById('scoreInput');
const chartContainer = document.getElementById('chartContainer');

// Color definitions - updated to match modern UI
const colors = {
    red: '#ef4444',
    white: '#ffffff',
    green: '#10b981',
    orange: '#f97316',
    brown: '#78716c',
    black: '#374151',
    blue: '#3b82f6',
    pink: '#ec4899',
    yellow: '#eab308'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    showMessage('Welcome to Mexican Train Score Tracker!', 'success');
    setupColorSelection();
    setupNewPlayerColorSelection();
});

// Setup color selection functionality
function setupColorSelection() {
    const colorOptions = document.querySelectorAll('.color-option');
    const joinButton = document.querySelector('#gameSetup .btn');
    
    // Initially disable the join button
    joinButton.disabled = true;
    
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            if (!this.classList.contains('disabled')) {
                // Remove selection from all options
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                // Select this option
                this.classList.add('selected');
                // Check the radio button
                const radio = this.querySelector('input[type="radio"]');
                radio.checked = true;
                
                // Enable the join button when a color is selected
                joinButton.disabled = false;
            }
        });
    });
}

// Setup new player color selection functionality
function setupNewPlayerColorSelection() {
    const newPlayerColorOptions = document.querySelectorAll('#newPlayerColorGrid .color-option');
    
    newPlayerColorOptions.forEach(option => {
        option.addEventListener('click', function() {
            if (!this.classList.contains('disabled')) {
                // Remove selection from all options
                newPlayerColorOptions.forEach(opt => opt.classList.remove('selected'));
                // Select this option
                this.classList.add('selected');
                // Check the radio button
                const radio = this.querySelector('input[type="radio"]');
                radio.checked = true;
            }
        });
    });
}

// Update available colors based on current players
function updateAvailableColors() {
    if (!currentGame) return;

    const colorOptions = document.querySelectorAll('.color-option');
    const newPlayerColorOptions = document.querySelectorAll('#newPlayerColorGrid .color-option');
    const usedColors = currentGame.players.map(player => player.trainColor);

    // Update main color selection
    colorOptions.forEach(option => {
        const color = option.getAttribute('data-color');
        const isUsed = usedColors.includes(color);
        
        if (isUsed) {
            option.classList.add('disabled');
            option.classList.remove('selected');
            const radio = option.querySelector('input[type="radio"]');
            radio.checked = false;
        } else {
            option.classList.remove('disabled');
        }
    });

    // Update new player color selection
    newPlayerColorOptions.forEach(option => {
        const color = option.getAttribute('data-color');
        const isUsed = usedColors.includes(color);
        
        if (isUsed) {
            option.classList.add('disabled');
            option.classList.remove('selected');
            const radio = option.querySelector('input[type="radio"]');
            radio.checked = false;
        } else {
            option.classList.remove('disabled');
        }
    });

    // Check if the currently selected color is still available for join button
    const joinButton = document.querySelector('#gameSetup .btn');
    const selectedColor = document.querySelector('input[name="trainColor"]:checked');
    if (selectedColor && usedColors.includes(selectedColor.value)) {
        // Selected color is no longer available, disable join button
        joinButton.disabled = true;
        // Clear the selection
        selectedColor.checked = false;
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
    }

    // Update the game status displays
    updateAvailableColorsDisplay();
    updateCurrentPlayersDisplay();
}

// Add another player (offline player)
function addOtherPlayer() {
    if (!currentGame) {
        showMessage('No active game found', 'error');
        return;
    }

    const playerName = document.getElementById('newPlayerName').value.trim();
    const selectedColor = document.querySelector('input[name="newPlayerColor"]:checked');

    if (!playerName || !selectedColor) {
        showMessage('Please enter a player name and select a color', 'error');
        return;
    }

    const trainColor = selectedColor.value;

    // Disable button while processing
    const addButton = document.getElementById('addPlayerBtn');
    const originalText = addButton.innerHTML;
    addButton.disabled = true;
    addButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    console.log('Adding player:', { gameId: currentGame.id, playerName, trainColor });

    socket.emit('addOtherPlayer', { gameId: currentGame.id, playerName, trainColor }, (response) => {
        console.log('Server response:', response);
        
        // Always re-enable button first
        addButton.disabled = false;
        addButton.innerHTML = originalText;
        
        if (response && response.success) {
            currentGame = response.game;
            // Clear the form
            document.getElementById('newPlayerName').value = '';
            document.querySelectorAll('input[name="newPlayerColor"]').forEach(radio => radio.checked = false);
            document.querySelectorAll('#newPlayerColorGrid .color-option').forEach(option => {
                option.classList.remove('selected');
            });
            showMessage(`Added ${playerName} to the game!`, 'success');
        } else {
            const errorMessage = response && response.error ? response.error : 'Failed to add player';
            showMessage(errorMessage, 'error');
        }
    });

    // Add a timeout fallback in case the callback never fires
    setTimeout(() => {
        if (addButton.disabled) {
            console.log('Timeout reached, re-enabling button');
            addButton.disabled = false;
            addButton.innerHTML = originalText;
            showMessage('Request timed out. Please try again.', 'error');
        }
    }, 10000); // 10 second timeout
}

// Toggle the add players section
function toggleAddPlayersSection() {
    const content = document.getElementById('addPlayersContent');
    const toggle = document.getElementById('addPlayersToggle');
    const isVisible = content.style.display !== 'none';
    
    if (isVisible) {
        content.style.display = 'none';
        toggle.style.transform = 'rotate(0deg)';
    } else {
        content.style.display = 'block';
        toggle.style.transform = 'rotate(180deg)';
    }
}

// Share the game
function shareGame() {
    if (!currentGame) {
        showMessage('No active game to share', 'error');
        return;
    }

    const gameUrl = `${window.location.origin}?game=${currentGame.id}`;
    
    // Try to use the Web Share API if available
    if (navigator.share) {
        navigator.share({
            title: 'Join my Mexican Train game!',
            text: `Join my Mexican Train game! Game ID: ${currentGame.id}`,
            url: gameUrl
        }).catch((error) => {
            console.log('Error sharing:', error);
            copyToClipboard(gameUrl);
        });
    } else {
        // Fallback to copying to clipboard
        copyToClipboard(gameUrl);
    }
}

// Copy text to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showMessage('Game link copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

// Fallback copy method for older browsers
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showMessage('Game link copied to clipboard!', 'success');
    } catch (err) {
        showMessage('Failed to copy link. Please copy manually: ' + text, 'error');
    }
    
    document.body.removeChild(textArea);
}

// Create a new game
function createGame() {
    socket.emit('createGame', (response) => {
        if (response.gameId) {
            currentGame = response.game;
            document.getElementById('currentGameId').textContent = response.gameId;
            document.getElementById('gameIdInput').value = response.gameId;
            
            showGameSetup();
            showMessage(`Game created! Share this Game ID: ${response.gameId}`, 'success');
        }
    });
}

// Join an existing game from main page
function joinExistingGame() {
    const gameId = document.getElementById('mainGameIdInput').value.trim();
    
    if (!gameId) {
        showMessage('Please enter a Game ID', 'error');
        return;
    }

    // Pre-fill the game ID in the setup form
    document.getElementById('gameIdInput').value = gameId;
    document.getElementById('currentGameId').textContent = gameId;
    
    // Show the game setup form
    showGameSetup();
    
    // Clear the main page input
    document.getElementById('mainGameIdInput').value = '';
}

// Join an existing game
function joinGame() {
    const gameId = document.getElementById('gameIdInput').value.trim();
    const playerName = document.getElementById('playerNameInput').value.trim();
    const selectedColor = document.querySelector('input[name="trainColor"]:checked');

    if (!gameId || !playerName || !selectedColor) {
        showMessage('Please fill in all fields and select a train color', 'error');
        return;
    }

    const trainColor = selectedColor.value;

    socket.emit('joinGame', { gameId, playerName, trainColor }, (response) => {
        if (response.success) {
            currentGame = response.game;
            document.getElementById('currentGameId').textContent = gameId;
            showGameInProgress();
            showMessage(`Successfully joined game ${gameId}!`, 'success');
        } else {
            showMessage(response.error || 'Failed to join game', 'error');
        }
    });
}

// Submit scores for the current round
function submitScores() {
    if (!currentGame) return;

    const scoreInputs = document.querySelectorAll('#scoreInputGrid input');
    const roundScores = [];

    scoreInputs.forEach(input => {
        const playerId = input.getAttribute('data-player-id');
        const score = parseInt(input.value) || 0;
        roundScores.push({ playerId, score });
    });

    socket.emit('addRoundScores', { gameId: currentGame.id, roundScores }, (response) => {
        if (response.success) {
            currentGame = response.game;
            updateScoreInputs();
            updateChart();
            showMessage('Round scores submitted successfully!', 'success');
        } else {
            showMessage(response.error || 'Failed to submit scores', 'error');
        }
    });
}

// Show game setup interface
function showGameSetup() {
    gameCreation.style.display = 'none';
    gameSetup.classList.add('active');
    gameInfo.classList.add('active');
}

// Show game in progress interface
function showGameInProgress() {
    gameCreation.style.display = 'none';
    gameSetup.classList.remove('active');
    gameInfo.classList.add('active');
    playersDisplay.classList.add('active');
    scoreInput.classList.add('active');
    chartContainer.classList.add('active');
    document.getElementById('gameStatus').classList.add('active');
}

// Update the players display
function updatePlayersDisplay() {
    if (!currentGame) return;

    const playersGrid = document.getElementById('playersGrid');
    const playerCount = document.getElementById('playerCount');
    
    playerCount.textContent = currentGame.players.length;
    
    playersGrid.innerHTML = '';
    
    currentGame.players.forEach(player => {
        const totalScore = player.scores.reduce((sum, score) => sum + score, 0);
        const playerCard = document.createElement('div');
        playerCard.className = `player-card ${player.trainColor}`;
        
        const offlineBadge = player.isOffline ? '<span style="background: #6b7280; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin-left: 8px;">Offline</span>' : '';
        
        playerCard.innerHTML = `
            <div class="player-name">
                ${player.name}
                ${offlineBadge}
            </div>
            <div class="player-score">Total: ${totalScore}</div>
        `;
        playersGrid.appendChild(playerCard);
    });

    // Update the game status displays
    updateAvailableColorsDisplay();
    updateCurrentPlayersDisplay();
}

// Update available colors display
function updateAvailableColorsDisplay() {
    if (!currentGame) return;

    const availableColorsGrid = document.getElementById('availableColorsGrid');
    const usedColors = currentGame.players.map(player => player.trainColor);
    
    availableColorsGrid.innerHTML = '';
    
    Object.entries(colors).forEach(([colorName, colorValue]) => {
        const isAvailable = !usedColors.includes(colorName);
        const colorItem = document.createElement('div');
        colorItem.className = `available-color-item ${isAvailable ? 'available' : 'taken'}`;
        
        colorItem.innerHTML = `
            <div class="available-color-dot" style="background-color: ${colorValue};"></div>
            <span>${colorName.charAt(0).toUpperCase() + colorName.slice(1)}</span>
        `;
        
        availableColorsGrid.appendChild(colorItem);
    });
}

// Update current players display
function updateCurrentPlayersDisplay() {
    if (!currentGame) return;

    const currentPlayersList = document.getElementById('currentPlayersList');
    
    currentPlayersList.innerHTML = '';
    
    if (currentGame.players.length === 0) {
        currentPlayersList.innerHTML = '<p style="color: #6b7280; font-style: italic;">No players yet</p>';
        return;
    }
    
    currentGame.players.forEach(player => {
        const totalScore = player.scores.reduce((sum, score) => sum + score, 0);
        const playerItem = document.createElement('div');
        playerItem.className = 'current-player-item';
        
        const status = player.isOffline ? 'Offline' : 'Online';
        
        playerItem.innerHTML = `
            <div class="current-player-color" style="background-color: ${colors[player.trainColor]};"></div>
            <div class="current-player-info">
                <div class="current-player-name">${player.name}</div>
                <div class="current-player-status">${status}</div>
            </div>
            <div class="current-player-score">${totalScore}</div>
        `;
        
        currentPlayersList.appendChild(playerItem);
    });
}

// Update score input fields
function updateScoreInputs() {
    if (!currentGame || currentGame.players.length === 0) return;

    const scoreInputGrid = document.getElementById('scoreInputGrid');
    const currentRound = document.getElementById('currentRound');
    const roundDisplay = document.getElementById('roundDisplay');
    
    currentRound.textContent = currentGame.currentRound;
    roundDisplay.textContent = currentGame.currentRound;
    
    scoreInputGrid.innerHTML = '';
    
    currentGame.players.forEach(player => {
        const scoreGroup = document.createElement('div');
        scoreGroup.className = 'score-input-group';
        scoreGroup.innerHTML = `
            <label for="score-${player.id}">${player.name} (${player.trainColor})</label>
            <input type="number" id="score-${player.id}" data-player-id="${player.id}" 
                   placeholder="Enter score" min="0" value="0">
        `;
        scoreInputGrid.appendChild(scoreGroup);
    });
}

// Update the chart
function updateChart() {
    if (!currentGame || currentGame.players.length === 0) return;

    const ctx = document.getElementById('scoreChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (scoreChart) {
        scoreChart.destroy();
    }

    // Prepare data for horizontal bar chart
    const datasets = [];
    const labels = currentGame.players.map(player => player.name);

    // Create datasets for each round
    currentGame.rounds.forEach((round, roundIndex) => {
        const roundData = currentGame.players.map(player => {
            const roundScore = round.scores.find(s => s.playerId === player.id);
            return roundScore ? roundScore.score : 0;
        });

        datasets.push({
            label: `Round ${round.roundNumber}`,
            data: roundData,
            backgroundColor: colors[Object.keys(colors)[roundIndex % Object.keys(colors).length]] || '#6b7280',
            borderColor: colors[Object.keys(colors)[roundIndex % Object.keys(colors).length]] || '#6b7280',
            borderWidth: 1
        });
    });

    scoreChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            indexAxis: 'y', // This makes it a horizontal bar chart
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Score'
                    },
                    reverse: true // Lower scores are better in Mexican Train
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Players'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Mexican Train Scores by Player and Round'
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Show message to user
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = type;
    messageDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Socket event listeners
socket.on('gameUpdate', (game) => {
    currentGame = game;
    updatePlayersDisplay();
    updateScoreInputs();
    updateChart();
    updateAvailableColors();
});

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    showMessage('Connection lost. Please refresh the page.', 'error');
});

// Auto-fill game ID from URL parameters
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    if (gameId) {
        document.getElementById('mainGameIdInput').value = gameId;
        document.getElementById('gameIdInput').value = gameId;
    }
}); 