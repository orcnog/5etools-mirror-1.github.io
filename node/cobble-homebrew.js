fs = require('fs');
ut = require("./util.js");
mu = require("./my-utils.js");

const destinationPath = '../5etools-brew/sw5e/source/sw5e.json';

const paths = {
    _meta: 'homebrew/sw5e-meta.json',
    item: 'data/items-sw5e.json',
    baseitem: 'data/items-base-sw5e.json',
    itemProperty: 'data/items-base-sw5e.json',
    itemType: 'data/items-base-sw5e.json',
    itemEntry: 'data/items-base-sw5e.json',
    itemTypeAdditionalEntries: 'data/items-base-sw5e.json',
    spell: 'data/spells/spells-sw5ephb.json'
}

const args = process.argv.slice(2);
let finalObj = ut.readJson(destinationPath);
let total = {
	phrase: "objects written to",
	showcount: true,
	showlines: true,
	count: 0
};

if (args.length) {
	// if there's one or more properties specified, copy only those
	args.forEach((prop) => {
		let fileObj = ut.readJson(paths[prop]);
		finalObj = mu.copyObjectsFromFile(finalObj, fileObj, prop, total);
	});
} else {
	// if no propert(ies) specified, just do them all
    let jsons = {};
    for (var k in paths) {
        if (!jsons.hasOwnProperty(paths[k])) jsons[paths[k]] = ut.readJson(paths[k]);
        finalObj = mu.copyObjectsFromFile(finalObj, jsons[paths[k]], k, total);
    }
    // const itemsObj = ut.readJson(paths.item);
    // const itemsBaseObj = ut.readJson(paths.baseitem);
	// finalObj = mu.copyObjectsFromFile(finalObj, itemsObj, 'item', total);
	// finalObj = mu.copyObjectsFromFile(finalObj, itemsBaseObj, 'baseitem', total);
	// finalObj = mu.copyObjectsFromFile(finalObj, itemsBaseObj, 'itemProperty', total);
	// finalObj = mu.copyObjectsFromFile(finalObj, itemsBaseObj, 'itemType', total);
	// finalObj = mu.copyObjectsFromFile(finalObj, itemsBaseObj, 'itemEntry', total);
	// finalObj = mu.copyObjectsFromFile(finalObj, itemsBaseObj, 'itemTypeAdditionalEntries', total);
}

const strungified = JSON.stringify(finalObj, null, '\t');
mu.writeToFile('../5etools-brew/sw5e/source/sw5e.json', strungified, total);
