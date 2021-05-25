class Session {
	constructor(totalQuestions) {
		this._currentQuestion = {
			answers : {}
		};
		this._previousQuestions = [];
		this._currentCategory = undefined;
		this._totalQuestions = totalQuestions;
	}

	index() {
		return this._previousQuestions.length + 1;
	}

	total() {
		return this._totalQuestions;
	}

	newQuestion(category, question) {
		this._previousQuestions.forEach((q) => {
			if (q.text == question.text && q.correct == question.correct) {
				throw new Error("Duplicate question");
			}
		});
		this._currentQuestion = question;
		this._currentCategory = category;
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