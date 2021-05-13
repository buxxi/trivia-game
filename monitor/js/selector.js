export default function QuestionSelector() {
	var self = this;

	self.random = function(max) {
		return max * Math.random() << 0;
	}

	self.fromArray = function(arr, filter) {
		if (filter != undefined) {
			arr = arr.filter(filter);
		}
		return arr[self.random(arr.length)];
	};

	self.fromWeightedObject = function(obj) {
		var keys = Object.keys(obj);
		var total = self.sum(keys.map((k) => obj[k].weight||1));
		var randomWeight = self.random(total);

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

	self.splice = function(arr) {
		if (arr.length == 0) {
			throw new Error("Trying to splice empty array");
		}
		return arr.splice(self.random(arr.length), 1)[0];
	};

	self.first = function(arr) {
		if (arr.length == 0) {
			throw new Error("Trying to get first element of empty array");
		}
		return arr.shift();
	}

	self.alternatives = function(list, correct, toString, picker) {
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

	self.prioritizeAlternatives = function() {
		for (var i = 0; i < arguments.length; i++) {
			if (arguments[i].length >= 3) {
				return arguments[i];
			}
		}
		throw new Error("None of the lists provided has enough alternatives");
	}

	self.sortCompareCorrect = function(arr, compare, correct, mapping) {
		if (mapping == undefined) {
			mapping = (i) => i;
		}
		return arr.sort((a, b) => {
			return compare(mapping(b), mapping(correct)) - compare(mapping(a), mapping(correct));
		});
	}

	self.hasAllCommon = function(arr1, arr2) {
		return self.countCommon(arr1, arr2) == arr2.length;
	}

	self.hasNoneCommon = function(arr1, arr2) {
		return self.countCommon(arr1, arr2) == 0;
	}

	self.countCommon = function(arr1, arr2) {
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

	self.wordsFromString = function(s) {
		return s.split(/[^a-zA-Z0-9]/).filter((s) => s.length > 0).map((s) => s.toLowerCase());
	}

	self.dateDistance = function(a, b) {
		var dist = Math.abs(new Date(Date.parse(a)).getFullYear() - new Date(Date.parse(b)).getFullYear());
		return Math.floor(Math.log(Math.max(dist, 1)));
	}

	self.levenshteinDistance = function(a, b) { //copied from and modified to use array instead: https://gist.github.com/andrei-m/982927
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

	self.sum = function(arr, func) {
		func = func || ((obj) => obj);
		return arr.map(func).reduce((a, b) => a + b, 0);
	}

	self.max = function(arr, func) {
		func = func || ((obj) => obj);
		return arr.reduce((a, b) => func(a) > func(b) ? a : b);
	}

	self.min = function(arr, func) {
		func = func || ((obj) => obj);
		return arr.reduce((a, b) => func(a) < func(b) ? a : b);
	}

	self.yearAlternatives = function(correct, maxJump) {
		return self.numericAlternatives(correct, maxJump, new Date().getFullYear());
	}

	self.numericAlternatives = function(year, maxJump, maxAllowedValue) {
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