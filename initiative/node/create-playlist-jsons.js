const fs = require('fs');
const path = require('path');

// Define the base directory relative to the script's location
const baseDir = path.join(__dirname, '../dist/audio');

// Initialize objects to store paths for ambience and playlists
let ambience = {};
let playlists = {};

// Function to load existing JSON data if the file exists, removing paths that no longer exist
function loadExistingData(filePath) {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);

        // Remove paths that no longer exist
        for (let key in jsonData) {
            jsonData[key] = jsonData[key].filter(filePath => fs.existsSync(path.join(baseDir, filePath.replace('./audio/', ''))));
            // If the array becomes empty after filtering, remove the key
            if (jsonData[key].length === 0) {
                delete jsonData[key];
            }
        }

        return jsonData;
    }
    return {};
}

// Function to recursively walk through directories and collect mp3 file paths
function walkDirectory(directory) {
    fs.readdirSync(directory, { withFileTypes: true }).forEach(dirent => {
        const fullPath = path.join(directory, dirent.name);

        if (dirent.isDirectory()) {
            // Recursively explore directories
            walkDirectory(fullPath);
        } else if (dirent.isFile() && path.extname(dirent.name) === '.mp3') {
            // Replace backslashes with forward slashes for consistency
            const relativePath = './audio/' + path.relative(baseDir, fullPath).replace(/\\/g, '/');
            // Generate key without the 'ambience' or 'music' prefix
            const relativeDir = path.relative(baseDir, path.dirname(fullPath)).replace(/\\/g, '_');
            let key = relativeDir.replace(/^(ambience_|music_)/, ''); // Remove "ambience_" or "music_"
            if (key.startsWith('starwars_')) {
                key = key.replace(/^starwars_/, 'sw_');
            }

            // Assign paths to the correct object based on their directory
            if (directory.includes('ambience')) {
                if (!ambience[key]) {
                    ambience[key] = [];
                }
                if (!ambience[key].includes(relativePath)) {
                    ambience[key].push(relativePath);
                }
            } else if (directory.includes('music')) {
                if (!playlists[key]) {
                    playlists[key] = [];
                }
                if (!playlists[key].includes(relativePath)) {
                    playlists[key].push(relativePath);
                }
            }
        }
    });
}

// Load existing data from JSON files if they exist
const ambienceJsonPath = path.join(baseDir, 'ambience.json');
const playlistsJsonPath = path.join(baseDir, 'playlists.json');

ambience = loadExistingData(ambienceJsonPath);
playlists = loadExistingData(playlistsJsonPath);

// Start walking the base directory
walkDirectory(baseDir);

// Write the updated paths back to JSON files
fs.writeFileSync(ambienceJsonPath, JSON.stringify(ambience, null, 4));
fs.writeFileSync(playlistsJsonPath, JSON.stringify(playlists, null, 4));

console.log('JSON files created/updated successfully.');
