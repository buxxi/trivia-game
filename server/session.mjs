class Session {
	constructor(totalQuestions, enabledCategories) {
		this._currentQuestion = {
			answers : {}
		};
		this._previousQuestions = [];
		this._currentCategory = undefined;
		this._totalQuestions = totalQuestions;

		this._enabledCategories = Object.entries(enabledCategories).filter(([category, enabled]) => enabled).reduce((obj, [category, enabled]) => {
			obj[category] = {
				weight : 2
			};

			return obj;
		}, {});	
	}

	index() {
		return this._previousQuestions.length + 1;
	}

	total() {
		return this._totalQuestions;
	}

	categoryEnabled(category) {
		return category in this._enabledCategories;
	}

	nextCategory(selector) {
		let selected = selector.fromWeightedObject(this._enabledCategories);

		let category = Object.entries(this._enabledCategories).find(([key, value]) => value == selected)[0];

		return category;
	}

	newQuestion(category, question) {
		this._previousQuestions.forEach((q) => {
			if (q.text == question.text && q.correct == question.correct) {
				throw new Error("Duplicate question");
			}
		});
		this._currentQuestion = question;
		this._currentCategory = category;

		Object.values(this._enabledCategories).forEach((value) => { value.weight *= 2; });
		this._enabledCategories[this._currentCategory.type].weight = 2;
	}

	endQuestion() {
		this._previousQuestions.push(this._currentQuestion);
	}

	finished() {
		return this._previousQuestions.length < this._totalQuestions;
	}

	history() {
		return this._previousQuestions;
	}

	question() {
		return this._currentQuestion;
	}

	category() {
		let name = this._currentCategory.name;
		let subCategoryName = this._currentQuestion.view.category
		return {
			name : name,
			fullName: name + (subCategoryName ? ": " + subCategoryName : "")
		};
	}
}

export default Session;