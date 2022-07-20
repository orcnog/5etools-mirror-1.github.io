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
		results = mu.copyObjectsFromFile(finalObj, fileObj, prop, total);
        finalObj = results.final;
        total.count = results.total.count;
	});
} else {
	// if no propert(ies) specified, just do them all
    for (var k in paths) {
        results = mu.copyObjectsFromFile(finalObj, paths[k], k, total);
        finalObj = results.final;
        total.count = results.total.count;
    }
}

const strungified = JSON.stringify(finalObj, null, '\t');
mu.writeToFile('../5etools-brew/sw5e/source/sw5e.json', strungified, total);
