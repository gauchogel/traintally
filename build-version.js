const fs = require('fs');
const { execSync } = require('child_process');

// Get current git commit hash
function getGitCommitHash() {
    try {
        return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
        console.log('Could not get git commit hash, using timestamp');
        return new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    }
}

// Read the HTML file
const htmlPath = './public/index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// Get current commit hash
const commitHash = getGitCommitHash();

// Replace the version placeholder
html = html.replace(
    /<span id="versionHash"><\/span>/,
    `<span id="versionHash">${commitHash}</span>`
);

// Write back to file
fs.writeFileSync(htmlPath, html);

console.log(`Updated version to: ${commitHash}`); 