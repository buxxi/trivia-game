export default function Session(totalQuestions) {
	var self = this;
	var currentQuestion = {
		answers : {}
	};
	var previousQuestions = [];
	var currentCategory = undefined;

	self.index = function() {
		return previousQuestions.length + 1;
	}

	self.total = function() {
		return totalQuestions;
	}

	self.newQuestion = function(category, question) {
		previousQuestions.forEach((q) => {
			if (q.text == question.text && q.correct == question.correct) {
				throw new Error("Duplicate question");
			}
		});
		currentQuestion = question;
		currentCategory = category;
	}

	self.endQuestion = function() {
		previousQuestions.push(currentQuestion);
	}

	self.finished = function() {
		return previousQuestions.length < totalQuestions;
	}

	self.history = function() {
		return previousQuestions;
	}

	self.question = function() {
		return currentQuestion;
	}

	self.category = function() {
		var name = currentCategory.name;
		var subCategoryName = currentQuestion.view.category
		return {
			name : name,
			fullName: name + (subCategoryName ? ": " + subCategoryName : "")
		};
	}
}