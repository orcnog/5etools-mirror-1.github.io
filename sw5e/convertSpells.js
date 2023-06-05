const powerConfig = {
	// The ID of the property that houses this entity data. Ex: "item".
	entityName5eTools: 'spell',

	// The ID of the main nested property by which entities should be uniquely keyed (no duplicates). Ex: "name".
	entityKeyByID: 'name',

	// Whether the merged entities should be reordered in alphabetical order in the returned merged object
	alphabetizeByKey: true,

	/**
	 * @function
	 * @description Convert a sw5eapi object into a valid 5eTools obj, providing flexibility to customize the structure of the returned object.
	 * @param {Object} apiobj incoming sw5eapi object (parsed from JSON)
	 * @returns {Object} converted 5eTools-formatted object
	 */
	convertTo5eToolsObj: function (apiobj) {
		if (_.isArray(apiobj) === false) {
			// actually not sure what to do if the incoming sw5eapi object isn't an array. bail!!
			return null;
		}
		let spells = [];
		for (i = 0; i < apiobj.length; i++) {

			// main converter function
			const newSpellText = convertSpellItem(apiobj[i]);

			// attempt to tag conditions, skills, spells, etc
			if (typeof newSpellText !== 'string') return;
			SpellParser.doParseText(newSpellText, {
				cbWarning: (w) => { console.log(`cbWarning: ${w}`) },
				cbOutput: (newObj) => {
					spells.push(newObj);
				}
			});
		}

		// de-dupe
		spells = mergeDupes(spells, 'name');

		const converted5eTools = {
			"spell": spells
		};

		return converted5eTools;

		/**
		 * @function
		 * @description Convert a single sw5eapi spell object entity into a text string that the native 5eTools Text utility can parse as a spell.
		 * @param {*} obj incoming sw5eapi object entity. Example: a single spell from the "spell" api Array.
		 * @returns {String} a text string similar to what you would get if you copy/pasted it straight from the sw5e.com powers page.
		 */
		function convertSpellItem(obj) {
			// Example intext:
			// Rebuke\tAt-will\tLight\t1 action\tTouch\tInstantaneous\t-\t-\tPHB\r\nYou strike a creature with the righteous fury of the Force. Make a melee force attack against the target, if the attack hits, the target takes force damage depending on its alignment: a dark-aligned creature takes 1d12 force damage, a balanced or unaligned creature takes 1d10 force damage, and a light-aligned creature takes 1d8 force damage.\r\nThe power’s damage increases by one die when you reach 5th, 11th, and 17th level.
			const name = obj.name;
			const source = obj.contentSource;
			const level = obj.level === 0 ? 'At-will' : obj.level;
			const school = obj.forceAlignment === 'None' ? '' : obj.forceAlignment.toLowerCase() + '\t';
			const castingTime = obj.castingPeriodText;
			const range = obj.range.match(/^Varies.+/) ? 'Self' : obj.range.split(' (')[0]; // just ignore text in parentheses. ex: Self (60-foot radius). it will likely get parsed from the description if nec.
			const duration = obj.duration;
			const concentration = obj.concentration ? 'Concentration' : '-';
			const prereq = obj.prerequisite ? obj.prerequisite + '\t' : (school ? '-\t' : '');
			const description = obj.description
				.replace(/\*\*\*?(.+?)\*\*\*?/g, '$1')
				.replace(/\n- /g, '\n•')
				.replace(/\b(.+)�s\b/g,'$1\'s') // e.g. monk's
				.replace(/\b(can|don|doesn|won|aren|isn)�t\b/g, '$1\'t') // e.g. doesn't
				.replace(/�|—/g, '—');

			let txt = `${name}\t${level}\t${school}${castingTime}\t${range}\t${duration}\t${concentration}\t${prereq}${source}\r\n${description}`;
			return txt;
		}
	},

	/**
	 * @function
	 * @description  A customizer function to use in lodash _.mergeWith methods for case-by-case value merge handling.
	 * @example incoming from the API {"weight": 0}, merged into local {"weight": 3}, opts to keep the value as {"weight": 3}
	 * @param {*} o "object" - value to compare from destination/existing JSON (ex: 0)
	 * @param {*} s "source" - value to compare from source/incoming JSON (ex: 3)
	 * @param {String} k "key" - this value's property ID, matching in both the destination and source objects (ex: "weight"). Read-Only.
	 * @returns {*} value you want to assign as the "merged" value (ex: 3), or undefined to fallback to using the OOTB _mergeWith logic
	 */
	mergeCustomizerFunc: function (o, s, k) {
		// if the destination value already exists (not undefined), but the incoming souce value is undefined, null, or empty, keep the existing value.
		if (o !== undefined && (s === undefined || s === null || s === "" || s === [])) return o;
		// remove unwanted spell component properties if false.
		if (k === 'components') return null;

		return undefined;
	},

	/**
	 * @function
	 * @param {String} json the stringified main "items" object
	 * @return {String} the stringified object with manual replacements made
	 */
	patchManualChanges: function (json) {
		// object manipulation (not string manipulation)...
		const objs = JSON.parse(json);
		const manualChanges = {
			"Autonomous Servant": (spell) => { if (typeof spell.entries[1] === "object") spell.entries = ["You touch one Tiny, unenhanced object that isn't attached to another object or a surface and isn't being carried by another creature. The target animates and gains little arms and legs, becoming a creature under your control until the power ends or the creature drops to 0 hit points. See the stat block for its statistics.", "As a bonus action, you can nonverbally command the creature if it is within 120 feet of you. (If you control multiple creatures with this power, you can command any or all of them at the same time, issuing the same command to each one.) You decide what action the creature will take and where it will move during its next turn, or you can issue a simple, general command, such as to fetch a {@item Code Cylinder|sw5ephb|code cylinder}, stand watch, or stack some small objects. If you issue no commands, the servant does nothing other than defend itself against hostile creatures. Once given an order, the servant continues to follow that order until its task is complete.", "When the creature drops to 0 hit points, it reverts to its original form, and any remaining damage carries over to that form.", "The creature is considered a valid target for the {@spell tracker droid interface|sw5ephb} power.", "{@creature autonomous servant|sw5ephb}"]; return spell; },
			"Copy": (spell) => { spell.entries[0] = spell.entries[0].replace(/datapad or datacard/gi, "{@item datapad|sw5ephb} or {@item datacard|sw5ephb}").replace(/such as datacrons/gi, "such as {@item datacron|sw5ephb|datacrons}"); return spell; },
			"Detonator": (spell) => { if (spell.scalingLevelDice?.scaling["1"] === "1d6") spell.scalingLevelDice.scaling["1"] = "1d6 / 1d4"; return spell; },
			"Dismantle": (spell) => { spell.time = [{ "number": 1, "unit": "action" }]; return spell; },
			"Saber Assault": (spell) => { spell.time = [{ "number": 1, "unit": "action" }]; return spell; },
			"Sonic Charge": (spell) => { if (spell.scalingLevelDice?.scaling["5"] === "1d4") spell.scalingLevelDice.scaling = { "1": "0 / 1d4", "5": "1d8 / 2d4", "11": "2d8 / 3d4", "17": "3d8 / 4d4" }; return spell; },
			"Sonic Strike": (spell) => { if (spell.scalingLevelDice?.scaling["5"] === "1d4") spell.scalingLevelDice.scaling = { "1": "0 / 1d4", "5": "1d8 / 2d4", "11": "2d8 / 3d4", "17": "3d8 / 4d4" }; return spell; },
			"Venomous Strike": (spell) => { if (spell.scalingLevelDice?.scaling["11"] === "1d8") spell.scalingLevelDice.scaling = { "1": "0 / 1d4", "5": "1d8 / 2d4", "11": "2d8 / 3d4", "17": "3d8 / 4d4" }; return spell; },
			"Vertical Maneuvering": (spell) => { if (spell.time[0]?.unit === "action; or 1 reaction") spell.time[0].unit = "reaction"; return spell; },
			"Warding Shot": (spell) => { if (spell.scalingLevelDice?.label === "NO_LABEL") spell.scalingLevelDice.label = "reduce"; return spell; },
		}
		let zeroFinds = [];
		Object.keys(manualChanges).forEach((k) => {
			const index = objs.spell.findIndex((o) => o.name === k);
			if (index > -1) {
				objs.spell[index] = manualChanges[k](objs.spell[index]); // do actual patch
			} else {
				zeroFinds.push(k);
			}
		});
		if (zeroFinds.length > 0) console.log('Could not perform manual patch on these spells:'); console.log(zeroFinds);
		return stringify(objs, null, "\t"); // function located in sw5e/utils.js
	}
}