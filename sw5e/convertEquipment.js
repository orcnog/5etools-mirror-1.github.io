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
    alphabetizeByKey: true
}