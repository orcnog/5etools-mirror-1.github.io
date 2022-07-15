/*
 > npm run modify optional_file_path_string
 A generic template script, to be used to parse and modify an existing JSON file with js logic.
 */

fs = require('fs');
ut = require("./util.js");
mu = require("./my-utils.js");

const args = process.argv.slice(2);
// const path = args[0];
const path = '../5etools-brew/sw5e/source/sw5e.json';  // uncomment this line (and comment the previous) to ignore the CLI argument and define the file path manually here.

let finalObj = ut.readJson(path);
let logOutput = {
	count: 0,
	phrase: "objects written to",
    showcount: true,
	showlines: true
};

    // Do something to manipulate the finalObj object...
    // increment total.count if desired



    // Finished manipulation.

let strungified = JSON.stringify(finalObj, null, '\t');

    // Or do something to manipulate the stringified text...
    // increment total.count if desired

    

    // Finshed manipulation.

mu.writeToFile(path, strungified, logOutput);
