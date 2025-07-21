// Supabase client setup
const SUPABASE_URL = 'https://bnlnhxrtiyfdsihtanoj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubG5oeHJ0aXlmZHNpaHRhbm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5ODUzMjksImV4cCI6MjA2ODU2MTMyOX0.RzSHQFkpCDgvwgaZhJsxP2Q5ipyITT5p3-XVotQo47Q';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Game state
let currentGame = null;
let currentPlayer = null;
let gameSubscription = null;

// Train colors with hex values
const trainColors = [
    { value: 'red', hex: '#ef4444', name: 'Red' },
    { value: 'white', hex: '#f9fafb', name: 'White' },
    { value: 'green', hex: '#22c55e', name: 'Green' },
    { value: 'orange', hex: '#f97316', name: 'Orange' },
    { value: 'brown', hex: '#a16207', name: 'Brown' },
    { value: 'black', hex: '#1f2937', name: 'Black' },
    { value: 'blue', hex: '#3b82f6', name: 'Blue' },
    { value: 'pink', hex: '#ec4899', name: 'Pink' },
    { value: 'yellow', hex: '#eab308', name: 'Yellow' }
];

// --- Dynamic Player List for Game Setup ---
let playerRows = [
  { name: '', color: '' },
  { name: '', color: '' }
];

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
    
    // Initialize color selection
    setupColorSelection();
    
    // Initialize chart
    initializeChart();

    if (window.lucide) {
        lucide.createIcons();
    }

    const addPlayerRowBtn = document.getElementById('addPlayerRow');
    if (addPlayerRowBtn) {
        addPlayerRowBtn.onclick = function() {
            playerRows.push({ name: '', color: '' });
            renderPlayerRows();
        };
    }
    renderPlayerRows();
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
    // Remove or update theme toggle event
    // (Theme toggle is now handled in the new theme logic at the end of the file)
}

// Remove updateSetupColorGrid and color grid logic
function updateSetupColorSelect() {
    const colorSelect = document.getElementById('setupColorSelect');
    if (!colorSelect) return;
    colorSelect.innerHTML = '';
    const takenColors = currentGame ? currentGame.players.map(p => p.trainColor) : [];
    trainColors.forEach(color => {
        const option = document.createElement('option');
        option.value = color.value;
        option.textContent = color.name;
        if (takenColors.includes(color.value)) {
            option.disabled = true;
        }
        colorSelect.appendChild(option);
    });
}

function setupColorSelection() {
    // Use event delegation for better reliability
    document.addEventListener('click', function(e) {
        // Check if clicked element or its parent has a data-color attribute
        const colorOption = e.target.closest('[data-color]');
        
        if (colorOption && !colorOption.classList.contains('disabled')) {
            // Don't allow selection of disabled colors
            if (colorOption.classList.contains('disabled')) {
                return;
            }
            
            // Handle setup color grid
            if (colorOption.closest('#setupColorGrid')) {
                document.querySelectorAll('#setupColorGrid [data-color]').forEach(btn => {
                    btn.classList.remove('selected', 'ring-2', 'ring-blue-500', 'ring-offset-2');
                    btn.style.boxShadow = '';
                });
                
                // Select this color
                colorOption.classList.add('selected', 'ring-1', 'ring-blue-500', 'ring-offset-1');
                colorOption.style.boxShadow = '0 0 0 2px #3b82f6'; // Subtle blue ring
            }
            
            // Handle add player color grid
            if (colorOption.closest('#addPlayerColorGrid')) {
                // Remove previous selection
                document.querySelectorAll('#addPlayerColorGrid [data-color]').forEach(btn => {
                    btn.classList.remove('selected', 'ring-2', 'ring-blue-500', 'ring-offset-2');
                });
                
                // Select this color
                colorOption.classList.add('selected', 'ring-2', 'ring-blue-500', 'ring-offset-2');
            }
        }
    });
}

async function createGame() {
    try {
        const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const now = new Date().toISOString();
        // Create game in database with all required fields
        await supabase.from('games').insert({
            game_id: gameId,
            name: 'New Game',
            created_at: now,
            updated_at: now,
            is_active: true
        });
        currentGame = {
            game_id: gameId,
            name: 'New Game',
            players: [],
            rounds: [],
            createdAt: now,
            updatedAt: now,
            isActive: true
        };
        showGameSetup();
        showMessage('Game created successfully!', 'success');
    } catch (error) {
        console.error('Error creating game:', error);
        showMessage('Failed to create game. Please try again.', 'error');
    }
}

