import convert from 'convert-units';
import Questions from './questions.mjs';
import Generators from '../generators.mjs';
import Random from '../random.mjs';

class UnitQuestions extends Questions {
    constructor(config) {
		super();
		this._addQuestion({
			title : (correct) => "'" + this._capitalize(correct.singular) + "' is used to measure what?",
			correct : () => this._randomUnit(),
			similar : () => this._allUnits(),
			format : (answer) => this._measure(answer),
			load : (correct) => this._loadBlank(correct),
			weight : 50
		});
		this._addQuestion({
			title : () => "Which one of these is the largest?",
			correct : () => this._randomUnit(),
			similar : (correct) => this._smallerUnits(correct),
			format : (answer) => this._formatValueWithUnit(answer),
			load : (correct) => this._loadBlank(correct),
			weight : 25
		});
		this._addQuestion({
			title : () => "Which one of these is the smallest?",
			correct : () => this._randomUnit(),
			similar : (correct) => this._largerUnits(correct),
			format : (answer) => this._formatValueWithUnit(answer),
			load : (correct) => this._loadBlank(correct),
			weight : 25
		});
	}

    describe() {
		return {
			name : 'Units',
			icon : 'fa-balance-scale',
			attribution : []
		};
	}

	async preload(language, progress) {
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

	_measure(unit) {
		return this._capitalize(unit.measure.replace(/([A-Z])/g, ' $1'));
	}

	_formatValueWithUnit(unit) {
		return "1 " + unit.abbr;
	}

	_capitalize(str) {
		return str[0].toUpperCase() + str.slice(1);
	}

	_loadBlank(unit) {
		return {
			attribution : {
				title : "Unit",
				name : this._capitalize(unit.singular),
				links : []
			}
		}
	}
}

export default UnitQuestions;