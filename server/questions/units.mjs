import convert from 'convert-units';
import Questions from './questions.mjs';
import Generators from '../generators.mjs';
import Random from '../random.mjs';

class UnitQuestions extends Questions {
	constructor(config, categoryName) {
		super(config, categoryName);
		this._addQuestion({
			title : (correct, translator) => translator.translate("question.measure", {unit: this._capitalize(correct.singular)}),
			correct : () => this._randomUnit(),
			similar : () => this._allUnits(),
			format : (answer, translator) => this._measure(answer, translator),
			load : (correct, translator) => this._loadBlank(correct, translator),
			weight : 50
		});
		this._addQuestion({
			title : (_, translator) => translator.translate("question.largest"),
			correct : () => this._randomUnit(),
			similar : (correct) => this._smallerUnits(correct),
			format : (answer) => this._formatValueWithUnit(answer),
			load : (correct, translator) => this._loadBlank(correct, translator),
			weight : 25
		});
		this._addQuestion({
			title : (_, translator) => translator.translate("question.smallest"),
			correct : () => this._randomUnit(),
			similar : (correct) => this._largerUnits(correct),
			format : (answer) => this._formatValueWithUnit(answer),
			load : (correct, translator) => this._loadBlank(correct, translator),
			weight : 25
		});
	}

    describe(language) {
		return {
			name : this._translator.to(language).translate('title'),
			icon : 'fa-balance-scale',
			attribution : []
		};
	}

	async preload(language, progress) {
		console.log(new Set(convert().list().map(e => e.measure)));
		this._onlyEnglish(language);
		progress(1, 1);
		return this._countQuestions();
    }

	_countQuestions() {
		return Object.keys(this._types).length * convert().list().length;
	}

	_randomUnit() {
		return Random.fromArray(convert().list());
	}

	_smallerUnits(correct) {
		let result = convert().list(correct.measure).filter(e => {
			return convert(1).from(correct.abbr).to(e.abbr) > 1;
		});
		return Generators.random(result);
	}

	_largerUnits(correct) {
		let result = convert().list(correct.measure).filter(e => {
			return convert(1).from(correct.abbr).to(e.abbr) < 1;
		});
		return Generators.random(result);
	}

	_allUnits() {
		return Generators.random(convert().list());
	}

	_measure(unit, translator) {
		let key = unit.measure.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
		return translator.translate(`measure.${key}`);
	}

	_formatValueWithUnit(unit) {
		return "1 " + unit.abbr;
	}

	_capitalize(str) {
		return str[0].toUpperCase() + str.slice(1);
	}

	_loadBlank(unit, translator) {
		return {
			attribution : {
				title : translator.translate("attribution.unit"),
				name : this._capitalize(unit.singular),
				links : []
			}
		}
	}
}

export default UnitQuestions;