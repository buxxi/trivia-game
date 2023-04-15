import convert from 'convert-units';
import QuestionSelector from '../selector.mjs';
import Generators from '../generators.mjs';

class UnitQuestions {
    constructor(config) {    
		this._types = {
			type : {
				title : (correct) => "'" + this._capitalize(correct.singular) + "' is used to measure what?",
				correct : () => this._randomUnit(),
				similar : (correct) => this._allUnits(),
				format : (correct) => this._measure(correct),
				view : (correct) => this._attribution(correct),
				weight : 50
			},
			largest : {
				title : (correct) => "Which one of these is the largest?",
				correct : () => this._randomUnit(),
				similar : (correct) => this._smallerUnits(correct),
				format : (correct) => this._formatValueWithUnit(correct),
				view : (correct) => this._attribution(correct),
				weight : 25
			},
			smallest : {
				title : (correct) => "Which one of these is the smallest?",
				correct : () => this._randomUnit(),
				similar : (correct) => this._largerUnits(correct),
				format : (correct) => this._formatValueWithUnit(correct),
				view : (correct) => this._attribution(correct),
				weight : 25
			}
		};
	}

    describe() {
		return {
			name : 'Units',
			icon : 'fa-balance-scale',
			attribution : []
		};
	}

	async preload(progress) {
		progress(1, 1);
		return this._countQuestions();
    }

	async nextQuestion() {	
		let type = QuestionSelector.fromWeightedObject(this._types);

		let unit = type.correct();
		let similar = type.similar(unit);

		return ({
			text : type.title(unit),
			answers : QuestionSelector.alternatives(similar, unit, type.format),
			correct : type.format(unit),
			view : type.view(unit)
		});
	}

	_countQuestions() {
		return Object.keys(this._types).length * this._allUnits().length;
	}

	_randomUnit() {
		return QuestionSelector.fromArray(this._allUnits());
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

	_attribution(unit) {
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