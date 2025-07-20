// Theme management
let currentTheme = localStorage.getItem('theme') || 'system';

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
    // Initialize theme
    initializeTheme();
    
    // Initialize version display
    initializeVersion();
    
    // Check for game ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    
    if (gameId) {
        document.getElementById('existingGameId').value = gameId;
        // Try to load existing game
        loadGame(gameId);
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize chart
    initializeChart();
});

// Theme functions
function initializeTheme() {
    applyTheme(currentTheme);
    updateThemeButton();
}

function toggleTheme() {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    currentTheme = themes[nextIndex];
    
    localStorage.setItem('theme', currentTheme);
    applyTheme(currentTheme);
    updateThemeButton();
}

function applyTheme(theme) {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    
    // Update chart colors if chart exists
    if (window.scoreChart) {
        updateChartTheme(isDark);
    }
}

function updateThemeButton() {
    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');
    
    switch (currentTheme) {
        case 'light':
            icon.className = 'fas fa-sun';
            text.textContent = 'Light';
            break;
        case 'dark':
            icon.className = 'fas fa-moon';
            text.textContent = 'Dark';
            break;
        case 'system':
            icon.className = 'fas fa-desktop';
            text.textContent = 'System';
            break;
    }
}

function updateChartTheme(isDark) {
    try {
        if (!window.scoreChart || !window.scoreChart.options || !window.scoreChart.options.plugins) {
            return;
        }
        
        const textColor = isDark ? '#f9fafb' : '#1f2937';
        const gridColor = isDark ? '#374151' : '#e5e7eb';
        
        // Safely update chart options
        if (window.scoreChart.options.plugins.title) {
            window.scoreChart.options.plugins.title.color = textColor;
        }
        
        if (window.scoreChart.options.scales && window.scoreChart.options.scales.x) {
            if (window.scoreChart.options.scales.x.grid) {
                window.scoreChart.options.scales.x.grid.color = gridColor;
            }
            if (window.scoreChart.options.scales.x.ticks) {
                window.scoreChart.options.scales.x.ticks.color = textColor;
            }
        }
        
        if (window.scoreChart.options.scales && window.scoreChart.options.scales.y) {
            if (window.scoreChart.options.scales.y.grid) {
                window.scoreChart.options.scales.y.grid.color = gridColor;
            }
            if (window.scoreChart.options.scales.y.ticks) {
                window.scoreChart.options.scales.y.ticks.color = textColor;
            }
        }
        
        window.scoreChart.update();
    } catch (error) {
        console.log('Chart theme update failed:', error);
    }
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    if (currentTheme === 'system') {
        applyTheme('system');
    }
});

// Version management
function initializeVersion() {
    // For now, always show version footer for debugging
    const hostname = window.location.hostname;
    console.log('Version check:', { hostname }); // Debug log
    
    // Get version from the injected commit hash
    const versionHash = document.getElementById('versionHash');
    let version = 'dev';
    
    if (versionHash && versionHash.textContent) {
        version = versionHash.textContent;
    } else {
        // Fallback to timestamp if no commit hash
        version = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    }
    
    console.log('Version:', version); // Debug log
    
    // Add click handler to show more info
    const versionFooter = document.getElementById('versionFooter');
    if (versionFooter) {
        versionFooter.addEventListener('click', function() {
            showVersionInfo(version);
        });
        versionFooter.style.cursor = 'pointer';
        console.log('Version footer found and configured'); // Debug log
    } else {
        console.log('Version footer not found!'); // Debug log
    }
}

function showVersionInfo(version) {
    const info = `
Version: ${version}
Domain: ${window.location.hostname}
Environment: ${window.location.hostname.includes('pages.dev') ? 'Cloudflare Pages' : 'Development'}
Build Time: ${new Date().toLocaleString()}
    `.trim();
    
    alert(info);
}

function setupEventListeners() {
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
        // Uncheck radio button
        const radio = btn.querySelector('input[type="radio"]');
        if (radio) radio.checked = false;
    });
    
    // Select new color
    const selectedButton = document.querySelector(`[data-color="${color}"]`);
    selectedButton.classList.add('selected');
    
    // Check the radio button
    const radio = selectedButton.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
    
    // Disable taken colors
    if (currentGame) {
        currentGame.players.forEach(player => {
            const colorBtn = document.querySelector(`[data-color="${player.trainColor}"]`);
            if (colorBtn && player.trainColor !== color) {
                colorBtn.disabled = true;
                const playerRadio = colorBtn.querySelector('input[type="radio"]');
                if (playerRadio) playerRadio.disabled = true;
            }
        });
    }
}

