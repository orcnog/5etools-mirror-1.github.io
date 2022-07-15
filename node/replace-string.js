/**
 * @param file the path to the file in which you wish you replace a string. Ex: data/items-sw5e.json
 * @param find the simple string you want to repalce. use either find, or regex. Ex: data-card
 * @param regex the regex, wrapped in "/" slashes, that you want to match to repalce. use either find, or regex. Ex: /data-card/
 * @param replace the string you want to replace all matched instances with. Ex: datacard
 */
fs = require('fs');
ut = require("./util.js");
mu = require("./my-utils.js");

ut.ArgParser.parse();
const args = ut.ArgParser.ARGS;

const fileToChange = args.file;
const findStr = args.find;
const regexStr = args.regex?.replace(/^\/(.*)\/$/, '$1'); // get the string between "/" and "/"
const regex = new RegExp(findStr || regexStr, "g");
const replace = args.replace;
const oldFileContents = fs.readFileSync(fileToChange, "utf8").replace(/^\uFEFF/, ""); // strip BOM
let total = 0;
const replacedNewFileContents = oldFileContents.replace(regex, (x) => {total+=1;return replace});
mu.writeToFile(fileToChange, replacedNewFileContents, {count: total, phrase: "instances replaced in"});
mu.writeToFile('temp-backup-of-old-file.json', oldFileContents);