async function joinExistingGame() {
    try {
        const gameId = document.getElementById('existingGameId').value.trim();
        
        if (!gameId) {
            showMessage('Please enter a Game ID', 'error');
            return;
        }
        
        // Load game from database
        const { data, error } = await supabase
            .from('games')
            .select('*')
            .eq('id', gameId)
            .single();

        if (error) {
            console.error('Error loading game:', error);
            showMessage('Failed to load game. Please try again.', 'error');
            return;
        }
        
        if (data) {
            currentGame = data;
            showGameSetup();
            showMessage('Game loaded successfully!', 'success');
        } else {
            showMessage('Game not found', 'error');
        }
    } catch (error) {
        console.error('Error joining game:', error);
        showMessage('Failed to join game. Please try again.', 'error');
    }
}

function showPlayerSetupError(msg) {
  const err = document.getElementById('playerSetupError');
  if (err) err.textContent = msg;
}

// Update setupPlayer to use playerRows
async function setupPlayer() {
  try {
    showPlayerSetupError('');
    // Validate all names and colors
    const names = playerRows.map(r => r.name.trim());
    const colors = playerRows.map(r => r.color);
    if (names.some(n => !n)) {
      showPlayerSetupError('Please enter a name for every player.');
      return;
    }
    if (colors.some(c => !c)) {
      showPlayerSetupError('Please select a train color for every player.');
      return;
    }
    // Check for duplicate colors
    const colorSet = new Set(colors);
    if (colorSet.size !== colors.length) {
      showPlayerSetupError('Each player must have a unique train color.');
      return;
    }
    // Add players to game
    for (let i = 0; i < playerRows.length; i++) {
      currentGame.players.push({
        id: Math.random().toString(36).substring(2, 10),
        name: names[i],
        trainColor: colors[i]
      });
    }
    showGameInterface();
    showMessage('Players added successfully!', 'success');
  } catch (error) {
    showPlayerSetupError('Failed to setup players. Please try again.');
    console.error(error);
  }
}

async function addPlayer() {
    const playerName = document.getElementById('addPlayerName').value.trim();
    const selectedColor = document.querySelector('#addPlayerColorGrid [data-color].selected');
    
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
    
    // Add player to database
    try {
        await supabase.from('players').insert({
            game_id: currentGame.id,
            name: playerName,
            train_color: trainColor,
            is_offline: true
        });
        
        // Clear form
        document.getElementById('addPlayerName').value = '';
        document.querySelectorAll('#addPlayerColorGrid [data-color]').forEach(btn => {
            btn.classList.remove('selected', 'ring-2', 'ring-blue-500', 'ring-offset-2');
        });
        
        updateScoreInputForm();
        updateAddPlayerColors();
        updateScoreTable();
        updateScoreChart();
        showMessage(`Added ${playerName} to the game!`, 'success');
    } catch (error) {
        console.error('Error adding player:', error);
        showMessage('Failed to add player. Please try again.', 'error');
    }
}

async function submitScores() {
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
            if (!Array.isArray(player.scores)) player.scores = [];
            player.scores.push(scoreEntry.score);
        }
    });
    
    // Submit scores to database
    try {
        await supabase.from('rounds').insert({
            game_id: currentGame.id,
            round_number: roundNumber,
            scores: JSON.stringify(scores),
            timestamp: new Date().toISOString()
        });
        
        // Clear form
        currentGame.players.forEach(player => {
            const scoreInput = document.getElementById(`score-${player.id}`);
            if (scoreInput) scoreInput.value = '';
        });
        
        updateScoreChart();
        updateScoreTable();
        showMessage(`Round ${roundNumber} scores submitted!`, 'success');
    } catch (error) {
        console.error('Error submitting scores:', error);
        showMessage('Failed to submit scores. Please try again.', 'error');
    }
}

function showGameSetup() {
    document.getElementById('mainPage').style.display = 'none';
    document.getElementById('gameSetup').style.display = 'block';
    document.getElementById('gameInterface').style.display = 'none';
    
    // Auto-fill game ID
    document.getElementById('setupGameId').value = currentGame.id;
    
    // Update available colors and set up event listeners
    updateSetupColorSelect();
    setupColorSelection();
}

function showGameInterface() {
    console.log('Showing game interface for game:', currentGame);
    
    document.getElementById('mainPage').style.display = 'none';
    document.getElementById('gameSetup').style.display = 'none';
    document.getElementById('gameInterface').style.display = 'block';
    
    // Update game ID display
    document.getElementById('gameIdDisplay').textContent = currentGame.id;
    
    // Update forms and charts
    updateScoreInputForm();
    updateScoreChart();
    updateAddPlayerColors();
    updateScoreTable();
    
    console.log('Game interface updated');
}