function createGame() {
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    currentGame = {
        id: gameId,
        players: [],
        rounds: [],
        createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    saveGame(currentGame);
    
    showGameSetup();
    updateGameStatus();
    
    showMessage('Game created successfully!', 'success');
}

function joinExistingGame() {
    const gameId = document.getElementById('existingGameId').value.trim();
    
    if (!gameId) {
        showMessage('Please enter a Game ID', 'error');
        return;
    }
    
    if (loadGame(gameId)) {
        showGameSetup();
        updateGameStatus();
        showMessage('Game loaded successfully!', 'success');
    } else {
        showMessage('Game not found', 'error');
    }
}

function setupPlayer() {
    const playerName = document.getElementById('setupPlayerName').value.trim();
    const selectedColor = document.querySelector('.color-option.selected');
    
    if (!playerName) {
        showMessage('Please enter your name', 'error');
        return;
    }
    
    if (!selectedColor) {
        showMessage('Please select a train color', 'error');
        return;
    }
    
    const trainColor = selectedColor.dataset.color;
    
    if (!currentGame) {
        showMessage('No game found', 'error');
        return;
    }
    
    // Create current player
    currentPlayer = {
        id: `player_${Date.now()}`,
        name: playerName,
        trainColor: trainColor,
        scores: [],
        isOffline: false
    };
    
    // Add player to game
    currentGame.players.push(currentPlayer);
    
    // Save game
    saveGame(currentGame);
    
    showGameInterface();
    updateGameStatus();
    showMessage('Player setup complete!', 'success');
}

function addPlayer() {
    const playerName = document.getElementById('addPlayerName').value.trim();
    const selectedColor = document.querySelector('#addPlayerColorGrid .color-option.selected');
    
    if (!playerName) {
        showMessage('Please enter a player name', 'error');
        return;
    }
    
    if (!selectedColor) {
        showMessage('Please select a color', 'error');
        return;
    }
    
    const trainColor = selectedColor.dataset.color;
    
    if (!currentGame) {
        showMessage('No game found', 'error');
        return;
    }
    
    // Check if name already exists
    if (currentGame.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
        showMessage('A player with this name already exists', 'error');
        return;
    }
    
    // Check if color is already taken
    if (currentGame.players.some(p => p.trainColor === trainColor)) {
        showMessage('This color is already taken', 'error');
        return;
    }
    
    const newPlayer = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: playerName,
        trainColor: trainColor,
        scores: [],
        isOffline: true
    };
    
    currentGame.players.push(newPlayer);
    
    // Save game
    saveGame(currentGame);
    
    // Clear form
    document.getElementById('addPlayerName').value = '';
    document.querySelector('#addPlayerColorGrid .color-option.selected')?.classList.remove('selected');
    
    updateGameStatus();
    updateScoreInputForm();
    updateAddPlayerColors();
    showMessage(`Added ${playerName} to the game!`, 'success');
}

