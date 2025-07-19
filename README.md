# Tally Train - Mexican Train Score Tracker

A simple, static web application for tracking Mexican Train domino game scores with friends.

## Features

- 🎮 **Game Creation**: Create new games with unique IDs
- 👥 **Player Management**: Add up to 8 players with unique train colors
- 🎨 **Color Selection**: 9 train colors (red, white, green, orange, brown, black, blue, pink, yellow)
- 📊 **Score Tracking**: Enter scores for each round
- 📈 **Visualization**: Chart.js integration for score visualization
- 📱 **Responsive Design**: Works on desktop and mobile
- 🔗 **Sharing**: Share game links with friends
- 💾 **Local Storage**: Games persist in browser

## How to Use

1. **Create a Game**: Click "Create Game" to start a new game
2. **Set Up Players**: Enter your name and select a train color
3. **Add Players**: Add friends who are playing but not on the app
4. **Track Scores**: Enter scores for each round (lower is better in Mexican Train!)
5. **View Progress**: See scores visualized in the chart
6. **Share**: Share the game link with friends

## Deployment

This is a static site that can be deployed to any static hosting service:

- **Cloudflare Pages** (Recommended)
- **Netlify**
- **GitHub Pages**
- **Vercel**

### Cloudflare Pages Deployment

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to "Pages"
3. Create new project from Git
4. Select repository: `gauchogel/traintally`
5. Configure build settings:
   - Framework preset: None
   - Build command: (leave empty)
   - Build output directory: `public`
6. Deploy!

## Technical Details

- **Frontend**: Pure HTML, CSS, JavaScript
- **Data Storage**: Browser localStorage
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **No Dependencies**: Completely static

## Game Rules

Mexican Train is a domino game where:
- Players try to get rid of their dominoes
- Lower scores are better
- Each round, players count remaining dominoes as points
- The game continues until someone reaches a target score (usually 100)

## Browser Support

Works in all modern browsers that support:
- ES6 JavaScript
- localStorage
- CSS Grid and Flexbox

## License

ISC License
