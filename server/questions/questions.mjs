import Random from '../random.mjs';

class Questions {
	constructor(config, categoryName) {
        this._types = {};
		this._translationBase = `category.${categoryName}`;
    }

    async nextQuestion(game) {
		let type = Random.fromWeightedObject(this._onlyAvailableTypes(game));

		let correct = await type.correct(game);
		let similar = await type.similar(correct, game);
		let title = type.title(correct);
		let view = type.load(correct);
		let format = (answer) => `${type.format(answer, correct)}`;
		
		return {
			text : title,
			answers : this._alternatives(similar, correct, format),
			correct : format(correct, correct),
			view : view
		};
	}

	async preload(language, progress, cache) {
		throw new Error("Needs to be implemented by child class");
	}

    describe() {
        throw new Error("Needs to be implemented by child class");
    }

    _countQuestions() {
        throw new Error("Needs to be implemented by child class");
	}

	_onlyAvailableTypes(game) {
		return Object.fromEntries(Object.entries(this._types).filter(([_, value]) => value.available(game)));
	}

    _addQuestion(question) {
		if (!('available' in question)) {
			question['available'] = (_) => true;
		}
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
			if (e === "") {
				throw new Error("Empty alternative returned");
			}

			if (!result.some(x => e.toLowerCase() === x.toLowerCase())) {
				result.push(e);
			}
		}
		return result;
	}

	_translatable(key, params) {
		if (params) {
			return `$(${this._translationBase}.${key}, ${JSON.stringify(params)})`;
		} else {
			return `$(${this._translationBase}.${key})`;
		}
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