function submitScores() {
    if (!currentGame) {
        showMessage('No game found', 'error');
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
    
    // Add round
    const round = {
        roundNumber: roundNumber,
        scores: scores,
        timestamp: new Date().toISOString()
    };
    
    currentGame.rounds.push(round);
    
    // Update player scores
    scores.forEach(scoreEntry => {
        const player = currentGame.players.find(p => p.id === scoreEntry.playerId);
        if (player) {
            player.scores.push(scoreEntry.score);
        }
    });
    
    // Save game
    saveGame(currentGame);
    
    // Clear form
    currentGame.players.forEach(player => {
        const scoreInput = document.getElementById(`score-${player.id}`);
        if (scoreInput) scoreInput.value = '';
    });
    
    updateScoreChart();
    updateGameStatus();
    showMessage(`Round ${roundNumber} scores submitted!`, 'success');
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
    document.getElementById('gameIdDisplay').textContent = currentGame.id;
    
    // Update forms and charts
    updateScoreInputForm();
    updateScoreChart();
    updateGameStatus();
    updateAddPlayerColors();
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

function updateAddPlayerColors() {
    const colorGrid = document.getElementById('addPlayerColorGrid');
    colorGrid.innerHTML = '';
    
    const takenColors = currentGame ? currentGame.players.map(p => p.trainColor) : [];
    
    trainColors.forEach(color => {
        if (!takenColors.includes(color)) {
            const colorOption = document.createElement('div');
            colorOption.className = 'color-option';
            colorOption.dataset.color = color;
            colorOption.innerHTML = `
                <input type="radio" name="addPlayerColor" value="${color}">
                <div class="color-dot ${color}"></div>
                <span>${color.charAt(0).toUpperCase() + color.slice(1)}</span>
            `;
            
            colorOption.addEventListener('click', function() {
                // Remove previous selection
                document.querySelectorAll('#addPlayerColorGrid .color-option').forEach(btn => {
                    btn.classList.remove('selected');
                    const radio = btn.querySelector('input[type="radio"]');
                    if (radio) radio.checked = false;
                });
                
                // Select this color
                this.classList.add('selected');
                const radio = this.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
            });
            
            colorGrid.appendChild(colorOption);
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
    
    // Get current theme colors
    const isDark = document.documentElement.hasAttribute('data-theme');
    const textColor = isDark ? '#f9fafb' : '#1f2937';
    const gridColor = isDark ? '#374151' : '#e5e7eb';
    
    // Create stacked horizontal bar chart
    window.scoreChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        plugins: [{
            afterDraw: function(chart) {
                const ctx = chart.ctx;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.font = '12px Arial';
                ctx.fillStyle = '#333';
                
                // Calculate and display total scores
                currentGame.players.forEach((player, playerIndex) => {
                    const totalScore = currentGame.rounds.reduce((total, round) => {
                        const scoreEntry = round.scores.find(s => s.playerId === player.id);
                        return total + (scoreEntry ? scoreEntry.score : 0);
                    }, 0);
                    
                    if (totalScore > 0) {
                        const meta = chart.getDatasetMeta(0);
                        const bar = meta.data[playerIndex];
                        const x = bar.x + 5; // Position text slightly to the right of the bar
                        const y = bar.y;
                        
                        ctx.fillText(`Total: ${totalScore}`, x, y);
                    }
                });
            }
        }],
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
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Score'
                    }
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
                    text: 'Mexican Train Scores by Round',
                    color: textColor
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: textColor
                    }
                },
                tooltip: {
                    callbacks: {
                        afterBody: function(context) {
                            // Calculate total score for this player
                            const playerIndex = context[0].dataIndex;
                            const player = currentGame.players[playerIndex];
                            const totalScore = currentGame.rounds.reduce((total, round) => {
                                const scoreEntry = round.scores.find(s => s.playerId === player.id);
                                return total + (scoreEntry ? scoreEntry.score : 0);
                            }, 0);
                            return `Total Score: ${totalScore}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Score',
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Players',
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor
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
    document.getElementById('playerCount').textContent = currentGame.players.length;
    document.getElementById('currentRound').textContent = currentGame.rounds.length + 1;
}

function toggleAddPlayerSection() {
    const section = document.getElementById('addPlayerSection');
    const toggle = document.getElementById('addPlayerToggle');
    
    if (section.style.display === 'none' || !section.style.display) {
        section.style.display = 'block';
        toggle.innerHTML = '<i class="fas fa-chevron-up"></i>';
    } else {
        section.style.display = 'none';
        toggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
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
            showMessage('Game link copied to clipboard!', 'success');
        });
    } else {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = gameUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showMessage('Game link copied to clipboard!', 'success');
    }
}

function initializeChart() {
    const ctx = document.getElementById('scoreChart').getContext('2d');
    
    // Get current theme colors
    const isDark = document.documentElement.hasAttribute('data-theme');
    const textColor = isDark ? '#f9fafb' : '#1f2937';
    const gridColor = isDark ? '#374151' : '#e5e7eb';
    
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
                    text: 'Mexican Train Scores by Round',
                    color: textColor
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    stacked: true,
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor
                    }
                },
                y: {
                    stacked: true,
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor
                    }
                }
            }
        }
    });
}

// LocalStorage functions
function saveGame(game) {
    localStorage.setItem(`traintally_game_${game.id}`, JSON.stringify(game));
}

function loadGame(gameId) {
    const gameData = localStorage.getItem(`traintally_game_${gameId}`);
    if (gameData) {
        currentGame = JSON.parse(gameData);
        return true;
    }
    return false;
}

function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.success, .error');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = type;
    messageDiv.textContent = message;
    
    // Insert at top of container
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
} 