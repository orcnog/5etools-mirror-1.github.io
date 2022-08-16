"use strict";

window.addEventListener("load", () => doPageInit());

class ConverterUiUtil {}

class BaseConverter extends BaseComponent {
	static _getDisplayMode (mode) {
		switch (mode) {
			case "html": return "HTML";
			case "md": return "Markdown";
			case "txt": return "Text";
			default: throw new Error(`Unimplemented!`);
		}
	}

	/**
	 * @param ui Converter UI instance.
	 * @param opts Options object.
	 * @param opts.converterId Converter unique ID.
	 * @param [opts.canSaveLocal] If the output of this converter is suitable for saving to local homebrew.
	 * @param opts.modes Available converter parsing modes (e.g. "txt", "html", "md")
	 * @param [opts.hasPageNumbers] If the entity has page numbers.
	 * @param [opts.titleCaseFields] Array of fields to be (optionally) title-cased.
	 * @param [opts.hasSource] If the output entities can have a source field.
	 * @param opts.prop The data prop for the output entrity.
	 */
	constructor (ui, opts) {
		super();
		this._ui = ui;

		this._converterId = opts.converterId;
		this._canSaveLocal = !!opts.canSaveLocal;
		this._modes = opts.modes;
		this._hasPageNumbers = opts.hasPageNumbers;
		this._titleCaseFields = opts.titleCaseFields;
		this._hasSource = opts.hasSource;
		this._prop = opts.prop;

		// Add default starting state from options
		this._state.mode = this._modes[0];
		if (this._hasPageNumbers) this._state.page = 0;
		if (this._titleCaseFields) this._state.isTitleCase = false;
		if (this._hasSource) this._state.source = "";

		this._addHookAll("state", this._ui.saveSettingsDebounced);
	}

	get converterId () { return this._converterId; }
	get canSaveLocal () { return this._canSaveLocal; }
	get prop () { return this._prop; }

	get source () { return this._hasSource ? this._state.source : null; }
	set source (val) {
		if (!this._hasSource) return;
		this._state.source = val;
	}
}

class CreatureConverter extends BaseConverter {
	constructor (ui) {
		super(
			ui,
			{
				converterId: "Creature",
				canSaveLocal: true,
				modes: ["txt", "md"],
				hasPageNumbers: true,
				titleCaseFields: ["name"],
				hasSource: true,
				prop: "monster",
			},
		);
	}
}

class SpellConverter extends BaseConverter {
	constructor (ui) {
		super(
			ui,
			{
				converterId: "Spell",
				canSaveLocal: true,
				modes: ["txt"],
				hasPageNumbers: true,
				titleCaseFields: ["name"],
				hasSource: true,
				prop: "spell",
			},
		);
	}
}

class ItemConverter extends BaseConverter {
	constructor (ui) {
		super(
			ui,
			{
				converterId: "Item",
				canSaveLocal: true,
				modes: ["txt"],
				hasPageNumbers: true,
				titleCaseFields: ["name"],
				hasSource: true,
				prop: "item",
			},
		);
	}
}

class FeatConverter extends BaseConverter {
	constructor (ui) {
		super(
			ui,
			{
				converterId: "Feat",
				canSaveLocal: true,
				modes: ["txt"],
				hasPageNumbers: true,
				titleCaseFields: ["name"],
				hasSource: true,
				prop: "feat",
			},
		);
	}
}

class RaceConverter extends BaseConverter {
	constructor (ui) {
		super(
			ui,
			{
				converterId: "Race",
				canSaveLocal: true,
				modes: ["md"],
				hasPageNumbers: true,
				titleCaseFields: ["name"],
				hasSource: true,
				prop: "race",
			},
		);
	}
}

class TableConverter extends BaseConverter {
	constructor (ui) {
		super(
			ui,
			{
				converterId: "Table",
				modes: ["html", "md"],
				prop: "table",
			},
		);
	}
}

class ConverterUi extends BaseComponent {
	constructor () {
		super();

		this._editorIn = null;
		this._editorOut = null;

		this._converters = {};

		this._saveInputDebounced = MiscUtil.debounce(() => StorageUtil.pSetForPage(ConverterUi.STORAGE_INPUT, this._editorIn.getValue()), 50);
		this.saveSettingsDebounced = MiscUtil.debounce(() => StorageUtil.pSetForPage(ConverterUi.STORAGE_STATE, this.getBaseSaveableState()), 50);

		this._addHookAll("state", () => this.saveSettingsDebounced());
	}

	set converters (converters) { this._converters = converters; }
	get activeConverter () { return this._converters[this._state.converter]; }

