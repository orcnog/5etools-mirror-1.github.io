const equipmentConfig = {
    // The ID of the property that houses this entity data. Ex: "item".
    entityName5eTools: 'item',

    // The ID of the main nested property by which entities should be uniquely keyed (no duplicates). Ex: "name".
    entityKeyByID: 'name',

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
        let items = [];
        for (i = 0; i < apiobj.length; i++) {

            // main converter function
            const newItem = convertEquipmentItem(apiobj[i]);

            // attempt to tag conditions, skills, spells, etc
            if (typeof newItem.entries !== 'object') return;
            ItemParser._doItemPostProcess(newItem, {
                cbWarning: ()=>{console.log('cbWarning')},
                cbOutput: ()=>{console.log('cbOutput')}
            });

            items.push(newItem);
        }

        // de-dupe
        items = mergeDupes(items, 'name');

        // tag sw5e item references in entries (2nd attempt)
        for (var i in items) {
            for (var e in items[i].entries) {
                const nameMinusParentheses = items[i].name.replace(/\s\(.+\)/, '');
                items[i].entries[e] = tagSw5eItemsInString(items[i].entries[e], {minWords: 1, stopwords: [nameMinusParentheses]});
            }
        }

        const converted5eTools = {
            "item": items
        };

        return converted5eTools;

        /**
         * @function
         * @description Convert a single sw5eapi object entity into a valid 5eTools entity, translating custom properties and substructures
         *  from the sw5eapi object into appropriately mapped properties and subsctructures in the returned 5eTools object.
         * @param {*} obj incoming sw5eapi object entity. Example: a single item from the "equipment" api Array, such as a weapon.
         * @returns {Object} converted 5eTools-formatted object
         */
        function convertEquipmentItem(obj) {
            let isWeapon = false;
            let isRangedWeapon = false;
            let isArmor = false;
            let isFocus = false;
            let ret = {};
            ret.name = obj.name;
            ret.source = sourceString;
            ret.page = 0;
            ret.type = getItemType(obj);
            ret.rarity = getItemRarity(obj);
            // ret.age = "futuristic";
            ret.value = getItemValue(obj);
            ret.weight = getItemWeight(obj);
            ret.entries = getItemEntries(obj);
            ret.property = getItemProperty(obj);
            // ret.foundryType = getItemType(obj, true);
            ret.baseItem = getItemBaseItem(obj);
            ret.reqAttune = getItemReqAttune(obj);
            ret.recharge = getItemRecharge(obj);
            ret.charges = getItemCharges(obj);
            ret.focus = getItemFocus(obj);
            ret.poison = getItemPoison(obj);
            ret.poisonTypes = getItemPoisonTypes(obj);
            ret.vulnerable = getItemVulnerable(obj);
            ret.weapon = getItemWeapon(obj);
            ret.weaponCategory = getItemWeaponCategory(obj);
            ret.dmg1 = getItemDmg1(obj);
            ret.dmgType = getItemDmgType(obj);
            ret.dmg2 = getItemDmg2(obj);
            ret.firearm = getItemFirearm(obj);
            ret.ammunition = getItemAmmunition(obj);
            ret.ammoType = getItemAmmoType(obj);
            ret.reload = getItemReload(obj);
            ret.range = getItemRange(obj);
            ret.armor = getItemArmor(obj);
            ret.ac = getItemAc(obj);
            ret.stealth = getItemStealth(obj);
            ret.strength = getItemStrength(obj);

            // TODO: ret.immune // Array (see D:\Development\5etools-mirror-1.github.io\test\schema\items.json)
            // TODO: ret.conditionImmune // Array (see D:\Development\5etools-mirror-1.github.io\test\schema\items.json)
            // TODO: ret.bonusSpellAttack // String like "+2"
            // TODO: ret.bonusSpellSaveDc // String like "+2"
            // TODO: ret.bonusSpellDamage // String like "+2"
            // TODO: ret.bonusSavingThrow // String like "+1"
            // TODO: ret.bonusAbilityCheck // String like "+1"
            // TODO: ret.bonusProficiencyBonus // String like "+1"
            // TODO: ret.bonusAc // String like "+1"
            // TODO: ret.bonusWeapon // String like "+3"
            // TODO: ret.bonusWeaponAttack // String like "+3"
            // TODO: ret.bonusWeaponDamage // String like "+2"
            // TODO: ret.bonusWeaponCritDamage // String like "4d6"
            // TODO: ret.critThreshold // Integer. Ex: 19
            // TODO: ret.modifySpeed // Ex: {"equal":{"swim:"walk"}}, Ex2: "bonus":{"*":5}, Ex3: {"multiply":{"walk":2}}, Ex4: {"static":{"fly":150}}
            // TODO: ret.focus // Boolean, OR Array with class names. Ex: ["Druid","Warlock"]
            // TODO: ret.scfType // String enum "arcane","druid","holy"
            // TODO: ret.packContents // Array of item name strings, or objects (see D:\Development\5etools-mirror-1.github.io\data\items.json)
            // TODO: ret.containerCapacity // Complex object. Ex: {"weight":[6],"item":[{"sling bullet|phb":20,"blowgun needle|phb":50}],"weightless":true}
            // TODO: ret.atomicPackContents // Boolean. If the item's pack contents should be treated as one atomic unit, rather than handled as individual sub-items.
            // TODO: ret.carryingCapacity // Integer. Of a mount/beast, not a container.
            // TODO: ret.resist // Array of damage type strings Ex: ["lightning"]
            // TODO: ret.grantsProficiency // Boolean
            // TODO: ret.ability // Object with ability abbrevs. and int value, maybe wrapped with "static". Ex: {"str":2}, Ex 2: {"static": {"str": 21}}
            // TODO: ret.attachedSpells // Array of spell name strings. Ex: ["reincarnate"]
            // TODO: ret.spellScrollLevel // Integer
            // TODO: ret.additionalEntries // complex object (see D:\Development\5etools-mirror-1.github.io\data\items.json)
            // TODO: ret.detail1 // String. A descriptive field that can be used to complete entries in variants.
            // TODO: ret.dexterityMax // not sure if i need this?  Max dex for medium armor

            // MAYBE TODO: Vehicles as Items...
            // Possible Veh TODO: "crew": 1
            // Possible Veh TODO: "crewMax": 13
            // Possible Veh TODO: "crewMin": 3
            // Possible Veh TODO: "vehAc": 11
            // Possible Veh TODO: "vehHp": 50
            // Possible Veh TODO: "vehDmgThresh": 15
            // Possible Veh TODO: "vehSpeed": 1.5
            // Possible Veh TODO: "capPassenger": 3
            // Possible Veh TODO: "capCargo": 100,
            // Possible Veh TODO: "travelCost": 100, // in copper pieces per mi. per passenger
            // Possible Veh TODO: "shippingCost": 10, // in copper pieces per 100 lbs. per mi.
            // Possible Veh TODO: "seeAlsoVehicle": ["Sailing Ship"]

            // Possible TODO: ret.tier // String like "major" // would probably require going through every single item to decide a tier. Not likely going to do that.
            // Possible TODO: ret.reqAttuneAlt // String OR Boolean. Used for filtering.  // there's only one item in core that uses this so, probably not needed for sw5e.
            // Possible TODO: ret.reqAttuneTags // Array of objects (see D:\Development\5etools-mirror-1.github.io\test\schema\items.json). // Nothing in sw5e seems to have any attunement conditions though
            // Possible TODO: ret.valueMult // Number
            // Possible TODO: ret.weightMult // Number
            // Possible TODO: ret.wondrous // Boolean
            // Possible TODO: ret.tatoo // Boolean
            // Possible TODO: ret.curse // Boolean
            // Possible TODO: ret.sentient // Boolean
            // Possible TODO: ret.typeAlt // not sure if i need this?

            return ret;

            /**
             * @function
             * @param {Object} o entity object to parse 
             * @param {Boolean} foundry if true, return the 5etools "foundryType". default is False: return the 5etools "type"
             * @returns {String}
             */
            function getItemType(o, foundry) {
                // Mapping Notes

                // 5eTools item types:
                // $: Treasure
                // A: Ammunition
                // AF: Ammunition (futuristic)
                // AIR: Vehicle (air)
                // AT: Artisan Tool
                // EM: Eldritch Machine
                // EXP: Explosive
                // FD: Food and Drink
                // G: Adventuring Gear
                // GS: Gaming Set
                // GV: Generic Variant
                // HA: Heavy Armor
                // INS: Instrument
                // LA: Light Armor
                // M: Melee Weapon
                // MA: Medium Armor
                // MNT: Mount
                // MR: Master Rune 
                // OTH: Other
                // P: Potion
                // R: Ranged Weapon
                // RD: Rod
                // RG: Ring
                // S: Shield
                // SC: Scroll
                // SCF: Spellcasting Focus
                // SHP: Vehicle (water)
                // T: Tool
                // TAH: Tack and Harness
                // TG: Trade Good
                // VEH: Vehicle (land)
                // WD: Wand

                // API equipment types:
                //	1: Ammunition 				=> AF|consumable
                //	2: Explosive				=> EXP|consumable
                //	3: Weapon					=> M or R |weapon
                //	4: Armor					=> HA, MA, LA, or S |armor
                //	5: Storage					=> G|backpack
                //	7: Communications			=> G|equipment
                //	8: DataRecordingAndStorage	=> G|equipment
                //	9: LifeSupport				=> G|equipment
                //	10: Medical					=> G|consumable
                //	11: WeaponOrArmorAccessory	=> G|equipment
                //	12: Tool					=> AT|tool
                //	16: Utility					=> G|equipment
                //	17: GamingSet				=> GS|equipment
                //	18: MusicalInstrument		=> INS|equipment
                //	20: Clothing				=> G|equipment
                //	21: Kit						=> T|consumable
                //	22: AlcoholicBeverage		=> FD|consumable
                //	23: Spice					=> OTH|consumable

                // API enhancedItem types:
                //	1: AdventuringGear			=> G|equipment
                //	2: Armor    				=> G|equipment // TODO: convert generic variants to "GV" (ex: general augments like +1 armor)
                //	3: Consumable				=> FD|consumable // TODO: in the future, consider using P (potion) for some consumables?
                //	4: CyberneticAugmentation   => G|equipment
                //	5: DroidCustomization       => G|equipment
                //	6: Focus					=> SCF|equipment
                //	7: ItemModification			=> G|equipment
                //	8: Shield					=> S|equipment
                //	9: Weapon   				=> M or R |weapon
                //	10: ??? 					=> 
                //	11: ShipArmor            	=> G|equipment
                //	12: ShipShield          	=> G|equipment
                //	13: ShipWeapon				=> G|equipment

                const itemTypeStr = o.equipmentCategoryEnum === 1 ? "AF|consumable" :
                    o.equipmentCategoryEnum === 2 ? "EXP|consumable" :
                        o.equipmentCategoryEnum === 3 ? (
                            o.weaponClassification.indexOf("Blaster") > -1 ? "R|weapon" :
                            o.weaponClassification.indexOf("Blaster") == -1 ? "M|weapon" : "") :
                        o.equipmentCategoryEnum === 4 ? (
                            o.armorClassification.indexOf("Heavy") > -1 ? "HA|armor" :
                            o.armorClassification.indexOf("Medium") > -1 ? "MA|armor" :
                            o.armorClassification.indexOf("Light") > -1 ? "LA|armor" :
                            o.armorClassification.indexOf("Shield") > -1 ? "S|armor" : "") :
                        o.equipmentCategoryEnum === 5 ? "G|backpack" :
                        o.equipmentCategoryEnum === 7 ? "G|equipment" :
                        o.equipmentCategoryEnum === 8 ? "G|equipment" :
                        o.equipmentCategoryEnum === 9 ? "G|equipment" :
                        o.equipmentCategoryEnum === 10 ? "G|consumable" :
                        o.equipmentCategoryEnum === 11 ? "G|equipment" :
                        o.equipmentCategoryEnum === 12 ? "AT|tool" :
                        o.equipmentCategoryEnum === 16 ? "G|equipment" :
                        o.equipmentCategoryEnum === 17 ? "GS|equipment" :
                        o.equipmentCategoryEnum === 18 ? "INS|equipment" :
                        o.equipmentCategoryEnum === 20 ? "G|equipment" :
                        o.equipmentCategoryEnum === 21 ? "T|consumable" :
                        o.equipmentCategoryEnum === 22 ? "FD|consumable" :
                        o.equipmentCategoryEnum === 23 ? "OTH|consumable" :
                        o.typeEnum === 1 ? "G|equipment" :
                        o.typeEnum === 2 ? "G|equipment" :
                        o.typeEnum === 3 ? (
                            o.subtype === "adrenal" ? "FD|consumable" :
                            o.subtype === "substance" ? "FD|consumable" :
                            o.subtype === "medpac" ? "FD|consumable" :
                            o.subtype === "poison" ? "G|consumable" : // not FD (food & drink) because in SW5e poisons are seemingly only used to coat weapons and ammunition
                            o.subtype === "stimpac" ? "FD|consumable" : 
                            o.subtype === "explosive" ? "EXP|consumable" :
                            o.subtype === "ammunition" ? "AF|consumable" :
                            o.subtype === "technology" ? "G|consumable" :
                            o.subtype === "barrier" ? "G|consumable" : "G|consumable") :
                        o.typeEnum === 4 ? "G|equipment" :
                        o.typeEnum === 5 ? "G|equipment" :
                        o.typeEnum === 6 ? "SCF|equipment" :
                        o.typeEnum === 7 ? (
                            o.subtype.indexOf("focus") > -1 ? "SCF|equipment" : "G|equipment") :
                        o.typeEnum === 8 ? "S|equipment" :
                        o.typeEnum === 9 ? (
                            o.subtype.indexOf("blaster") > -1 ? "R|weapon" : "M|weapon") :
                        o.typeEnum === 10 ? "G|equipment" :
                        o.typeEnum === 11 ? "G|equipment" :
                        o.typeEnum === 12 ? "G|equipment" :
                        o.typeEnum === 13 ? "G|equipment" : "";
                if (itemTypeStr.length > 0) {
                    const itemType = itemTypeStr.split('|')[0];
                    const foundryType = itemTypeStr.split('|')[1];

                    // set some global helpers: isWeapon, isRanged and isArmor flags
                    if (itemType === "M" || itemType === "R") isWeapon = true;
                    if (itemType === "R") isRangedWeapon = true;
                    if (["HA", "MA", "LA", "S"].indexOf(itemType) > -1) isArmor = true;
                    if (itemType === "SCF") isFocus = true;

                    return foundry ? foundryType : itemType;
                }
                return undefined;
            }

            function getItemRarity(o) {
                let rarity = "none";
                if ('rarityOptionsEnum' in o && o.rarityOptionsEnum[0] === 1) rarity = "common" // Standard
                if ('rarityOptionsEnum' in o && o.rarityOptionsEnum[0] === 2) rarity = "uncommon" // Premium
                if ('rarityOptionsEnum' in o && o.rarityOptionsEnum[0] === 3) rarity = "rare" // Prototype
                if ('rarityOptionsEnum' in o && o.rarityOptionsEnum[0] === 4) rarity = "very rare" // Advanced
                if ('rarityOptionsEnum' in o && o.rarityOptionsEnum[0] === 5) rarity = "legendary" // Legendary
                if ('rarityOptionsEnum' in o && o.rarityOptionsEnum[0] === 6) rarity = "artifact" // Artifact

                return rarity;
            }

            function getItemValue(o) {
                return o.cost ? parseInt(o.cost) * 10 : undefined;
            }

            function getItemWeight(o) {
                return o.weight && parseFloat(o.weight) > 0 ? o.weight = parseFloat(o.weight) : undefined;
            }

            function getItemEntries(o) {
                let description = [];
                let txt = '';
                if ('description' in o) {
                    txt = o.description;
                } else if ('text' in o) {
                    txt = o.text.replaceAll('�','\'');
                    txt = o.text.replaceAll('—','\\u2014');
                    txt = txt.replaceAll('_**Requires attunement**_\r\n', '');
                    const bold = /\*\*(.*?)\*\*/gm;
                    txt = txt.replace(bold, '\{@b $1\}');
                    const italic1 = /\*(.*?)\*/gm;
                    const italic2 = /_(.*?)_/gm;
                    txt = txt.replace(italic1, '\{@i $1\}');
                    txt = txt.replace(italic2, '\{@i $1\}');
                }
                description = txt?.split(/(?:\r\n)+/) || [txt]; // handle new lines as new entry array items (strings)
                description.forEach((str,i,arr) => {
                    if (str) arr[i] = cleanString(str);
                });
                return description || undefined;
            }

            function getItemProperty(o) {
                // API item properties:
                // variable string values

                // 5eTools item properties:
                // 2H:  Two-Handed  (sw5e has its own two-handed: SW2)
                // A:   Ammunition  (uses ammo, not IS ammo)
                // AF:  Ammunition (futuristic) (uses ammo, not IS ammo)
                // BF:  Burst Fire  (sw5e has its own burst to replace this one)
                // EM:  Eldritch Machine (not used)
                // F:   Finesse  (sw5e has its own finesse: SWF)
                // H:   Heavy  (sw5e has its own heavy: SWH)
                // L:   Light  (sw5e has its own light: SWL)
                // LD:  Loading  (not used, i don't think)
                // OTH: Other
                // R:   Reach
                // RLD: Reload  (although sw5e has it's own Reload, we'll use this, as 5etools version has baked-in support)
                // S:   Special  (sw5e has its own special: SWS)
                // T:   Thrown  (sw5e has its own thrown: SWT)
                // V:   Versatile  (sw5e has its own versatile: SWV for weapons, and VSA for armor)
                
                // Added sw5e Weapon (PHB) properties (* has numberic property)
                // SW2: Two-Handed (replace 2H)
                // AUT: Auto
                // BST: Burst *
                // DEX: Dexterity *
                // DSG: Disguised
                // DBL: Double (*)
                // SWF: Finesse (replace F)
                // FXD: Fixed
                // SWH: Heavy (replace H)
                // HID: Hidden
                // INL: Interlocking (weapon)
                // SWL: Light (replace L)
                // LUM: Luminous
                // MOD: Modal (*)
                // PEN: Penetrating *
                // PCL: Power Cell (*)
                // RNG: Range (redundant. remove, as 5etools autodetects Range property and has special (better) handling for it)
                // RAP: Rapid *
                // RET: Returning
                // SLG: Slug Cartridge (*)
                // SWS: Special (*) (replace S)
                // SPC: Specialized
                // STR: Strength * (weapon)
                // SWT: Thrown (replace T)
                // SWV: Versatile (*) (weapon, replace V)

                // Added sw5e Weapon (WH) properties:
                // BIT: Biting
                // BRT: Bright *
                // BRU: Brutal *
                // COR: Corruption *
                // DEF: Defensive *
                // DIR: Dire *
                // DSA: Disarming
                // DSN: Disintegrate *
                // DSR: Disruptive
                // KEN: Keen *
                // MIG: Mighty
                // NEU: Neuralizing *
                // PRC: Piercing *
                // SHO: Shocking *
                // SIL: Silent (weapon)
                // SMT: Smart (*)
                // SON: Sonorous *
                // SWI: Switch
                // VSC: Vicious *

                // Added sw5e Armor (PHB) properties
                // AST: Strength * (armor)
                // BLK: Bulky
                // OBT: Obtrusive

                // Added sw5e Armor (WH) properties
                // ABS: Absorptive *
                // AGI: Agile
                // ANC: Anchor
                // AVO: Avoidant *
                // BAR: Barbed
                // CHG: Charging *
                // CON: Concealing
                // CMB: Cumbersome
                // GAU: Gauntleted
                // IMB: Imbalanced
                // IMP: Impermeable
                // INS: Insulated *
                // INT: Interlocking (armor)
                // LAM: Lambent
                // LIG: Lightweight
                // MAG: Magnetic
                // OBS: Obscured
                // POW: Powered
                // REA: Reactive
                // REG: Regulated
                // REI: Reinforced
                // RES: Responsive
                // RIG: Rigid
                // SIL: Silent (armor)
                // SPK: Spiked
                // STE: Steadfast
                // VSA: Versatile (armor)
                
                let property = [];
                if (!!o.propertiesMap) {
                    if (isRangedWeapon && ret.type !== "AF" && !o.propertiesMap["Modal"]) {
                        property.push("AF"); // uses ammo (not IS ammo)
                    }
                    if (o.propertiesMap["Range"] && o.propertiesMap["Range"].indexOf('thrown') > -1) {
                        property.push("SWT");
                    }
                    if (o.propertiesMap["Finesse"]) {
                        property.push("SWF");
                    }
                    if (o.propertiesMap["Heavy"]) {
                        property.push("SWH");
                    }
                    if (o.propertiesMap["Light"]) {
                        property.push("SWL");
                    }
                    if (o.propertiesMap["Reach"]) {
                        property.push("R");
                    }
                    // if (o.propertiesMap["Loading"]) { // not used in sw5e (i don't think)
                    //     property.push("LD");
                    // }
                    if (o.propertiesMap["Reload"]) {
                        property.push("RLD");
                    }
                    if (o.propertiesMap["Two-Handed"]) {
                        property.push("SW2");
                    }
                    if (o.propertiesMap["Versatile"] && isWeapon) {
                        property.push("SWV");
                    }
                    if (o.propertiesMap["Special"]) {
                        property.push("SWS");
                    }
                    // SW5e Weapon Properties (PHB)
                    if (o.propertiesMap["Auto"]) {
                        property.push("AUT");
                    }
                    if (o.propertiesMap["Burst"]) {
                        property.push("BST");
                        ret.burst = parseInt(o.propertiesMap.Burst.split(" ")[1]) || undefined; // Ex: "burst 3" returns 3
                    }
                    if (o.propertiesMap["Dexterity"]) {
                        property.push("DEX");
                        ret.dexterity = parseInt(o.propertiesMap.Dexterity.split(" ")[1]) || undefined; // Ex: "dexterity 13" returns 13
                    }
                    if (o.propertiesMap["Disguised"]) {
                        property.push("DSG");
                    }
                    if (o.propertiesMap["Double"]) {
                        property.push("DBL");
                    }
                    if (o.propertiesMap["Fixed"]) {
                        property.push("FXD");
                    }
                    if (o.propertiesMap["Hidden"]) {
                        property.push("HID");
                    }
                    if (o.propertiesMap["Interlocking"] && isWeapon) {
                        property.push("INL");
                    }
                    if (o.propertiesMap["Luminous"]) {
                        property.push("LUM");
                    }
                    if (o.propertiesMap["Modal"]) {
                        property.push("MOD");
                        let str = o.propertiesMap.Modal.match(/\(([^\)]+)\)/)[1] || undefined; // Ex: "Modal (Aaa and Bbb)" returns "Aaa and Bbb"
                        str = str.replace(/\btech([^-]+)\b/gi, 'tech-$1'); // modify for ex "techstaff" to "tech-staff"
                        str = tagSw5eItemsInString(str, {minWords: 1, stopwords: [ret.name]});
                        ret.modal = str;
                    }
                    if (o.propertiesMap["Penetrating"]) {
                        property.push("PEN");
                        ret.penetrating = parseInt(o.propertiesMap.Penetrating.split(" ")[1]) || undefined; // Ex: "penetrating 3" returns 3
                    }
                    if (o.propertiesMap["Power Cell"]) {
                        property.push("POW");
                    }
                    if (o.propertiesMap["Rapid"]) {
                        property.push("RAP");
                        ret.rapid = parseInt(o.propertiesMap.Rapid.split(" ")[1]) || undefined; // Ex: "rapid 3" returns 3
                    }					
                    if (o.propertiesMap["Returning"]) {
                        property.push("RET");
                    }
                    if (o.propertiesMap["Range"] && o.propertiesMap["Range"].indexOf('Slug cartridge') > -1) {
                        property.push("SLG");
                    }
                    if (o.propertiesMap["Specialized"]) {
                        property.push("SPC");
                    }
                    if (o.propertiesMap["Strength"] && isWeapon) {
                        property.push("STR");
                    }
                    // Sw5e Weapon Properties (WH)
                    if (o.propertiesMap["Biting"]) {
                        property.push("BIT");
                    }
                    if (o.propertiesMap["Bright"]) {
                        property.push("BRT");
                        ret.bright = parseInt(o.propertiesMap.Bright.split(" ")[1]) || undefined; // Ex: "bright 3" returns 3
                    }
                    if (o.propertiesMap["Brutal"]) {
                        property.push("BRU");
                        ret.brutal = parseInt(o.propertiesMap.Brutal.split(" ")[1]) || undefined; // Ex: "brutal 3" returns 3
                    }
                    if (o.propertiesMap["Corruption"]) {
                        property.push("COR");
                        ret.corruption = parseInt(o.propertiesMap.Corruption.split(" ")[1]) || undefined; // Ex: "corruption 3" returns 3
                    }
                    if (o.propertiesMap["Defensive"]) {
                        property.push("DEF");
                        ret.defensive = parseInt(o.propertiesMap.Defensive.split(" ")[1]) || undefined; // Ex: "defensive 3" returns 3
                    }
                    if (o.propertiesMap["Dire"]) {
                        property.push("DIR");
                        ret.dire = parseInt(o.propertiesMap.Dire.split(" ")[1]) || undefined; // Ex: "dire 3" returns 3
                    }
                    if (o.propertiesMap["Disarming"]) {
                        property.push("DSA");
                    }
                    if (o.propertiesMap["Disintegrate"]) {
                        property.push("DSN");
                        ret.disintegrate = parseInt(o.propertiesMap.Disintegrate.split(" ")[1]) || undefined; // Ex: "disintegrate 3" returns 3
                    }
                    if (o.propertiesMap["Disruptive"]) {
                        property.push("DSR");
                    }
                    if (o.propertiesMap["Keen"]) {
                        property.push("KEN");
                        ret.keen = parseInt(o.propertiesMap.Keen.split(" ")[1]) || undefined; // Ex: "keen 3" returns 3
                    }
                    if (o.propertiesMap["Mighty"]) {
                        property.push("MIG");
                    }
                    if (o.propertiesMap["Neuralizing"]) {
                        property.push("NEU");
                        ret.neuralizing = parseInt(o.propertiesMap.Neuralizing.split(" ")[1]) || undefined; // Ex: "neuralizing 3" returns 3
                    }
                    if (o.propertiesMap["Piercing"]) {
                        property.push("PRC");
                        ret.piercing = parseInt(o.propertiesMap.Piercing.split(" ")[1]) || undefined; // Ex: "piercing 3" returns 3
                    }
                    if (o.propertiesMap["Shocking"]) {
                        property.push("SHO");
                        ret.shocking = parseInt(o.propertiesMap.Shocking.split(" ")[1]) || undefined; // Ex: "shocking 3" returns 3
                    }
                    if (o.propertiesMap["Silent"] && isWeapon) {
                        property.push("SIL");
                    }
                    if (o.propertiesMap["Smart"]) {
                        property.push("SMT");
                    }
                    if (o.propertiesMap["Sonorous"]) {
                        property.push("SON");
                        ret.sonorous = parseInt(o.propertiesMap.Sonorous.split(" ")[1]) || undefined; // Ex: "sonorous 3" returns 3
                    }
                    if (o.propertiesMap["Switch"]) {
                        property.push("SWI");
                    }
                    if (o.propertiesMap["Vicious"]) {
                        property.push("VSC");
                        ret.vicious = parseInt(o.propertiesMap.Vicious.split(" ")[1]) || undefined; // Ex: "vicious 3" returns 3
                    }
                    // Sw5e Armor Properties (PHB)
                    if (o.propertiesMap["Bulky"]) {
                        property.push("BLK");
                    }
                    if (o.propertiesMap["Strength"] && isArmor) {
                        property.push("AST");
                    }
                    if (o.propertiesMap["Obtrusive"]) {
                        property.push("OBT");
                    }
                    // Sw5e Armor Properties (WH)
                    if (o.propertiesMap["Absorptive"]) {
                        property.push("ABS");
                        ret.absorptive = parseInt(o.propertiesMap.Absorptive.split(" ")[1]) || undefined; // Ex: "absorptive 3" returns 3
                    }
                    if (o.propertiesMap["Agile"]) {
                        property.push("AGI");
                    }
                    if (o.propertiesMap["Anchor"]) {
                        property.push("ANC");
                    }
                    if (o.propertiesMap["Avoidant"]) {
                        property.push("AVO");
                        ret.avoidant = parseInt(o.propertiesMap.Avoidant.split(" ")[1]) || undefined; // Ex: "avoidant 3" returns 3
                    }
                    if (o.propertiesMap["Barbed"]) {
                        property.push("BAR");
                    }
                    if (o.propertiesMap["Charging"]) {
                        property.push("CHG");
                        ret.charging = parseInt(o.propertiesMap.Charging.split(" ")[1]) || undefined; // Ex: "charging 3" returns 3
                    }
                    if (o.propertiesMap["Concealing"]) {
                        property.push("CON");
                    }
                    if (o.propertiesMap["Cumbersome"]) {
                        property.push("CMB");
                    }
                    if (o.propertiesMap["Gauntleted"]) {
                        property.push("GAU");
                    }
                    if (o.propertiesMap["Imbalanced"]) {
                        property.push("IMB");
                    }
                    if (o.propertiesMap["Impermeable"]) {
                        property.push("IMP");
                    }
                    if (o.propertiesMap["Insulated"]) {
                        property.push("INS");
                        ret.insulated = parseInt(o.propertiesMap.Insulated.split(" ")[1]) || undefined; // Ex: "insulated 3" returns 3
                    }
                    if (o.propertiesMap["Interlocking"] && isArmor) {
                        property.push("INT");
                    }
                    if (o.propertiesMap["Lambent"]) {
                        property.push("LAM");
                    }
                    if (o.propertiesMap["Lightweight"]) {
                        property.push("LIG");
                    }
                    if (o.propertiesMap["Magnetic"]) {
                        property.push("MAG");
                    }
                    if (o.propertiesMap["Obscured"]) {
                        property.push("OBS");
                    }
                    if (o.propertiesMap["Powered"]) {
                        property.push("POW");
                    }
                    if (o.propertiesMap["Reactive"]) {
                        property.push("REA");
                    }
                    if (o.propertiesMap["Regulated"]) {
                        property.push("REG");
                    }
                    if (o.propertiesMap["Reinforced"]) {
                        property.push("REI");
                    }
                    if (o.propertiesMap["Responsive"]) {
                        property.push("RES");
                    }
                    if (o.propertiesMap["Rigid"]) {
                        property.push("RIG");
                    }
                    if (o.propertiesMap["Silent"] && isArmor) {
                        property.push("SIL");
                    }
                    if (o.propertiesMap["Spiked"]) {
                        property.push("SPK");
                    }
                    if (o.propertiesMap["Steadfast"]) {
                        property.push("STE");
                    }
                    if (o.propertiesMap["Versatile"] && isArmor) {
                        property.push("VSA");
                    }
                }
                return property.length > 0 ? property : undefined;
            }

            function getItemBaseItem(o) {
                // String, ID of an existing item, pipe, then source
                if ((isWeapon || isFocus) && "subtype" in o && !o.subtype.match(/any /)) {
                    return o.subtype + "|orcnogSW5e";
                }
                return undefined;
            }

            function getItemReqAttune(o) {
                // String like "by a cleric or paladin of good alignment"
                return "requiresAttunement" in o && o.requiresAttunement ? true : undefined;
            }

            function getItemRecharge(o) {
                // String like "dawn"
                if ("text" in o && o.text.length > 0) {
                    const mDawn = /(?:charges?|uses?) at dawn|(?:charges?|uses?) daily at dawn|(?:charges?|uses?) each day at dawn|(?:charges|uses) and regains all of them at dawn|(?:charges|uses) and regains[^.]+each dawn|recharging them all each dawn|(?:charges|uses) that are replenished each dawn/gi.exec(o.text);
                    if (mDawn) return o.recharge = "dawn";

                    const mDusk = /(?:charges?|uses?) daily at dusk|(?:charges?|uses?) each day at dusk/gi.exec(o.text);
                    if (mDusk) return o.recharge = "dusk";

                    const mMidnight = /(?:charges?|uses?) daily at midnight|Each night at midnight[^.]+(?:charges?|uses?)/gi.exec(o.text);
                    if (mMidnight) return o.recharge = "midnight";

                    const mLong = /(?:charges?|uses?) [^\.]+ long rest|long rest [^\.]+ (?:charges?|uses?)/gi.exec(o.text);
                    if (mLong) return o.recharge = "restLong";

                    const mShort = /(?:charges?|uses?) [^\.]+ short rest|short rest [^\.]+ (?:charges?|uses?)/gi.exec(o.text);
                    if (mShort) return o.recharge = "restShort";

                    const mRound = /(?:charges?|uses?) [^\.]+ each round|each round [^\.]+ (?:charges?|uses?)/gi.exec(o.text);
                    if (mRound) return o.recharge = "round";
                }
                return undefined;
            }

            function getItemCharges(o) {
                // return an Integer or undefined
                let txt = "text" in o && o.text.length > 0 ? o.text : "";
                const mInteger = /(?:have|has|with) (\d+) charge.*?/gi.exec(txt); // Array w/ 1 int value, ex: [3] for 3 charges
                const mDiceRoll = /(?:have|has|with) (\d+)d(\d+) charges.*?/gi.exec(txt); // Array w/ 2 int values from dice roll, ex: [2,6] for 2d6
                const mNumberOfCharges = /number of charges equals? (to )?half your .*? level \(rounded up\)/gi.exec(txt); // Array or null
                if (mInteger) {
                    return mInteger[1];
                }
                if (mDiceRoll) {
                    return mDiceRoll[1] * mDiceRoll[2]; // return the max possible roll. ex: 2d6 returns 12
                }
                if (mNumberOfCharges) {
                    return 10; // assuming 20 is the PC's max class level, 10 is this item's max number of possible charges
                }
                return undefined;
            }

            function getItemWeapon() {
                // return a Boolean or undefined
                return isWeapon || undefined;
            }

            function getItemWeaponCategory(o) {
                // return String, either "Martial" or "Simple", or undefined
                if (!isWeapon) {
                    return undefined;
                }
                return o.weaponClassification && o.weaponClassification.indexOf("Martial") > -1 ? "Martial" : "Simple";
            }

            function getItemDmg1(o) {
                // return a String like "1d10" or undefined
                if (isWeapon && o.damageNumberOfDice && o.damageDieType) {
                    return o.damageNumberOfDice + "d" + o.damageDieType + (o.damageDieModifier !== 0 ? " + " + o.damageDieModifier : "");
                }
                return undefined;
            }

            function getItemDmgType(o) {
                // return a String like "N" or "Energy" or undefined
                if (isWeapon && o.damageType) {
                    let dmgType = o.damageType;
                    if (o.propertiesMap["Modal"] && dmgType === 'Unknown') {
                        dmgType = 'Special';
                    }
                    return dmgType;
                }
                return undefined;
            }

            function getItemDmg2(o) {
                // return a String like "2d6" or undefined
                if (isWeapon && o.propertiesMap && "Versatile" in o.propertiesMap) {
                    return o.propertiesMap.Versatile.split(/[()]/)[1]; // get the value between parentheses, ex: 1d10
                }
                return undefined;
            }

            function getItemFirearm() {
                // return a Boolean or undefined
                if (!isRangedWeapon) {
                    return undefined;
                }
                return true; // assume all ranged weapons in SW5e are blasters and therefore firearms
            }

            function getItemAmmunition() {
                // return a Boolean or undefined
                if (!isRangedWeapon) {
                    return undefined;
                }
                return true; // assume all ranged weapons in SW5e are blasters and therefore take ammunition
            }

            function getItemAmmoType(o) {
                // String like "crossbow bolts|phb" or undefined
                if (!isRangedWeapon) {
                    return undefined;
                }
                let ammoType = "energy cell"; // possible values: "energy cell", "modern bullet", "blowgun needle|phb", "crossbow bolt|phb", "arrow|phb", "renaissance bullet", "sling bullet|phb"
                const matchAlternativeAmmo = /[Rr]ather than traditional power cells.*?in the form of (.*?)\./;
                if (typeof o.description === "string") {
                    var match = matchAlternativeAmmo.exec(o.description);
                    if (match) {
                        ammoType = match[1] === "arrows" ? "arrow|phb" :
                        match[1] === "bolts" ? "crossbow bolts|phb" :
                        match[1].indexOf("slug cartridge") > -1 ? 'modern bullet' :
                        match[1];
                    }
                }
                return ammoType;
            }

            function getItemReload(o) {
                // return a Integer or undefined
                if (!isRangedWeapon) {
                    return undefined;
                }
                let reload = undefined;
                if ("propertiesMap" in o && "Reload" in o.propertiesMap) {
                    reload = parseInt(o.propertiesMap.Reload.split(" ")[1]); // Ex: "reload 6" returns 6
                }
                return reload;
            }

            function getItemRange(o) {
                // String like "60/120" or undefined
                let range = null;
                if (o.propertiesMap) {
                    Object.values(o.propertiesMap).forEach((v) => {
                        if (v.search(/\(range \d/g) > -1) {
                            range = (v.match(/[\d/]+/g)).join(); // filter out everything but digits and "/". Ex: "Power Cell (range 20/40)"" becomes "20/40"
                        }
                    });
                }
                return range || undefined;
            }

            function getItemArmor(o) {
                // return a Boolean or undefined
                return isArmor || undefined;
            }

            function getItemAc(o) {
                // return an Integer or undefined
                if (isArmor && 'ac' in o) {
                    return o.ac.match(/\d+/g)[0]; // Get only the AC number. Ex: filters "12 + Dex modifier (Max: 2)" to just "12". (the max:2 thing is mechanically baked into Medium Armor already)
                }
                return undefined;
            }

            function getItemStealth(o) {
                // return a Boolean or undefined
                if (isArmor && 'stealthDisadvantage' in o) {
                    return o.stealthDisadvantage;
                }
                return undefined;
            }

            function getItemStrength(o) {
                // return an Integer or undefined. In 5eTools this property is meant to only apply to ARMOR, but in sw5e they apply something extremely similar to WEAPONS as well, so I will go ahead and apply this to both too.
                if ((isArmor || isWeapon) && 'propertiesMap' in o && 'Strength' in o.propertiesMap) {
                    return parseInt(o.propertiesMap.Strength.split(" ")[1]); // Ex: "strength 11" returns 11
                }
                return undefined;
            }

            function getItemPoison(o) {
                // return a Boolean
                if (o.typeEnum === 3 && o.subtype === "poison") {
                    return true;
                }
                return undefined;
            }

            function getItemPoisonTypes(o) {
                // return a Array of strings (enum: "contact","ingested","injury","inhaled")
                if (o.typeEnum === 3 && o.subtype === "poison") {
                    // currently SW5e poison only seems to be for coating weapons and ammunition
                    return ["injury"]
                }
                return undefined;
            }

            function getItemVulnerable(o) {
                // return a Array (see D:\Development\5etools-mirror-1.github.io\test\schema\items.json)
                return undefined; // No SW5e items seem to have this property
            }

            function getItemImmune(o) {
                // return Array (see D:\Development\5etools-mirror-1.github.io\test\schema\items.json)
            }

            function getItemConditionImmune(o) {
                // return Array (see D:\Development\5etools-mirror-1.github.io\test\schema\items.json)
            }

            function getItemBonusSpellAttack(o) {
                // return String like "+2"
            }

            function getItemBonusSpellSaveDc(o) {
                // return String like "+2"
            }

            function getItemBonusSpellDamage(o) {
                // return String like "+2"
            }

            function getItemBonusSavingThrow(o) {
                // return String like "+1"
            }

            function getItemBonusAbilityCheck(o) {
                // return String like "+1"
            }

            function getItemBonusProficiencyBonus(o) {
                // return String like "+1"
            }

            function getItemBonusAc(o) {
                // return String like "+1"
            }

            function getItemBonusWeapon(o) {
                // return String like "+3"
            }

            function getItemBonusWeaponAttack(o) {
                // return String like "+3"
            }

            function getItemBonusWeaponDamage(o) {
                // return String like "+2"
            }

            function getItemBonusWeaponCritDamage(o) {
                // return String like "4d6"
            }

            function getItemCritThreshold(o) {
                // return Integer. Ex: 19
            }

            function getItemModifySpeed(o) {
                // return Object, Ex: {"equal":{"swim:"walk"}}, Ex2: "bonus":{"*":5}, Ex3: {"multiply":{"walk":2}}, Ex4: {"static":{"fly":150}}
            }

            function getItemFocus(o) {
                // return a Boolean, or Array
                if (isFocus) {
                    return true;
                    // TODO: alternatively, return Array with class names. Ex: ["Druid","Warlock"]
                }
                return undefined;
            }

            function getItemScfType(o) {
                // return a String enum "arcane","druid","holy"
            }

            function getItemPackContents(o) {
                // return a Array of item name strings, or objects (see D:\Development\5etools-mirror-1.github.io\data\items.json)
            }

            function getItemContainerCapacity(o) {
                // return a Complex object. Ex: {"weight":[6],"item":[{"sling bullet|phb":20,"blowgun needle|phb":50}],"weightless":true}
            }

            function getItemAtomicPackContents(o) {
                // return a Boolean. If the item's pack contents should be treated as one atomic unit, rather than handled as individual sub-items.
            }

            function getItemCarryingCapacity(o) {
                // return a Integer. Of a mount/beast, not a container.
            }

            function getItemResist(o) {
                // return a Array of damage type strings Ex: ["lightning"]
            }

            function getItemGrantsProficiency(o) {
                // return a Boolean
            }

            function getItemAbility(o) {
                // return a Object with ability abbrevs. and int value, maybe wrapped with "static". Ex: {"str":2}, Ex 2: {"static": {"str": 21}}
            }

            function getItemAttachedSpells(o) {
                // return a Array of spell name strings. Ex: ["reincarnate"]
            }

            function getItemSpellScrollLevel(o) {
                // return a Integer
            }

            function getItemAdditionalEntries(o) {
                // return a complex object (see D:\Development\5etools-mirror-1.github.io\data\items.json)
            }

            function getItemDetail1(o) {
                // return a String. A descriptive field that can be used to complete entries in variants.
            }

            function getItemDexterityMax(o) {
                // return a not sure if i need this?  Max dex for medium armor
            }


        }
    },

    /**
     * @function
     * @description  A customizer function to use in lodash _.mergeWith methods for case-by-case value merge handling.
     * @example {"weight": 0} merged into {"weight": 3} becomes {"weight": 3}
     * @param {*} o "object" - value to compare from destination/existing JSON (ex: 0)
     * @param {*} s "source" - value to compare from source/incoming JSON (ex: 3)
     * @param {String} k "key" - this value's property ID, matching in both the destination and source objects (ex: "weight"). Read-Only.
     * @returns {*} value you want to assign as the "merged" value (ex: 3), or undefined to fallback to using the OOTB _mergeWith logic
     */
    mergeCustomizerFunc: function (o, s, k) {
        if (o !== undefined && (s === undefined || s === null || s === "" || s === [])) return o;
        // for weight and value (cost) specifically, if a value already exists in destination, but incoming value is 0, defer to existing.
        if ((k === "weight" || k === "value") && o !== null && s === 0) return o;
        // dedupe itemProperty vals
        if (k === "property" && _.isArray(o)) {
            const dedupedarray = [...new Set([...o ,...s])];
            return dedupedarray;
          }
        return undefined;
    },

    // Whether the merged entities should be reordered in alphabetical order in the returned merged object
    alphabetizeByKey: true,

    /**
     * @function
     * @param {String} json the stringified main "items" object
     * @return {String} the stringified object with manual replacements made
     */
    patchManualChanges: function (json) {
        // if this ceases to work... try the more fragile method: after conversion, run:
        // git apply -v --ignore-space-change --ignore-whitespace patch/items-fix.patch
        const manualChanges = [
            {
                "find": "An ammo {@item pouch|orcnogSW5e} is a small {@item pouch|orcnogSW5e}, usually worn around the waist or {@item chest|orcnogSW5e}, which holds 20 {@item slug cartridge|orcnogSW5e}. When you reload a weapon, you can draw as much ammunition needed from this {@item pouch|orcnogSW5e} without using an object interaction to do so. Instead of {@item slug cartridge|orcnogSW5e}, you can instead store a {@item power cell|orcnogSW5e} which takes up the space of 10 cartridges.",
                "repl": "An ammo pouch is a small pouch, usually worn around the waist or chest, which holds 20 {@item slug cartridge|orcnogSW5e|slug cartridges}. When you reload a weapon, you can draw as much ammunition needed from this pouch without using an object interaction to do so. Instead of {@item slug cartridge|orcnogSW5e|slug cartridges}, you can instead store a {@item power cell|orcnogSW5e} which takes up the space of 10 cartridges."
            },
			{
				"find": "This belt has slots to hold 60 {@item slug cartridge|orcnogSW5e}, and can be connected to directly fuel a single blaster weapon that uses {@item slug cartridge|orcnogSW5e}. Once per turn, if the powered weapon would be reloaded, it can be done without using an action using any ammunition in the belt. Connecting or disconnecting a weapon takes an action. Replacing 10 {@item slug cartridge|orcnogSW5e} takes an action.",
				"repl": "This belt has slots to hold 60 {@item slug cartridge|orcnogSW5e|slug cartridges}, and can be connected to directly fuel a single blaster weapon that uses {@item slug cartridge|orcnogSW5e|slug cartridges}. Once per turn, if the powered weapon would be reloaded, it can be done without using an action using any ammunition in the belt. Connecting or disconnecting a weapon takes an action. Replacing 10 {@item slug cartridge|orcnogSW5e|slug cartridges} takes an action."
			},
			{
				"find": "An antitoxkit contained a variety of wide-spectrum antidote hypospray injectors that were designed to neutralize all known {@item poison|orcnogSW5e}. A kit has five charges. As an action, you can administer a charge of the kit to cure a target of one {@item poison|orcnogSW5e} affecting them or to give them advantage on saving throws against {@item poison|orcnogSW5e} for 1 hour. It confers no benefit to droids or constructs.",
				"repl": "An antitoxkit contained a variety of wide-spectrum antidote hypospray injectors that were designed to neutralize all known {@item poison|orcnogSW5e|poisons}. A kit has five charges. As an action, you can administer a charge of the kit to cure a target of one {@item poison|orcnogSW5e} affecting them or to give them advantage on saving throws against {@item poison|orcnogSW5e} for 1 hour. It confers no benefit to droids or constructs."
			},
			{
				"find": "Arrows are ammunition used in bow weapons. When you would use {@item poison|orcnogSW5e} to coat a weapon or {@item slug cartridge|orcnogSW5e} you can instead coat an arrow with the {@item poison|orcnogSW5e}. Once a {@condition poisoned} arrow hits a target, it no longer gives a bonus.",
				"repl": "Arrows are ammunition used in bow weapons. When you would use {@item poison|orcnogSW5e} to coat a weapon or {@item slug cartridge|orcnogSW5e}, you can instead coat an arrow with the {@item poison|orcnogSW5e}. Once a poisoned arrow hits a target, it no longer gives a bonus."
			},
			{
				"find": "A combustive {@item arrow|orcnogSW5e} is a specialized {@item arrow|orcnogSW5e} for use with bow weapons. When the {@item arrow|orcnogSW5e} hits another creature, object, or surface it detonates. Each creature within 5ft of the {@item arrow|orcnogSW5e} detonation must make a DC 14 Dexterity saving throw or take {@damage 1d8} fire damage. On a successful save, a creature takes half damage. Once the {@item arrow|orcnogSW5e} hits a target, it no longer gives a bonus.",
				"repl": "A combustive arrow is a specialized {@item arrow|orcnogSW5e} for use with bow weapons. When the arrow hits another creature, object, or surface it detonates. Each creature within 5ft of the arrow's detonation must make a DC 14 Dexterity saving throw or take {@damage 1d8} fire damage. On a successful save, a creature takes half damage. Once the arrow hits a target, it no longer gives a bonus."
			},
			{
				"find": "An electroshock {@item arrow|orcnogSW5e} is a specialized {@item arrow|orcnogSW5e} for use with bow weapons. When you hit a creature with this {@item arrow|orcnogSW5e}, the creature must make a DC 14 Dexterity saving throw. On a failed save, the creature takes {@damage 1d3} ion damage and becomes {@condition stunned} until the start of its next turn. On a successful save, a creature takes half damage and isn't {@condition stunned}. Once the {@item arrow|orcnogSW5e} hits a target, it no longer gives a bonus.",
				"repl": "An electroshock arrow is a specialized {@item arrow|orcnogSW5e} for use with bow weapons. When you hit a creature with this arrow, the creature must make a DC 14 Dexterity saving throw. On a failed save, the creature takes {@damage 1d3} ion damage and becomes {@condition stunned} until the start of its next turn. On a successful save, a creature takes half damage and isn't {@condition stunned}. Once the arrow hits a target, it no longer gives a bonus."
			},
			{
				"find": "A noisemaker {@item arrow|orcnogSW5e} is a specialized {@item arrow|orcnogSW5e} for use with bow weapons. When the {@item arrow|orcnogSW5e} hits another creature, object, or surface it generates an explosion of sound that can be heard up to 100 feet away. If the target of the attack is a creature, the creature must make a DC 14 Constitution saving throw. On a failed save, the creature takes {@damage 1d6} sonic damage and is {@condition deafened} until the end of its next turn. Once the {@item arrow|orcnogSW5e} hits a target, it no longer gives a bonus.",
				"repl": "A noisemaker arrow is a specialized {@item arrow|orcnogSW5e} for use with bow weapons. When the arrow hits another creature, object, or surface it generates an explosion of sound that can be heard up to 100 feet away. If the target of the attack is a creature, the creature must make a DC 14 Constitution saving throw. On a failed save, the creature takes {@damage 1d6} sonic damage and is {@condition deafened} until the end of its next turn. Once the arrow hits a target, it no longer gives a bonus."
			},
			{
				"find": "A bandolier is worn across the {@item chest|orcnogSW5e}. It has 12 pockets that can each hold a single item that weighs less than 2.00 lb, such as a vibrodagger, a fragmentation grenade, or a {@item power cell|orcnogSW5e}. Once per turn, drawing an item from a bandolier does not require your object interaction.",
				"repl": "A bandolier is worn across the chest. It has 12 pockets that can each hold a single item that weighs less than 2.00 lb, such as a vibrodagger, a fragmentation grenade, or a {@item power cell|orcnogSW5e}. Once per turn, drawing an item from a bandolier does not require your object interaction."
			},
			{
				"find": "Binders can be used to restrain a Small or Medium creature with appropriate appendages. Applying binders takes an action, and the target must make a DC 14 Strength or Dexterity saving throw (the target chooses the ability to use). A hostile creature makes this save with advantage. Breaking the binders requires a DC 20 Strength check. Escaping them requires a DC 20 Dexterity check. A set of binders comes with one key. Without the key, unlocking the binders requires a DC 15 {@item security kit|orcnogSW5e} to force open. Binders have an AC of 10 and 15 hit points. Destroying the binders frees the creature without harming it.",
				"repl": "Binders can be used to restrain a Small or Medium creature with appropriate appendages. Applying binders takes an action, and the target must make a DC 14 Strength or Dexterity saving throw (the target chooses the ability to use). A hostile creature makes this save with advantage. Breaking the binders requires a DC 20 Strength check. Escaping them requires a DC 20 Dexterity check. A set of binders comes with one key. Without the key, unlocking the binders requires a DC 15 {@skill security kit|orcnogSW5e} check to force open. Binders have an AC of 10 and 15 hit points. Destroying the binders frees the creature without harming it."
			},
            {   "find": "Rather than traditional {@item power cell|orcnogSW5e}, the blaster cannon uses a specialized {@item power generator|orcnogSW5e} that allows it to fire continuously for 10 minutes. Replacing a {@item power generator|orcnogSW5e} takes an action.",
                "repl": "Rather than traditional {@item power cell|orcnogSW5e|power cells}, the blaster cannon uses a specialized {@item power generator|orcnogSW5e} that allows it to fire continuously for 10 minutes. Replacing a {@item power generator|orcnogSW5e} takes an action."
			},
			{
				"find": "Rather than traditional {@item power cell|orcnogSW5e}, the {@item bolt-thrower|orcnogSW5e} fires specialized projectiles in the form of bolts.",
				"repl": "Rather than traditional {@item power cell|orcnogSW5e|power cells}, the {@item bolt-thrower|orcnogSW5e} fires specialized projectiles in the form of bolts."
			},
			{
				"find": "This {@item bolt|orcnogSW5e}-thrower ammunition deals {@damage 2d6} kinetic damage on a hit. Also on a hit, the creature must make a DC 14 Constitution saving throw, taking {@damage 2d4} sonic damage on a failed save.",
				"repl": "This {@item bolt-thrower|orcnogSW5e} ammunition deals {@damage 2d6} kinetic damage on a hit. Also on a hit, the creature must make a DC 14 Constitution saving throw, taking {@damage 2d4} sonic damage on a failed save."
			},
			{
				"find": "This {@item bolt|orcnogSW5e}-thrower ammunition deals {@damage 2d6} kinetic damage on a hit. Also on a hit, the creature must make a DC 14 Dexterity saving throw, taking {@damage 2d4} lightning damage on a failed save.",
				"repl": "This {@item bolt-thrower|orcnogSW5e} ammunition deals {@damage 2d6} kinetic damage on a hit. Also on a hit, the creature must make a DC 14 Dexterity saving throw, taking {@damage 2d4} lightning damage on a failed save."
			},
			{
				"find": "This {@item bolt|orcnogSW5e}-thrower ammunition deals {@damage 2d6} kinetic damage on a hit. Also on a hit, the creature must make a DC 14 Wisdom saving throw, taking {@damage 2d4} psychic damage on a failed save.",
				"repl": "This {@item bolt-thrower|orcnogSW5e} ammunition deals {@damage 2d6} kinetic damage on a hit. Also on a hit, the creature must make a DC 14 Wisdom saving throw, taking {@damage 2d4} psychic damage on a failed save."
			},
			{
				"find": "Rather than traditional {@item power cell|orcnogSW5e}, the {@item bolt|orcnogSW5e}-thrower fires specialized projectiles in the form of {@item bolt|orcnogSW5e}.",
				"repl": "Rather than traditional {@item power cell|orcnogSW5e|power cells}, the bolt-thrower fires specialized projectiles in the form of {@item bolt|orcnogSW5e|bolts}."
			},
			{
				"find": "A camtono is a secured, handle container used for transporting valuable goods. A camtono comes with one key. Without the key, unlocking the camtono requires a DC 15 {@item security kit|orcnogSW5e} to force open. It stores 5 lb., not exceeding 1/4 cubic foot, has an AC of 10, and 15 hit points. Destroying the camtono risks damaging any goods stored inside.",
				"repl": "A camtono is a secured, handle container used for transporting valuable goods. A camtono comes with one key. Without the key, unlocking the camtono requires a DC 15 {@skill security kit|orcnogSW5e} check to force open. It stores 5 lb., not exceeding 1/4 cubic foot, has an AC of 10, and 15 hit points. Destroying the camtono risks damaging any goods stored inside."
			},
			{
				"find": "Composite armor is a type of armored suit that offers a good balance of mobility and protection against most types of weapons. The micro-hydraulics of this type of powered armor provide the operator with protection, but are more bulky than mesh or {@item weave armor|orcnogSW5e}. This type of armor is rarely seen outside of professional mercenaries' and soldiers' use.",
				"repl": "Composite armor is a type of armored suit that offers a good balance of mobility and protection against most types of weapons. The micro-hydraulics of this type of powered armor provide the operator with protection, but are more bulky than mesh or {@item weave armor|orcnogSW5e|weave armors}. This type of armor is rarely seen outside of professional mercenaries' and soldiers' use."
			},
			{
				"find": "Rather than traditional {@item power cell|orcnogSW5e}, the compound bow fires specialized projectiles in the form of {@item arrow|orcnogSW5e}. You can make a ranged weapon attack only if you have ammunition to fire from the weapon. Each time you attack with the weapon, you expend one {@item arrow|orcnogSW5e}.",
                "repl": "Rather than traditional {@item power cell|orcnogSW5e|power cells}, the compound bow fires specialized projectiles in the form of {@item arrow|orcnogSW5e|arrows}. You can make a ranged weapon attack only if you have ammunition to fire from the weapon. Each time you attack with the weapon, you expend one {@item arrow|orcnogSW5e}."
			},
			{
				"find": "When you make an Intelligence ({@item slicer's kit|orcnogSW5e}) check,",
				"repl": "When you make an Intelligence ({@skill slicer's kit|orcnogSW5e}) check,"
			},
			{
				"find": "The {@item credit|orcnogSW5e} chip is a small, flat card that features a security code and algorithm memory stripes. The chip can be preloaded with a specified number of {@item credit|orcnogSW5e}, or it can draw directly from a specific account held by the user. The {@item credit|orcnogSW5e} chip can be accessed with a pin, or by a DC 15 {@item slicer's kit|orcnogSW5e} check.",
				"repl": "The credit chip is a small, flat card that features a security code and algorithm memory stripes. The chip can be preloaded with a specified number of {@item credit|orcnogSW5e|credits}, or it can draw directly from a specific account held by the user. The credit chip can be accessed with a pin, or by a DC 15 {@skill slicer's kit|orcnogSW5e} check."
			},
			{
				"find": "A datacron is a type of {@item holocron|orcnogSW5e} that can be accessed by non-Force-sensitives and are mainly used to store encrypted data. They are complete with an interactive projection to access the infor-mation.",
				"repl": "A datacron is a type of {@item holocron|orcnogSW5e} that can be accessed by non-Force-sensitives and are mainly used to store encrypted data. They are complete with an interactive projection to access the information."
			},
			{
				"find": "All non-expendable droids need recharging as they are used. The battery has ten uses. As an action, you can expend one use of the battery to stabilize a droid that has 0 hit points, without needing to make an Intelligence (Technology) check.",
				"repl": "All non-expendable droids need recharging as they are used. The battery has ten uses. As an action, you can expend one use of the battery to stabilize a droid that has 0 hit points, without needing to make an Intelligence ({@skill Technology}) check."
			},
			{
				"find": "Fiber armor is a type of armor that offers more protection than the lighter {@item combat suit|orcnogSW5e}. Fiber armor is heavier overall than {@item combat suit|orcnogSW5e}, and not quite as flexible, but many consider the trade-offs worthwhile. It is a good source of defense from physical attacks and light blaster fire.",
				"repl": "Fiber armor is a type of armor that offers more protection than the lighter {@item combat suit|orcnogSW5e}. Fiber armor is heavier overall than {@item combat suit|orcnogSW5e|combat suits}, and not quite as flexible, but many consider the trade-offs worthwhile. It is a good source of defense from physical attacks and light blaster fire."
			},
			{
				"find": "The flechette cannon does not make attack rolls. Rather than traditional {@item power cell|orcnogSW5e}, the flechette cannon uses specialized projector tanks, which, when fired, spray an area with the contents of the tank. Projector tanks require your target to make a saving throw to resist the tank�s effects. It can have different ammunition types loaded simultaneously, and you can choose which ammunition you�re using as you fire it (no action required). If you don�t meet the flechette cannon�s strength requirement, creatures have advantage on their saving throws. If you lack proficiency in the flechette cannon, you must roll the damage dice twice and take the lesser total.",
				"repl": "The flechette cannon does not make attack rolls. Rather than traditional {@item power cell|orcnogSW5e|power cells}, the flechette cannon uses specialized projector tanks, which, when fired, spray an area with the contents of the tank. Projector tanks require your target to make a saving throw to resist the tank's effects. It can have different ammunition types loaded simultaneously, and you can choose which ammunition you're using as you fire it (no action required). If you don't meet the flechette cannon's strength requirement, creatures have advantage on their saving throws. If you lack proficiency in the flechette cannon, you must roll the damage dice twice and take the lesser total."
			},
			{
				"find": "When triggered, this {@item wrist launcher|orcnogSW5e} ammunition fires a volley of ion flechette rounds in a short line 15 feet long and 5 feet wide or a long line 45 feet long and 5 feet wide. A single flechette clip holds enough ammunition for three attacks in a short line or one attack in a long line. Each creature must make a DC 14 Dexterity saving throw. A creature takes {@damage 1d6} ion damage on a failed save, or half as much as on a successful one. Any electronics within the blast radius that aren't being worn or carried are disabled until rebooted. If you lack proficiency in the {@item wrist launcher|orcnogSW5e}, you have disadvantage on damage rolls with it",
				"repl": "When triggered, this {@item wrist launcher|orcnogSW5e} ammunition fires a volley of ion flechette rounds in a short line 15 feet long and 5 feet wide or a long line 45 feet long and 5 feet wide. A single flechette clip holds enough ammunition for three attacks in a short line or one attack in a long line. Each creature must make a DC 14 Dexterity saving throw. A creature takes {@damage 1d6} ion damage on a failed save, or half as much as on a successful one. Any electronics within the blast radius that aren't being worn or carried are disabled until rebooted. If you lack proficiency in the wrist launcher, you have disadvantage on damage rolls with it"
			},
			{
				"find": "A gas cartridge is a specialized {@item slug cartridge|orcnogSW5e} for use with blaster weapons that deal kinetic damage. When you hit with a shot with the loaded weapon, the creature must make a DC 14 Constitution saving throw. On a failed save, the creature takes {@damage 1d6} {@item poison|orcnogSW5e} damage and is {@condition poisoned} until the start of its next turn. On a successful save, a creature takes half damage and isn't {@condition poisoned}.",
				"repl": "A gas cartridge is a specialized {@item slug cartridge|orcnogSW5e} for use with blaster weapons that deal kinetic damage. When you hit with a shot with the loaded weapon, the creature must make a DC 14 Constitution saving throw. On a failed save, the creature takes {@damage 1d6} poison damage and is {@condition poisoned} until the start of its next turn. On a successful save, a creature takes half damage and isn't {@condition poisoned}."
			},
			{
				"find": "A silvery-green webbing sharp to the touch, yet when liquidized causes a heightened mental state and pleasurable boost. As an action, you can apply this substance to a creature within 5 feet. For the next minute, the creature experiences a high that allows them to roll an additional {@dice d3} when making an ability check, attack roll, or saving throw using Intelligence. At the end of the high, the creature must succeed on a DC 14 Wisdom saving throw or experience a low that lasts 10 minutes, during which they must roll a {@dice d3} and subtract the result when making an ability check, attack roll, or saving throw using Intelligence. At the end of the low, the creature must make a DC 14 Constitution\",\n\t\t\t\t\"saving throw to resist addiction.",
				"repl": "A silvery-green webbing sharp to the touch, yet when liquidized causes a heightened mental state and pleasurable boost. As an action, you can apply this substance to a creature within 5 feet. For the next minute, the creature experiences a high that allows them to roll an additional {@dice d3} when making an ability check, attack roll, or saving throw using Intelligence. At the end of the high, the creature must succeed on a DC 14 Wisdom saving throw or experience a low that lasts 10 minutes, during which they must roll a {@dice d3} and subtract the result when making an ability check, attack roll, or saving throw using Intelligence. At the end of the low, the creature must make a DC 14 Constitution saving throw to resist addiction."
			},
			{
				"find": "Rather than traditional {@item power cell|orcnogSW5e}, the grenade launcher fires grenades. When firing a grenade at long range, or if you don�t meet the grenade launcher�s strength requirement, creatures within the radius of the grenade�s explosion have advantage on the saving throw. If you lack proficiency in the grenade launcher, you must roll the damage dice twice and take the lesser total.",
				"repl": "Rather than traditional {@item power cell|orcnogSW5e|power cells}, the grenade launcher fires grenades. When firing a grenade at long range, or if you don't meet the grenade launcher's strength requirement, creatures within the radius of the grenade's explosion have advantage on the saving throw. If you lack proficiency in the grenade launcher, you must roll the damage dice twice and take the lesser total."
			},
			{
				"find": "When a creature enters the fog or starts its turn there, it creature must make a DC 14 Constitution saving throw. The creature takes {@damage 2d6} {@item poison|orcnogSW5e} damage on a failed save, or half as much damage on a successful one. Additionally, on a failed save, the creature is {@condition poisoned} while it is in the cloud. Droids, constructs and humanoids wearing appropriate protective equipment are unaffected.",
				"repl": "When a creature enters the fog or starts its turn there, it creature must make a DC 14 Constitution saving throw. The creature takes {@damage 2d6} poison damage on a failed save, or half as much damage on a successful one. Additionally, on a failed save, the creature is {@condition poisoned} while it is in the cloud. Droids, constructs and humanoids wearing appropriate protective equipment are unaffected."
			},
			{
				"find": "Jetpacks are personal aerial transportation devices that allow the operator to fly into and through the air with great mobility. Activating or deactivating the jetpack requires a bonus action and, while active, you have a flying speed of 30 feet. The jetpack last for 1 minute per {@item power cell|orcnogSW5e} (to a maximum of 10 minutes) and can be recharged by a power source or replacing the {@item power cell|orcnogSW5e}.",
				"repl": "Jetpacks are personal aerial transportation devices that allow the operator to fly into and through the air with great mobility. Activating or deactivating the jetpack requires a bonus action and, while active, you have a flying speed of 30 feet. The jetpack last for 1 minute per {@item power cell|orcnogSW5e} (to a maximum of 10 minutes) and can be recharged by a power source or replacing the {@item power cell|orcnogSW5e|power cells}."
			},
			{
				"find": "Mines can be set to detonate when a creature comes within up to 15 feet of it or paired with a remote",
				"repl": "Mines can be set to detonate when a creature comes within up to 15 feet of it or paired with a {@item remote detonator|orcnogSW5e}. As an action, you can prime and set a mine on a surface you can reach, which arms at the start of your next turn. When detonated, each creature within 15 feet of it must make a DC 14 Constitution saving throw. On a failed save, a creature is {@condition poisoned} for 1 minute. At the start of an affected creature's turn, it can repeat this save, ending the effect on a success."
			},
			{
				"find": "Rather than traditional {@item power cell|orcnogSW5e}, the mortar launcher fires grenades. If you lack proficiency in the mortar launcher, you must roll the damage dice twice and take the lesser total. A mortar launcher cannot fire on targets within its short range and when firing a grenade at long range, creatures within the radius of the grenade's explosion do not have advantage on the saving throw. Additionally, when you launch a mortar at a target, you can treat the Weapon's point of origin as being 200ft in the air for the purposes of determining line of sight and cover.",
				"repl": "Rather than traditional {@item power cell|orcnogSW5e|power cells}, the mortar launcher fires grenades. If you lack proficiency in the mortar launcher, you must roll the damage dice twice and take the lesser total. A mortar launcher cannot fire on targets within its short range and when firing a grenade at long range, creatures within the radius of the grenade's explosion do not have advantage on the saving throw. Additionally, when you launch a mortar at a target, you can treat the Weapon's point of origin as being 200ft in the air for the purposes of determining line of sight and cover."
			},
			{
				"find": "As an action, you can use the poison in this {@item vial|orcnogSW5e} to coat one vibroweapon, one {@item slug cartridge|orcnogSW5e}, or one {@item wrist launcher|orcnogSW5e} {@item dart|orcnogSW5e}. A creature hit by the {@condition poisoned} weapon must make a DC 14 Constitution saving throw, taking {@damage 2d4} poison damage on a failed save or half as much on a successful one. Once applied, the poison retains potency for 1 minute before drying.",
				"repl": "As an action, you can use the poison in this {@item vial|orcnogSW5e} to coat one vibroweapon, one {@item slug cartridge|orcnogSW5e}, or one wrist launcher {@item dart|orcnogSW5e}. A creature hit by the poisoned weapon must make a DC 14 Constitution saving throw, taking {@damage 2d4} poison damage on a failed save or half as much on a successful one. Once applied, the poison retains potency for 1 minute before drying."
			},
			{
				"find": "This belt has slots to hold six {@item power cell|orcnogSW5e}, and can be connected to directly power a single blaster weapon that uses {@item power cell|orcnogSW5e}. Once per turn, if the powered weapon would be reloaded, it can be done without using an action using any ammunition in the belt. Connecting or disconnecting a weapon takes an action. Replacing an expended {@item power cell|orcnogSW5e} takes an action.",
				"repl": "This belt has slots to hold six {@item power cell|orcnogSW5e|power cells}, and can be connected to directly power a single blaster weapon that uses {@item power cell|orcnogSW5e|power cells}. Once per turn, if the powered weapon would be reloaded, it can be done without using an action using any ammunition in the belt. Connecting or disconnecting a weapon takes an action. Replacing an expended {@item power cell|orcnogSW5e} takes an action."
			},
			{
				"find": "Propulsion packs enhance underwater movement. Activating or deactivating the propulsion pack requires a bonus action and, while active, you have a swimming speed of 30 feet. The propulsion pack lasts for 1 minute per {@item power cell|orcnogSW5e} (to a maximum of 10 minutes) and can be recharged by a power source or replacing the {@item power cell|orcnogSW5e}.",
				"repl": "Propulsion packs enhance underwater movement. Activating or deactivating the propulsion pack requires a bonus action and, while active, you have a swimming speed of 30 feet. The propulsion pack lasts for 1 minute per {@item power cell|orcnogSW5e} (to a maximum of 10 minutes) and can be recharged by a power source or replacing the {@item power cell|orcnogSW5e|power cells}."
			},
			{
				"find": "A quiver which can hold up to 20 {@item arrow|orcnogSW5e}, 10 {@item bolt|orcnogSW5e}, or 10 {@item dart|orcnogSW5e}. Drawing an item from the quiver does not require an object interaction.",
				"repl": "A quiver which can hold up to 20 {@item arrow|orcnogSW5e|arrows}, 10 {@item bolt|orcnogSW5e|bolts}, or 10 {@item dart|orcnogSW5e|darts}. Drawing an item from the quiver does not require an object interaction."
			},
			{
				"find": "A repair kit included the basic tools needed to repair a droid after being damaged in combat. The kit has three",
				"repl": "A repair kit includes the basic tools needed to repair a droid after being damaged in combat. The kit has three uses. As an action, you can expend one use of the kit to restore hit points to a droid or construct within 5 feet. The creature rolls one die equal to the size of their Hit Die and regains hit points equal to the amount rolled + their Constitution modifier (minimum of one hit point). If the creature has Hit Dice of different sizes, use whichever Hit Die size they have the most of."
			},
			{
				"find": "Repulsor packs are used to slow descent from a high elevation. Activating or deactivating the repulsor pack requires a bonus action and, while active, your rate of descent slow to 60 feet per round, and you ignore the effects of wind of less than moderate speed (no more than 10 mph). The repulsor pack lasts for 1 minute per {@item power cell|orcnogSW5e} (to a maximum of 10 minutes) and can be recharged by a power source or replacing the {@item power cell|orcnogSW5e}.",
				"repl": "Repulsor packs are used to slow descent from a high elevation. Activating or deactivating the repulsor pack requires a bonus action and, while active, your rate of descent slow to 60 feet per round, and you ignore the effects of wind of less than moderate speed (no more than 10 mph). The repulsor pack lasts for 1 minute per {@item power cell|orcnogSW5e} (to a maximum of 10 minutes) and can be recharged by a power source or replacing the {@item power cell|orcnogSW5e|power cells}."
			},
            {
				"find": "Restraining {@item bolt|orcnogSW5e} are small, cylindrical devices that can be affixed to a droid in order to limit its functions and enforce its obedience. When inserted, a restraining {@item bolt|orcnogSW5e} restricts the droid from any movement its master does not desire, and also forced it to respond to signals produced by a hand-held control unit.",
                "repl": "Restraining bolts are small, cylindrical devices that can be affixed to a droid in order to limit its functions and enforce its obedience. When inserted, a restraining bolt restricts the droid from any movement its master does not desire, and also forced it to respond to signals produced by a hand-held control unit."
            },
            {
                "find": "Installing a restraining {@item bolt|orcnogSW5e} takes 1 minute. The droid must make a DC 14 Constitution saving throw. A hostile droid makes this save with advantage. On a successful save, the restraining {@item bolt|orcnogSW5e} overloads and is rendered useless. On a failed save, the restraining {@item bolt|orcnogSW5e} is correctly installed, and the control unit can be used to actively control the droid. While the control unit is inactive, the droid can act freely but it can not attempt to remove the restraining {@item bolt|orcnogSW5e}.",
				"repl": "Installing a restraining bolt takes 1 minute. The droid must make a DC 14 Constitution saving throw. A hostile droid makes this save with advantage. On a successful save, the restraining bolt overloads and is rendered useless. On a failed save, the restraining bolt is correctly installed, and the control unit can be used to actively control the droid. While the control unit is inactive, the droid can act freely but it can not attempt to remove the restraining bolt."
			},
			{
				"find": "Rather than traditional {@item power cell|orcnogSW5e}, the rocket launcher fires specialized projectiles in the form of rockets. When firing a rocket at long range, or if you don�t meet the rocket launcher�s strength requirement, creatures within the radius of the rocket�s explosion have advantage on the saving throw.",
				"repl": "Rather than traditional {@item power cell|orcnogSW5e|power cells}, the rocket launcher fires specialized projectiles in the form of rockets. When firing a rocket at long range, or if you don't meet the rocket launcher's strength requirement, creatures within the radius of the rocket's explosion have advantage on the saving throw."
			},
			{
				"find": "Rather than traditional {@item power cell|orcnogSW5e}, the rocket rifle fires specialized projectiles in the form of small missiles.",
				"repl": "Rather than traditional {@item power cell|orcnogSW5e|power cells}, the rocket rifle fires specialized projectiles in the form of small missiles."
			},
			{
				"find": "Rocket boots are a form of rocket propulsion system affixed to a pair of boots instead of being worn on the back like a standard {@item jetpack|orcnogSW5e}. Activating or deactivating the boots requires a bonus action and, while active, you have a flying speed of 25 feet. The rocket boots last for 1 minute and can be recharged by a power source or replacing the {@item power cell|orcnogSW5e}.",
				"repl": "Rocket boots are a form of rocket propulsion system affixed to a pair of boots instead of being worn on the back like a standard {@item jetpack|orcnogSW5e}. Activating or deactivating the boots requires a bonus action and, while active, you have a flying speed of 25 feet. The rocket boots last for 1 minute and can be recharged by a power source or replacing the {@item power cell|orcnogSW5e|power cells}."
			},
			{
				"find": "When you make an Intelligence ({@item security kit|orcnogSW5e}) check,",
				"repl": "When you make an Intelligence ({@skill security kit|orcnogSW5e}) check,"
			},
			{
				"find": "Before firing the {@item sentry|orcnogSW5e} gun, you must deploy it using an action unless you meet its strength requirement. Alternatively, if you're able to make multiple attacks with the {@action Attack} action, this action replaces one of them.  While deployed in this way, you treat this weapon's strength number as two steps less (from 19 to 15), your speed is reduced by half, and you cannot fire this weapon at long range. You can collapse the {@item sentry|orcnogSW5e} gun as an action or bonus action.",
				"repl": "Before firing the sentry gun, you must deploy it using an action unless you meet its strength requirement. Alternatively, if you're able to make multiple attacks with the {@action Attack} action, this action replaces one of them.  While deployed in this way, you treat this weapon's strength number as two steps less (from 19 to 15), your speed is reduced by half, and you cannot fire this weapon at long range. You can collapse the sentry gun as an action or bonus action."
			},
            {
				"find": "Rather than traditional {@item power cell|orcnogSW5e}, the shortbow fires specialized projectiles in the form of {@item arrow|orcnogSW5e}. You can make a ranged weapon attack only if you have ammunition to fire from the weapon. Each time you attack with the weapon, you expend one {@item arrow|orcnogSW5e}.",
				"repl": "Rather than traditional {@item power cell|orcnogSW5e|power cells}, the shortbow fires specialized projectiles in the form of {@item arrow|orcnogSW5e|arrows}. You can make a ranged weapon attack only if you have ammunition to fire from the weapon. Each time you attack with the weapon, you expend one {@item arrow|orcnogSW5e}."
			},
			{
				"find": "{@skill Stealth} field generators are special devices typically worn on belts that function as a portable, personal cloaking device. Activating or deactivating the generator requires a bonus action and, while active, you have advantage on Dexterity ({@skill Stealth}) ability checks that rely on sight. The generator lasts for 1 minute and can be recharged by a power source or replacing the {@item power cell|orcnogSW5e}. This effect ends early if you make an attack or cast a force- or tech- power.",
				"repl": "Stealth field generators are special devices typically worn on belts that function as a portable, personal cloaking device. Activating or deactivating the generator requires a bonus action and, while active, you have advantage on Dexterity ({@skill Stealth}) ability checks that rely on sight. The generator lasts for 1 minute and can be recharged by a power source or replacing the {@item power cell|orcnogSW5e}. This effect ends early if you make an attack or cast a force- or tech- power."
			},
			{
				"find": "Rather than traditional {@item power cell|orcnogSW5e}, the torpedo launcher fires specialized projectiles in the form of torpedoes. Torpedo launchers have advantage on attack rolls against Gargantuan creatures and disadvantage on attack rolls against Large and smaller creatures. Unlike other weapons, the torpedo launcher can only be loaded using an action, and you don't add your Dexterity modifier to damage rolls you make with it.",
				"repl": "Rather than traditional {@item power cell|orcnogSW5e|power cells}, the torpedo launcher fires specialized projectiles in the form of torpedoes. Torpedo launchers have advantage on attack rolls against Gargantuan creatures and disadvantage on attack rolls against Large and smaller creatures. Unlike other weapons, the torpedo launcher can only be loaded using an action, and you don't add your Dexterity modifier to damage rolls you make with it."
			},
			{
				"find": "Underwater {@item respirator|orcnogSW5e} are worn over the mouth and lower face. While worn, you can breath underwater, as the {@item respirator|orcnogSW5e} filters the water to create breathable oxygen. The {@item respirator|orcnogSW5e} functions for 1 hour per {@item power cell|orcnogSW5e} (to a maximum of 2 hours) and can be recharged by a power source or replacing the {@item power cell|orcnogSW5e}.",
				"repl": "Underwater respirators are worn over the mouth and lower face. While worn, you can breath underwater, as the respirator filters the water to create breathable oxygen. The respirator functions for 1 hour per {@item power cell|orcnogSW5e} (to a maximum of 2 hours) and can be recharged by a power source or replacing the {@item power cell|orcnogSW5e|power cells}."
			},
			{
				"find": "The vapor projector does not make attack rolls. Rather than traditional {@item power cell|orcnogSW5e}, the vapor projector uses specialized projector tanks, which, when fired, spray an area with the contents of the tank.",
				"repl": "The vapor projector does not make attack rolls. Rather than traditional {@item power cell|orcnogSW5e|power cells}, the vapor projector uses specialized projector tanks, which, when fired, spray an area with the contents of the tank."
            },
			{
				"find": "Projector tanks require your target to make a saving throw to resist the tank�s effects. It can have different ammunition types loaded simultaneously, and you can choose which ammunition you�re using as you fire it (no action required). If you don�t meet the vapor projector�s strength requirement, creatures have advantage on their saving throws. If you lack proficiency in the vapor projector, you must roll the damage dice twice and take the lesser total.",
				"repl": "Projector tanks require your target to make a saving throw to resist the tank's effects. It can have different ammunition types loaded simultaneously, and you can choose which ammunition you're using as you fire it (no action required). If you don't meet the vapor projector's strength requirement, creatures have advantage on their saving throws. If you lack proficiency in the vapor projector, you must roll the damage dice twice and take the lesser total."
			},
			{
				"find": "Rather than traditional {@item power cell|orcnogSW5e}, the wrist launcher fires specialized projectiles in the form of {@item dart|orcnogSW5e}, small missiles, or specialized canisters.",
				"repl": "Rather than traditional {@item power cell|orcnogSW5e|power cells}, the wrist launcher fires specialized projectiles in the form of {@item dart|orcnogSW5e|darts}, small missiles, or specialized canisters."
            }
        ]
        manualChanges.forEach((m) => {
            const find = new RegExp(m.find.escapeRegexp());
            if (json.search(find) < 0) {
                console.warn(`Could not manually replace text: \"${m.find}\"\nwith text \"${m.repl}\".`);
                return;
            }
            json = json.replace(find, m.repl);
        });
        return json;
    }
}