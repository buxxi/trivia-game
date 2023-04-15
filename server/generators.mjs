class Generators {
	constructor() {
	}

	static random(list) {
		let indexes = list.map((obj, i) => i);
		function* generator() {
			while (indexes.length > 0) {
                let random = indexes.length * Math.random() << 0
				yield list[indexes.splice(random, 1)[0]];
			}
		}
		return generator();
	}

	static sorted(list) {
		return list[Symbol.iterator]();
	}

	static sortedCompareCorrect(arr, compare, correct, mapping = i => i, asc = false) {
		return Generators.sorted(arr.sort((a, b) => {
			if (asc) {
				return compare(a, correct, mapping) - compare(b, correct, mapping);
			} else {
				return compare(b, correct, mapping) - compare(a, correct, mapping);
			}
		}));
	}

	static years(correct, mapping = (year) => year) {
		let maxJump = Math.floor((new Date().getFullYear() - correct) / 5) + 5;
		return Generators.numeric(correct, maxJump, new Date().getFullYear(), mapping);
	}

	static numeric(year, maxJump, maxAllowedValue, mapping = (num) => num) {
		maxAllowedValue = maxAllowedValue||Infinity;
		var min = year;
		var max = min;
		var result = [];
		while (result.length < 3) {
			var diff = Math.floor(Math.random() * ((maxJump * 2) + 1)) - maxJump;
			if (diff < 0 && (min + diff) > 0) {
				min = min + diff;
				result.unshift(min);
			} else if (diff > 0 && (max + diff) <= maxAllowedValue) {
				max = max + diff;
				result.push(max);
			}
		}
		return Generators.sorted(result.map(mapping));
	}
}

export default Generators;