async function loadGameFromDatabase(gameId) {
    try {
        const { data, error } = await supabase
            .from('games')
            .select('*')
            .eq('id', gameId)
            .single();

        if (error) {
            console.error('Error reloading game:', error);
            return;
        }

        if (data) {
            currentGame = data;
            updateScoreInputForm();
            updateScoreChart();
            updateAddPlayerColors();
            updateScoreTable();
        }
    } catch (error) {
        console.error('Error reloading game:', error);
    }
}

// Handle real-time game updates
function handleGameUpdate(updatedGame) {
    if (updatedGame && currentGame && updatedGame.id === currentGame.id) {
        currentGame = updatedGame;
        updateScoreInputForm();
        updateScoreChart();
        updateAddPlayerColors();
        updateScoreTable();
    }
}



function updateAddPlayerColors() {
    const colorGrid = document.getElementById('addPlayerColorGrid');
    if (!colorGrid) {
        console.log('addPlayerColorGrid element not found');
        return;
    }
    
    const takenColors = currentGame ? currentGame.players.map(p => p.trainColor) : [];
    console.log('Updating add player colors. Taken colors:', takenColors);
    console.log('Available train colors:', trainColors);
    
    // Clear existing content
    colorGrid.innerHTML = '';
    
    // Add available colors
    trainColors.forEach(color => {
        if (!takenColors.includes(color.value)) {
            console.log('Adding color option:', color);
            const colorOption = document.createElement('div');
            colorOption.className = 'flex flex-col items-center justify-center p-2 border rounded-lg cursor-pointer hover:scale-105 transition-transform';
            colorOption.dataset.color = color.value;
            
            // Create color square with inline styles to override CSS
            const colorSquare = document.createElement('div');
            colorSquare.style.cssText = `
                width: 28px;
                height: 28px;
                border-radius: 6px;
                margin-bottom: 2px;
                border: 2px solid #e5e7eb;
                background-color: ${color.hex};
            `;
            
            // Create label
            const label = document.createElement('span');
            label.className = 'text-xs font-medium text-gray-700 text-center';
            label.textContent = color.name;
            
            colorOption.appendChild(colorSquare);
            colorOption.appendChild(label);
            
            colorGrid.appendChild(colorOption);
        }
    });
    
    console.log('Color grid updated. Total options:', colorGrid.children.length);
}

function updateScoreInputForm() {
    const scoreInputForm = document.getElementById('scoreInputForm');
    scoreInputForm.innerHTML = '';
    if (!currentGame) return;
    currentGame.players.forEach(player => {
        const colorHex = (trainColors.find(c => c.value === player.trainColor) || {}).hex || '#ccc';
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-row flex items-center gap-x-4 p-3 rounded-md mb-3';
        playerDiv.innerHTML = `
            <div class="flex items-center gap-x-2 flex-shrink-0 justify-start w-48">
                <div class="color-dot" style="background:${colorHex}"></div>
                <span class="font-medium">${player.name}</span>
            </div>
            <input type="number" id="score-${player.id}" name="score-${player.id}" 
                   placeholder="Enter score" min="0" required
                   class="score-input w-36 px-3 py-2 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-right" autocomplete="off">
        `;
        scoreInputForm.appendChild(playerDiv);
    });
}

