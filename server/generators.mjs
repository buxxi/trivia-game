import Random from "./random.mjs";

class Generators {
	constructor() {
	}

	static random(list) {
		let indexes = list.map((obj, i) => i);
		function* generator() {
			while (indexes.length > 0) {
                let random = Random.random(indexes.length);
				yield list[indexes.splice(random, 1)[0]];
			}
		}
		return generator();
	}

	static inOrder(list) {
		return list[Symbol.iterator]();
	}

	static sortedCompareCorrect(arr, compare, correct, mapping = i => i, asc = false) {
		//Trying to avoid sorting the entire list since usually only the top 3 entries are fetched
		let copy = arr.slice();
		function* generator() {
			while (copy.length > 0) {
				var maxValue = -Infinity;
				var indexes = [];
				for (var i in copy) {
					let compareValue = (asc ? -1 : 1) * compare(correct, copy[i], mapping);
					if (compareValue === maxValue) {
						indexes.push(i);
					} else if (compareValue > maxValue) {
						indexes = [i];
						maxValue = compareValue;
					}
				}
				let element = copy.splice(Random.fromArray(indexes), 1);
				yield element[0];
			}
		};
		return generator();
	}

	static years(correct, mapping = (year) => year) {
		let maxJump = Math.floor((new Date().getFullYear() - correct) / 5) + 5;
		return Generators.numeric(correct, maxJump, new Date().getFullYear(), mapping);
	}

	static numeric(year, maxJump, maxAllowedValue = Infinity, mapping = (num) => num) {
		function* generator() {
			var min = year;
			var max = min;
			while (true) {
				var diff = Math.floor(Math.random() * ((maxJump * 2) + 1)) - maxJump;
				if (diff < 0 && (min + diff) > 0) {
					min = min + diff;
					yield mapping(min);
				} else if (diff > 0 && (max + diff) <= maxAllowedValue) {
					max = max + diff;
					yield mapping(max);
				}
			}
		};
		return generator();
	}
}

export default Generators;