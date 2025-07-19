# 🚂 Mexican Train Score Tracker

A real-time web application for tracking Mexican Train domino game scores with friends in the same room.

## Features

- **Real-time Updates**: All players see score updates instantly
- **Game Rooms**: Create private game rooms with unique IDs
- **Player Management**: Up to 8 players with custom train colors
- **Score Tracking**: Enter scores for each round
- **Visual Charts**: Stacked bar chart showing scores by round
- **Mobile Friendly**: Responsive design works on phones and tablets

## How to Play

1. **Start the Server**: Run `npm start` to start the application
2. **Create a Game**: Click "Create New Game Room" to generate a unique game ID
3. **Share the Game ID**: Share the game ID with your friends
4. **Join the Game**: Friends enter the game ID, their name, and select a train color
5. **Track Scores**: Enter scores for each round (lower scores are better in Mexican Train!)
6. **View Progress**: Watch the stacked bar chart update in real-time

## Installation

1. Make sure you have Node.js installed
2. Clone or download this project
3. Run `npm install` to install dependencies
4. Run `npm start` to start the server
5. Open your browser to `http://localhost:3000`

## Game Rules (Mexican Train)

- Each player has their own "train" (line of dominoes)
- Players try to play dominoes on their train or the Mexican Train
- If a player can't play, they draw a domino and their score increases
- The goal is to have the lowest score at the end
- The game typically ends when one player runs out of dominoes

## Technical Details

- **Backend**: Node.js with Express and Socket.IO
- **Frontend**: Vanilla JavaScript with Chart.js for visualizations
- **Real-time Communication**: WebSocket connections via Socket.IO
- **Data Storage**: In-memory storage (games reset when server restarts)

## Usage Tips

- Each player should use a different train color
- Enter scores immediately after each round
- The chart automatically updates for all players
- Games are automatically cleaned up when all players leave
- You can join a game by adding `?game=GAMEID` to the URL

## Troubleshooting

- If the connection is lost, refresh the page
- Make sure all players are using the same game ID
- Check that the server is running on the correct port
- Ensure all players are on the same network for local play

Enjoy your Mexican Train games! 🎲 # traintally
