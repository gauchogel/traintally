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
        // More robust check for chart existence and structure
        if (!window.scoreChart || 
            typeof window.scoreChart !== 'object' || 
            !window.scoreChart.options || 
            typeof window.scoreChart.options !== 'object' ||
            !window.scoreChart.options.plugins ||
            typeof window.scoreChart.options.plugins !== 'object') {
            console.log('Chart not ready for theme update');
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
    const hostname = window.location.hostname;
    
    // Generate version based on environment
    let version = 'dev';
    if (hostname.includes('pages.dev')) {
        version = 'staging';
    } else if (hostname === 'traintally.com') {
        version = 'prod';
    }
    
    // Update version display
    const versionHash = document.getElementById('versionHash');
    if (versionHash) {
        versionHash.textContent = version;
    }
    
    // Add click handler to show more info
    const versionFooter = document.getElementById('versionFooter');
    if (versionFooter) {
        versionFooter.addEventListener('click', function() {
            showVersionInfo(version);
        });
        versionFooter.style.cursor = 'pointer';
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
    // No longer needed with dropdown
}

function updateSetupColorGrid() {
    const colorGrid = document.getElementById('setupColorGrid');
    const takenColors = currentGame ? currentGame.players.map(p => p.trainColor) : [];
    
    // Update each color option
    colorGrid.querySelectorAll('.color-option').forEach(option => {
        const color = option.dataset.color;
        if (takenColors.includes(color)) {
            option.classList.add('disabled');
            option.classList.remove('selected');
        } else {
            option.classList.remove('disabled');
        }
    });
}

function setupColorSelection() {
    // Use event delegation for better reliability
    document.addEventListener('click', function(e) {
        if (e.target.closest('.color-option')) {
            const colorOption = e.target.closest('.color-option');
            
            // Don't allow selection of disabled colors
            if (colorOption.classList.contains('disabled')) {
                return;
            }
            
            // Handle setup color grid
            if (colorOption.closest('#setupColorGrid')) {
                // Remove previous selection
                document.querySelectorAll('#setupColorGrid .color-option').forEach(btn => {
                    btn.classList.remove('selected');
                });
                
                // Select this color
                colorOption.classList.add('selected');
            }
            
            // Handle add player color grid
            if (colorOption.closest('#addPlayerColorGrid')) {
                // Remove previous selection
                document.querySelectorAll('#addPlayerColorGrid .color-option').forEach(btn => {
                    btn.classList.remove('selected');
                });
                
                // Select this color
                colorOption.classList.add('selected');
            }
        }
    });
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
    const selectedColor = document.querySelector('#setupColorGrid .color-option.selected');
    
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
    updateScoreTable();
    updateScoreChart();
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
    document.querySelectorAll('#addPlayerColorGrid .color-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    updateGameStatus();
    updateScoreInputForm();
    updateAddPlayerColors();
    updateScoreTable();
    updateScoreChart();
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
    updateScoreTable();
    updateGameStatus();
    showMessage(`Round ${roundNumber} scores submitted!`, 'success');
}

function showGameSetup() {
    document.getElementById('mainPage').style.display = 'none';
    document.getElementById('gameSetup').style.display = 'block';
    document.getElementById('gameInterface').style.display = 'none';
    
    // Auto-fill game ID
    document.getElementById('setupGameId').value = currentGame.id;
    
    // Update available colors and set up event listeners
    updateSetupColorGrid();
    setupColorSelection();
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
    updateScoreTable();
}



function updateAddPlayerColors() {
    const colorGrid = document.getElementById('addPlayerColorGrid');
    const takenColors = currentGame ? currentGame.players.map(p => p.trainColor) : [];
    
    // Clear existing content
    colorGrid.innerHTML = '';
    
    // Add available colors
    trainColors.forEach(color => {
        if (!takenColors.includes(color)) {
            const colorOption = document.createElement('div');
            colorOption.className = 'color-option';
            colorOption.dataset.color = color;
            colorOption.innerHTML = `
                <div class="color-dot ${color}"></div>
                <span>${color.charAt(0).toUpperCase() + color.slice(1)}</span>
            `;
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
            label: getRoundName(round.roundNumber),
            data: roundData,
            backgroundColor: getColorForRound(roundIndex),
            borderColor: getColorForRound(roundIndex),
            borderWidth: 1
        });
    });
    
    // Add total dataset at the bottom
    const totalData = currentGame.players.map(player => {
        return currentGame.rounds.reduce((total, round) => {
            const scoreEntry = round.scores.find(s => s.playerId === player.id);
            return total + (scoreEntry ? scoreEntry.score : 0);
        }, 0);
    });
    
    if (totalData.some(total => total > 0)) {
        datasets.push({
            label: 'Total',
            data: totalData,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            type: 'bar'
        });
    }
    
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
        plugins: [],
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
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#ffffff',
                    borderWidth: 1,
                    cornerRadius: 6,
                    displayColors: false,
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
    
    // Update the score table as well
    updateScoreTable();
}

function updateScoreTable() {
    if (!currentGame) return;
    
    const table = document.getElementById('scoreTable');
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');
    const tfoot = table.querySelector('tfoot tr');
    
    // Clear existing content
    thead.innerHTML = '<th>Round</th>';
    tbody.innerHTML = '';
    tfoot.innerHTML = '<td><strong>Total</strong></td>';
    
    // Add player headers (even if no players yet)
    if (currentGame.players.length > 0) {
        currentGame.players.forEach(player => {
            const th = document.createElement('th');
            th.innerHTML = `
                <div class="player-header">
                    <div class="color-dot ${player.trainColor}"></div>
                    <span>${player.name}</span>
                </div>
            `;
            thead.appendChild(th);
            
            // Add total column
            const totalTd = document.createElement('td');
            totalTd.innerHTML = '<strong>0</strong>';
            tfoot.appendChild(totalTd);
        });
    } else {
        // Add placeholder header if no players
        const th = document.createElement('th');
        th.textContent = 'Add Players';
        thead.appendChild(th);
        
        const totalTd = document.createElement('td');
        totalTd.innerHTML = '<strong>-</strong>';
        tfoot.appendChild(totalTd);
    }
    
    // Add all 13 rounds (Double 12 through Double Blank)
    for (let roundNumber = 1; roundNumber <= 13; roundNumber++) {
        const row = document.createElement('tr');
        
        // Round name cell
        const roundCell = document.createElement('td');
        roundCell.textContent = getRoundName(roundNumber);
        row.appendChild(roundCell);
        
        // Player score cells
        if (currentGame.players.length > 0) {
            currentGame.players.forEach(player => {
                const round = currentGame.rounds.find(r => r.roundNumber === roundNumber);
                const scoreEntry = round ? round.scores.find(s => s.playerId === player.id) : null;
                const score = scoreEntry ? scoreEntry.score : '';
                
                const scoreCell = document.createElement('td');
                scoreCell.className = 'score-cell';
                scoreCell.textContent = score;
                
                // Highlight best and worst scores for this round (only if round exists)
                if (round && round.scores.length > 0) {
                    const roundScores = round.scores.map(s => s.score).filter(s => s > 0);
                    if (roundScores.length > 0) {
                        const minScore = Math.min(...roundScores);
                        const maxScore = Math.max(...roundScores);
                        
                        if (score === minScore && score > 0) {
                            scoreCell.classList.add('best');
                        } else if (score === maxScore && score > 0) {
                            scoreCell.classList.add('worst');
                        }
                    }
                }
                
                row.appendChild(scoreCell);
            });
        } else {
            // Add placeholder cell if no players
            const scoreCell = document.createElement('td');
            scoreCell.className = 'score-cell';
            scoreCell.textContent = '-';
            row.appendChild(scoreCell);
        }
        
        tbody.appendChild(row);
    }
    
    // Calculate and display totals
    if (currentGame.players.length > 0) {
        currentGame.players.forEach((player, playerIndex) => {
            const totalScore = currentGame.rounds.reduce((total, round) => {
                const scoreEntry = round.scores.find(s => s.playerId === player.id);
                return total + (scoreEntry ? scoreEntry.score : 0);
            }, 0);
            
            const totalCell = tfoot.children[playerIndex + 1];
            totalCell.innerHTML = `<strong>${totalScore}</strong>`;
        });
    }
}

function getColorForRound(roundIndex) {
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];
    return colors[roundIndex % colors.length];
}

function getRoundName(roundNumber) {
    const doubles = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    if (roundNumber <= doubles.length) {
        return `Double ${doubles[roundNumber - 1]}`;
    }
    return `Round ${roundNumber}`;
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