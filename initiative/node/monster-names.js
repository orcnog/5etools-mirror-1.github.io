const fs = require('fs-extra');
const path = require('path');

// The directory containing the bestiary JSON files
const BESTIARY_DIR = path.join(__dirname, '..', '..', 'data', 'bestiary');

// The output file path
const OUTPUT_FILE = path.join(__dirname, 'monster-names.txt');

// Helper function to remove text inside parentheses
function removeParentheticals(text) {
    return text.replace(/\s*\([^)]*\)/, '').trim();
}

// Read all files from the bestiary directory
fs.readdir(BESTIARY_DIR, (err, files) => {
    if (err) {
        console.error('Error reading the directory:', err);
        return;
    }

    let monsterNames = [];

    // Process each file
    for (let file of files) {
        if (file.startsWith('bestiary-') && file.endsWith('.json')) {
            let jsonData = fs.readJsonSync(path.join(BESTIARY_DIR, file));
            let names = jsonData.monster.map(monster => removeParentheticals(monster.name));
            monsterNames.push(...names);
        }
    }

    // Filter out duplicates
    let uniqueMonsterNames = [...new Set(monsterNames)];

    // Sort the names alphabetically
    uniqueMonsterNames.sort();

    // Write to the output file
    fs.writeFileSync(OUTPUT_FILE, uniqueMonsterNames.join('\n'));

    console.log(`Processed ${uniqueMonsterNames.length} unique monster names. Output written to ${OUTPUT_FILE}`);
});
