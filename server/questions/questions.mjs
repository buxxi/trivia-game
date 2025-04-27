import Random from '../random.mjs';
import Translator from "#translation";

class Questions {
	constructor(config, categoryName) {
        this._types = {};
		this._translator = new Translator(`category.${categoryName}`);
    }

    async nextQuestion(game) {
		let type = Random.fromWeightedObject(this._types);

		let translator = this._translator.to(game.language());

		let correct = await type.correct(game);
		let similar = await type.similar(correct, game);
		let title = type.title(correct, translator);
		let view = type.load(correct, translator);
		let format = (answer) => `${type.format(answer, translator)}`;
		
		return {
			text : title,
			answers : this._alternatives(similar, correct, format),
			correct : format(correct),
			view : view
		};
	}

	async preload(language, progress, cache) {
		throw new Error("Needs to be implemented by child class");
	}

    describe(language) {
        throw new Error("Needs to be implemented by child class");
    }

    _countQuestions() {
        throw new Error("Needs to be implemented by child class");
	}

    _addQuestion(question) {
        this._types[Object.keys(this._types).length] = question;
    }

	_alternatives(generator, correct, toString) {
		var result = [toString(correct)];
		while (result.length < 4) {
			let value = generator.next();
			if (value.done) {
				return result;
			}
			var e = toString(value.value);
			if (e == "") {
				throw new Error("Empty alternative returned");
			}

			if (!result.some(x => e.toLowerCase() == x.toLowerCase())) {
				result.push(e);
			}
		}
		return result;
	}

	_toJSON(response) {
		if (!response.ok) {
			throw response;
		}
		return response.json();
	}

	_onlyEnglish(language) {
		if (language !== "en") {
			throw new Error(`Category doesn't support language ${language}`);
		}
	}
}

export default Questions;