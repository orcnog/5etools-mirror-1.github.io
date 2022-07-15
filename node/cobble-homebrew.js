fs = require('fs');
ut = require("./util.js");
mu = require("./my-utils.js");

const args = process.argv.slice(2);
let finalObj = ut.readJson('../5etools-brew/sw5e/source/sw5e.json');
const itemsObj = ut.readJson('data/items-sw5e.json');
const itemsBaseObj = ut.readJson('data/items-base-sw5e.json');
let total = {
	phrase: "objects written to",
	showcount: true,
	showlines: true,
	count: 0
};

if (args.length) {
	// if there's one or more properties specified, copy only those
	args.forEach((prop) => {
		let fileObj;
		switch (prop) {
			case 'item': fileObj = itemsObj; break;
			case 'baseitem':
			case 'itemProperty':
			case 'itemProperty':
			case 'itemType':
			case 'itemEntry':
			case 'itemTypeAdditionalEntries': fileObj = itemsBaseObj; break;
			default: fileObj = null;
		}
		finalObj = mu.copyObjectsFromFile(finalObj, fileObj, prop, total);
	});
} else {
	// if no propert(ies) specified, just do them all
	finalObj = mu.copyObjectsFromFile(finalObj, itemsObj, 'item', total);
	finalObj = mu.copyObjectsFromFile(finalObj, itemsBaseObj, 'baseitem', total);
	finalObj = mu.copyObjectsFromFile(finalObj, itemsBaseObj, 'itemProperty', total);
	finalObj = mu.copyObjectsFromFile(finalObj, itemsBaseObj, 'itemType', total);
	finalObj = mu.copyObjectsFromFile(finalObj, itemsBaseObj, 'itemEntry', total);
	finalObj = mu.copyObjectsFromFile(finalObj, itemsBaseObj, 'itemTypeAdditionalEntries', total);
}

const strungified = JSON.stringify(finalObj, null, '\t');
mu.writeToFile('../5etools-brew/sw5e/source/sw5e.json', strungified, total);