	getBaseSaveableState () {
		return {
			...super.getBaseSaveableState(),
			...Object.values(this._converters).mergeMap(it => ({[it.converterId]: it.getBaseSaveableState()})),
		};
	}

	_doRefreshAvailableSources () {
		this._state.availableSources = BrewUtil2.getSources().sort((a, b) => SortUtil.ascSortLower(a.full, b.full))
			.map(it => it.json);
	}

	async pInit () {
		// region load state
		const savedState = await StorageUtil.pGetForPage(ConverterUi.STORAGE_STATE);
		if (savedState) {
			this.setBaseSaveableStateFrom(savedState);
			Object.values(this._converters)
				.filter(it => savedState[it.converterId])
				.forEach(it => it.setBaseSaveableStateFrom(savedState[it.converterId]));
		}

		$(`#editable`).click(() => {
			this._outReadOnly = false;
			JqueryUtil.doToast({type: "warning", content: "Enabled editing. Note that edits will be overwritten as you parse new statblocks."});
		});

		/**
		 * Wrap a function in an error handler which will wipe the error output, and append future errors to it.
		 * @param pToRun
		 */
		const catchErrors = async (pToRun) => {
			try {
				$(`#lastWarnings`).hide().html("");
				$(`#lastError`).hide().html("");
				this._editorOut.resize();
				await pToRun();
			} catch (x) {
				const splitStack = x.stack.split("\n");
				const atPos = splitStack.length > 1 ? splitStack[1].trim() : "(Unknown location)";
				const message = `[Error] ${x.message} ${atPos}`;
				$(`#lastError`).show().html(message);
				this._editorOut.resize();
				setTimeout(() => { throw x; });
			}
		};

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	showWarning (text) {
		$(`#lastWarnings`).show().append(`<div>[Warning] ${text}</div>`);
		this._editorOut.resize();
	}

	doCleanAndOutput (obj, append) {
		const asCleanString = CleanUtil.getCleanJson(obj, {isFast: false});
		if (append) {
			this._outText = `${asCleanString},\n${this._outText}`;
			this._state.hasAppended = true;
		} else {
			this._outText = asCleanString;
			this._state.hasAppended = false;
		}
	}

	set _outReadOnly (val) { this._editorOut.setOptions({readOnly: val}); }

	get _outText () { return this._editorOut.getValue(); }
	set _outText (text) { this._editorOut.setValue(text, -1); }

	get inText () { return CleanUtil.getCleanString((this._editorIn.getValue() || "").trim(), {isFast: false}); }
	set inText (text) { this._editorIn.setValue(text, -1); }

	_getDefaultState () { return MiscUtil.copy(ConverterUi._DEFAULT_STATE); }
}
ConverterUi.STORAGE_INPUT = "converterInput";
ConverterUi.STORAGE_STATE = "converterState";
ConverterUi._DEFAULT_STATE = {
	hasAppended: false,
	converter: "Creature",
	sourceJson: "",
	inputSeparator: "===",
};

async function doPageInit () {
	await BrewUtil2.pInit();
	ExcludeUtil.pInitialise().then(null); // don't await, as this is only used for search
	const [spells, items, itemsRaw, legendaryGroups, classes] = await Promise.all([
		DataUtil.spell.pLoadAll(),
		Renderer.item.pBuildList(),
		DataUtil.item.loadRawJSON(),
		DataUtil.legendaryGroup.pLoadAll(),
		DataUtil.class.loadJSON(),
		BrewUtil2.pGetBrewProcessed(), // init homebrew
	]);
	SpellcastingTraitConvert.init(spells);
	ItemParser.init(items, classes);
	AcConvert.init(items);
	TaggerUtils.init({legendaryGroups, spells});
	await TagJsons.pInit({spells});
	RaceTraitTag.init({itemsRaw});

	const ui = new ConverterUi();

	const statblockConverter = new CreatureConverter(ui);
	const itemConverter = new ItemConverter(ui);
	const featConverter = new FeatConverter(ui);
	const raceConverter = new RaceConverter(ui);
	const spellConverter = new SpellConverter(ui);
	const tableConverter = new TableConverter(ui);

	ui.converters = {
		[statblockConverter.converterId]: statblockConverter,
		[itemConverter.converterId]: itemConverter,
		[featConverter.converterId]: featConverter,
		[raceConverter.converterId]: raceConverter,
		[spellConverter.converterId]: spellConverter,
		[tableConverter.converterId]: tableConverter,
	};

	return ui.pInit();
}
