import QuestionSelector from "./selector.mjs";

class Random {
	constructor() {
	}

    static random(max) {
		return max * Math.random() << 0;
	}

	static fromArray(arr, filter) {
		if (filter != undefined) {
			arr = arr.filter(filter);
		}
		return arr[Random.random(arr.length)];
	}

    static fromWeightedObject(obj) {
		let keys = Object.keys(obj);
		let total = QuestionSelector.sum(keys.map((k) => obj[k].weight||1));
		let randomWeight = Random.random(total);

		var index = 0;
		while (randomWeight > 0) {
			randomWeight -= obj[keys[index]].weight||1;
			index++;
		}
		if (randomWeight < 0) {
			index--;
		}

		return obj[keys[index]];
	}

}

export default Random;