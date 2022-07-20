fs = require('fs');
ut = require("./util.js");
/**
 * @param {String} path file path to write to
 * @param {String} data string to write
 * @param {Object}  [logOutput] optional object
 * @param {Integer} [logOutput.count] an integer count of some occurrence
 * @param {String}  [logOutput.phrase] a phrase to use in the console output, like "instances replaced in"
 * @param {Boolean} [logOutput.showcount] show the console output of the total count + phrase + path.  Default is true if logOutput.count exists.
 * @param {Boolean} [logOutput.showlines] show the console output of the total number of lines of text in the modified file. Default is false.
 */
function writeToFile (path, data, logOutput) {
	fs.writeFile(path, data, function (err) {
		if (err) return console.log(err);
		if (logOutput) {
			if (logOutput.showcount !== false) {
				console.log(`${yellow(logOutput.count)} ${logOutput.phrase || 'in'} "${path}".`);
			}
			if (logOutput.showlines === true) {
				countFileLines(path).then((lines) => {
					console.log('New file length: ' + yellow(lines) + ' lines.');
				});
			}
		}
	});
}

function yellow (str) {
	return '\x1b[33m' + str + '\x1b[0m';
}

function copyObjectsFromFile (finalObjToUpdate, filePath, prop, total) {
	const copiedObj = ut.readJson(filePath)[prop];
	finalObjToUpdate[prop] = copiedObj;
	const length = Object.keys(copiedObj).length;
	total.count += length;
	console.log(`Copying ${yellow(length)} ${prop} objects from ${filePath}...`);
	return {final: finalObjToUpdate, total: total};
}

function countFileLines (filePath) {
	return new Promise((resolve, reject) => {
	let lineCount = 0;
	fs.createReadStream(filePath)
		.on("data", (buffer) => {
		let idx = -1;
		lineCount--; // Because the loop will run once for idx=-1
		do {
			idx = buffer.indexOf(10, idx+1);
			lineCount++;
		} while (idx !== -1);
		}).on("end", () => {
		resolve(lineCount);
		}).on("error", reject);
	});
}

module.exports = {
	writeToFile,
	yellow,
	copyObjectsFromFile,
	countFileLines
};