function updateScoreChart() {
    if (!currentGame || !currentGame.players.length) return;

    const canvas = document.getElementById('scoreChart');
    if (!canvas) {
        console.log('Score chart canvas not found');
        return;
    }

    // Set dynamic height: 80px per player, min 320px, max 900px
    const playerCount = currentGame.players.length;
    const height = Math.max(320, Math.min(playerCount * 80, 900));
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    // Destroy existing chart safely
    if (window.scoreChart && typeof window.scoreChart.destroy === 'function') {
        try {
            window.scoreChart.destroy();
        } catch (error) {
            console.log('Error destroying existing chart:', error);
        }
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

    // Calculate totals for display in separate column
    const totalData = currentGame.players.map(player => {
        return currentGame.rounds.reduce((total, round) => {
            const scoreEntry = round.scores.find(s => s.playerId === player.id);
            return total + (scoreEntry ? scoreEntry.score : 0);
        }, 0);
    });

    // Update totals column
    updateChartTotals(totalData);

    // Detect dark mode
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#f9fafb' : '#1f2937';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    // Determine if there are any scores
    const hasScores = currentGame.rounds.some(round =>
        round.scores.some(scoreEntry => typeof scoreEntry.score === 'number' && scoreEntry.score > 0)
    );

    // Chart.js config
    window.scoreChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        plugins: [],
        options: {
            indexAxis: 'y',
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
                    backgroundColor: isDark ? '#22223b' : 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#ffffff',
                    borderWidth: 1,
                    cornerRadius: 6,
                    displayColors: false
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
                        color: textColor,
                        min: hasScores ? undefined : 0,
                        max: hasScores ? undefined : 100,
                        stepSize: hasScores ? undefined : 10
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

function updateChartTotals(totalData) {
    const totalsContainer = document.getElementById('chartTotals');
    if (!totalsContainer || !currentGame) return;

    totalsContainer.innerHTML = '';

    // Build an array of {player, total} and sort by total ascending
    const playerTotals = currentGame.players.map((player, index) => ({
        player,
        total: totalData[index]
    })).sort((a, b) => a.total - b.total);

    playerTotals.forEach(({ player, total }) => {
        const colorHex = (trainColors.find(c => c.value === player.trainColor) || {}).hex || '#ccc';
        const totalDiv = document.createElement('div');
        totalDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            margin-bottom: 8px;
            background: var(--bg-secondary);
            border-radius: 6px;
            border: 1px solid var(--border-color);
        `;

        totalDiv.innerHTML = `
            <div class="color-dot" style="background:${colorHex}"></div>
            <span style="font-weight: 600; color: var(--text-primary);">${player.name}:</span>
            <span style="font-weight: 700; color: var(--text-primary); margin-left: auto;">${total}</span>
        `;

        totalsContainer.appendChild(totalDiv);
    });
}

function updateScoreTable() {
    if (!currentGame) return;
    
    const table = document.getElementById('scoreTable');
    if (!table) {
        console.log('Score table element not found');
        return;
    }
    
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    
    if (!thead || !tbody) {
        console.log('Score table thead or tbody not found');
        return;
    }
    
    // Clear existing content
    thead.innerHTML = '';
    tbody.innerHTML = '';

    // --- Header row ---
    const headerRow = document.createElement('tr');
    headerRow.className = 'border-b';
    // First cell: Round
    const roundTh = document.createElement('th');
    roundTh.className = 'text-left p-3 font-medium';
    roundTh.textContent = 'Round';
    headerRow.appendChild(roundTh);
    // Player cells
    if (currentGame.players.length > 0) {
        currentGame.players.forEach(player => {
            const colorHex = (trainColors.find(c => c.value === player.trainColor) || {}).hex || '#ccc';
            const th = document.createElement('th');
            th.className = 'text-center p-3 font-medium';
            th.innerHTML = `<div class="flex flex-col items-center justify-center gap-1"><div class="color-dot" style="background:${colorHex}"></div><span>${player.name}</span></div>`;
            headerRow.appendChild(th);
        });
    }
    thead.appendChild(headerRow);

    // --- Body rows: one per round ---
    const numRounds = 13;
    for (let roundNumber = 1; roundNumber <= numRounds; roundNumber++) {
        const row = document.createElement('tr');
        row.className = 'border-b';
        // Round name cell
        const roundCell = document.createElement('td');
        roundCell.className = 'p-3 font-medium';
        roundCell.textContent = getRoundName(roundNumber);
        row.appendChild(roundCell);
        // Player score cells
        let roundTotal = 0;
        if (currentGame.players.length > 0) {
            currentGame.players.forEach(player => {
                const round = currentGame.rounds.find(r => r.roundNumber === roundNumber);
                const scoreEntry = round ? round.scores.find(s => s.playerId === player.id) : null;
                const score = scoreEntry ? scoreEntry.score : '';
                if (scoreEntry) roundTotal += scoreEntry.score;
                const scoreCell = document.createElement('td');
                scoreCell.className = 'score-cell';
                scoreCell.textContent = score;
                row.appendChild(scoreCell);
            });
        }
        tbody.appendChild(row);
    }

    // --- Footer row: Totals ---
    const footerRow = document.createElement('tr');
    footerRow.className = 'border-t';
    // First cell: "Total"
    const totalLabelCell = document.createElement('td');
    totalLabelCell.className = 'p-3 font-bold';
    totalLabelCell.textContent = 'Total';
    footerRow.appendChild(totalLabelCell);
    // Player total cells
    if (currentGame.players.length > 0) {
        currentGame.players.forEach(player => {
            const totalScore = currentGame.rounds.reduce((total, round) => {
                const scoreEntry = round.scores.find(s => s.playerId === player.id);
                return total + (scoreEntry ? scoreEntry.score : 0);
            }, 0);
            const totalCell = document.createElement('td');
            totalCell.className = 'score-cell font-bold';
            totalCell.textContent = totalScore;
            footerRow.appendChild(totalCell);
        });
    }
    // Remove the extra blank cell at the end
    tbody.appendChild(footerRow);
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

function toggleAddPlayerSection() {
    const content = document.getElementById('addPlayerContent');
    const toggle = document.getElementById('addPlayerToggle');
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        toggle.style.transform = 'rotate(0deg)';
    } else {
        content.classList.add('expanded');
        toggle.style.transform = 'rotate(180deg)';
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
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    
    let bgColor, textColor, icon;
    switch (type) {
        case 'success':
            bgColor = 'bg-green-500';
            textColor = 'text-white';
            icon = 'check-circle';
            break;
        case 'error':
            bgColor = 'bg-red-500';
            textColor = 'text-white';
            icon = 'x-circle';
            break;
        case 'warning':
            bgColor = 'bg-yellow-500';
            textColor = 'text-white';
            icon = 'alert-triangle';
            break;
        default:
            bgColor = 'bg-blue-500';
            textColor = 'text-white';
            icon = 'info';
    }
    
    messageDiv.className = `flex items-center space-x-2 p-3 rounded-md ${bgColor} ${textColor} shadow-lg`;
    messageDiv.innerHTML = `
        <i data-lucide="${icon}" class="w-5 h-5"></i>
        <span>${message}</span>
    `;
    
    messagesContainer.appendChild(messageDiv);
    lucide.createIcons();
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
} 

// THEME TOGGLE LOGIC
const themeOptions = ['system', 'light', 'dark'];
const themeIcons = {
  system: 'monitor',
  light: 'sun',
  dark: 'moon',
};
const themeLabels = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.setAttribute('data-theme', 'dark');
  } else if (theme === 'light') {
    html.setAttribute('data-theme', 'light');
  } else {
    html.removeAttribute('data-theme');
  }
}

function updateThemeToggle(theme) {
  const icon = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (icon) {
    icon.setAttribute('data-lucide', themeIcons[theme]);
    if (window.lucide) lucide.createIcons();
  }
  if (label) {
    label.textContent = themeLabels[theme];
  }
}

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme) {
  localStorage.setItem('theme', theme);
  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
  applyTheme(effectiveTheme);
  updateThemeToggle(theme);
}

function cycleTheme() {
  const current = localStorage.getItem('theme') || 'system';
  const idx = themeOptions.indexOf(current);
  const next = themeOptions[(idx + 1) % themeOptions.length];
  setTheme(next);
}

// Initialize theme on page load
(function() {
  const saved = localStorage.getItem('theme') || 'system';
  setTheme(saved);
  // Listen for system theme changes if in system mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
    if ((localStorage.getItem('theme') || 'system') === 'system') {
      setTheme('system');
    }
  });
  // Add event listener to toggle button
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', cycleTheme);
  }
})(); 

// --- Dynamic Player List for Game Setup ---
function renderPlayerRows() {
  const section = document.getElementById('playerListSection');
  if (!section) return;
  section.innerHTML = '';
  const takenColors = playerRows.map(row => row.color).filter(Boolean);
  playerRows.forEach((row, idx) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'flex gap-2 mb-2';
    // Name input
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Player Name';
    nameInput.value = row.name;
    nameInput.className = 'flex-1 px-3 py-2 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';
    nameInput.oninput = e => {
      playerRows[idx].name = e.target.value;
    };
    // Color select
    const colorSelect = document.createElement('select');
    colorSelect.className = 'w-40 px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring';
    colorSelect.innerHTML = '<option value="">Select Color</option>';
    trainColors.forEach(color => {
      const option = document.createElement('option');
      option.value = color.value;
      option.textContent = color.name;
      // Disable if taken by another row
      if (takenColors.includes(color.value) && row.color !== color.value) {
        option.disabled = true;
      }
      colorSelect.appendChild(option);
    });
    colorSelect.value = row.color;
    colorSelect.onchange = e => {
      playerRows[idx].color = e.target.value;
      renderPlayerRows(); // re-render to update disables
    };
    rowDiv.appendChild(nameInput);
    rowDiv.appendChild(colorSelect);
    section.appendChild(rowDiv);
  });
} 