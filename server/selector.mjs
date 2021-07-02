class QuestionSelector {
	constructor() {
	}

	random(max) {
		return max * Math.random() << 0;
	}

	fromArray(arr, filter) {
		if (filter != undefined) {
			arr = arr.filter(filter);
		}
		return arr[this.random(arr.length)];
	};

	fromWeightedObject(obj) {
		let keys = Object.keys(obj);
		let total = this.sum(keys.map((k) => obj[k].weight||1));
		let randomWeight = this.random(total);

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

	splice(arr) {
		if (arr.length == 0) {
			throw new Error("Trying to splice empty array");
		}
		return arr.splice(this.random(arr.length), 1)[0];
	};

	first(arr) {
		if (arr.length == 0) {
			throw new Error("Trying to get first element of empty array");
		}
		return arr.shift();
	}

	alternatives(list, correct, toString, picker) {
		var list = list.slice();
		var result = [toString(correct)];
		while (result.length < 4) {
			if (list.length == 0) {
				return result;
			}
			var e = toString(picker(list));
			if (e == "") {
				throw new Error("Empty alternative returned");
			}

			if (result.indexOf(e) == -1) {
				result.push(e);
			}
		}
		return result;
	}

	prioritizeAlternatives() {
		for (var i = 0; i < arguments.length; i++) {
			if (arguments[i].length >= 3) {
				return arguments[i];
			}
		}
		throw new Error("None of the lists provided has enough alternatives");
	}

	sortCompareCorrect(arr, compare, correct, mapping) {
		if (mapping == undefined) {
			mapping = (i) => i;
		}
		return arr.sort((a, b) => {
			return compare(mapping(b), mapping(correct)) - compare(mapping(a), mapping(correct));
		});
	}

	hasAllCommon(arr1, arr2) {
		return this.countCommon(arr1, arr2) == arr2.length;
	}

	hasNoneCommon(arr1, arr2) {
		return this.countCommon(arr1, arr2) == 0;
	}

	countCommon(arr1, arr2) {
		if (!arr1 || !arr2) {
			return 0;
		}

		return arr1.reduce((acc, cur) => {
			if (arr2.indexOf(cur) > -1) {
				return acc + 1;
			} else {
				return acc;
			}
		}, 0);
	}

	closest(arr, from, compare) {
		return arr.filter(p => p != from).reduce((acc, cur) => {
			if (!acc || Math.abs(compare(from) - compare(cur)) < Math.abs(compare(from, acc))) {
				return cur;
			}	
			return acc;
		});
	}

	wordsFromString(s) {
		return s.split(/[^a-zA-Z0-9]/).filter((s) => s.length > 0).map((s) => s.toLowerCase());
	}

	dateDistance(a, b) {
		var dist = Math.abs(new Date(Date.parse(a)).getFullYear() - new Date(Date.parse(b)).getFullYear());
		return Math.floor(Math.log(Math.max(dist, 1)));
	}

	levenshteinDistance(a, b) { //copied from and modified to use array instead: https://gist.github.com/andrei-m/982927
		if(a.length == 0 || b.length == 0) {
			return (a || b).length;
		}
		var m = [];
		for(var i = 0; i <= b.length; i++){
			m[i] = [i];
			if(i === 0) {
				continue;
			}
			for(var j = 0; j <= a.length; j++){
				m[0][j] = j;
				if(j === 0) {
					continue;
				}
				m[i][j] = b[i - 1] == a[j - 1] ? m[i - 1][j - 1] : Math.min(
					m[i-1][j-1] + 1,
					m[i][j-1] + 1,
					m[i-1][j] + 1
				);
			}
		}
		return m[b.length][a.length];
	}

	sum(arr, func) {
		func = func || ((obj) => obj);
		return arr.map(func).reduce((a, b) => a + b, 0);
	}

	max(arr, func) {
		func = func || ((obj) => obj);
		return arr.reduce((a, b) => func(a) > func(b) ? a : b);
	}

	min(arr, func) {
		func = func || ((obj) => obj);
		return arr.reduce((a, b) => func(a) < func(b) ? a : b);
	}

	yearAlternatives(correct, maxJump) {
		return this.numericAlternatives(correct, maxJump, new Date().getFullYear());
	}

	numericAlternatives(year, maxJump, maxAllowedValue) {
		maxAllowedValue = maxAllowedValue||Infinity;
		var min = year;
		var max = min;
		var result = [];
		while (result.length < 3) {
			var diff = Math.floor(Math.random() * ((maxJump * 2) + 1)) - maxJump;
			if (diff < 0 && (min + diff) > 0) {
				min = min + diff;
				result.unshift(min);
			} else if (diff > 0 && max < maxAllowedValue) {
				max = max + diff;
				result.push(max);
			}
		}
		return result;
	}
}

export default QuestionSelector;