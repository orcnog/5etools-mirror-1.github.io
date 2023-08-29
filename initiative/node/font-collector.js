const fs = require('fs');
const path = require('path');

const FONTS_DIR = path.join(__dirname, '../fonts/downloaded');

// Helper function to generate a CSS-friendly class name
function generateCssClassName(fontName) {
    return fontName.toLowerCase().replace(/\s+/g, '-');
}

// Helper function to capitalize the first letter of each word
function titleCase(str) {
    return str.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

// Read the fonts directory
fs.readdir(FONTS_DIR, (err, files) => {
    if (err) {
        console.error(`Error reading the directory: ${err}`);
        return;
    }

    let fontFaces = '';
    let cssClasses = '';
    let jsArray = [];

    files.forEach(file => {
        const ext = path.extname(file).slice(1); // get the file extension without dot
        let fontName = path.basename(file, path.extname(file)); // get the filename without extension
        fontName = titleCase(fontName); // Apply title case
        const formatMap = {
            'ttf': 'truetype',
            'otf': 'opentype',
            'woff': 'woff',
            'woff2': 'woff2'
        };

        // Create @font-face
        fontFaces += `@font-face { font-family: "${fontName}"; font-style: normal; font-weight: 400; src: local("${fontName}"), url("../fonts/downloaded/${file}") format("${formatMap[ext] || ext}"); }`;

        // Create .font- class for CSS
        cssClasses += `.font-${generateCssClassName(fontName)} { font-family: "${fontName}", sans-serif; } `;

        // Add to JS array
        jsArray.push(fontName);
    });

    // Output the generated code
    console.log("==== @font-face RULES ====");
    console.log(fontFaces);
    
    console.log("==== CSS CLASSES ====");
    console.log(cssClasses);

    console.log("==== JS ARRAY ====");
    console.log(`const fontArray = [${jsArray.map(name => `'${name}'`).join(', ')}];`);
});

