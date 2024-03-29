class Selector {
	constructor() {
		throw new Error("Use only the static methods");
	}

	static arrayPercentile(arr, compare, percentile) {
		if (percentile < -1 || percentile > 1) {
			throw new Error("Percentile must be between -1 and 1");
		}

		arr.sort((a, b) => compare(b) - compare(a));
		
		let index = Math.floor(Math.abs(percentile * arr.length));

		if (percentile > 0) {
			return arr.slice(0, index);
		} else {
			return arr.slice(index);
		}
	}

	static unique(arr) {
		return arr.filter((value, index, array) => array.indexOf(value) == index);
	}

	static hasAllCommon(o1, o2, mapping = i => i) {
		let arr1 = mapping(o1);
		let arr2 = mapping(o2);

		if (!arr1 || !arr2 || arr1.length == 0 || arr2.length == 0) {
			return false;
		}

		return Selector.countCommon(arr1, arr2, e => e) == arr2.length;
	}

	static hasNoneCommon(o1, o2, mapping = i => i) {
		let arr1 = mapping(o1);
		let arr2 = mapping(o2);

		if (!arr1 || !arr2 || arr1.length == 0 || arr2.length == 0) {
			return false;
		}

		return Selector.countCommon(arr1, arr2, e => e) == 0;
	}

	static countCommon(o1, o2, mapping = i => i) {
		let arr1 = mapping(o1);
		let arr2 = mapping(o2);

		if (!arr1 || !arr2 || arr1.length == 0 || arr2.length == 0) {
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

	static closest(arr, from, compare) {
		return arr.filter(p => p != from).reduce((acc, cur) => {
			if (!acc || Math.abs(compare(from) - compare(cur)) < Math.abs(compare(from, acc))) {
				return cur;
			}	
			return acc;
		});
	}

	static charsFromString(s) {
		return s.replace(/[^a-zA-Z0-9]+/, '').split('');	
	}

	static wordsFromString(s) {
		return s.split(/[^a-zA-Z0-9]/).filter((s) => s.length > 0).map((s) => s.toLowerCase());
	}

	static dateDistance(a, b) {
		var dist = Math.abs(new Date(Date.parse(a)).getFullYear() - new Date(Date.parse(b)).getFullYear());
		return Math.floor(Math.log(Math.max(dist, 1)));
	}

	//copied from and modified to use array instead: https://gist.github.com/andrei-m/982927
	static levenshteinDistance(o1, o2, mapping = i => i) { 
		let a = mapping(o1);
		let b = mapping(o2);
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

	static sum(arr, func = obj => obj) {
		return arr.map(func).reduce((a, b) => a + b, 0);
	}

	static max(arr, func = obj => obj) {
		return arr.reduce((a, b) => func(a) > func(b) ? a : b);
	}

	static min(arr, func = obj => obj) {
		return arr.reduce((a, b) => func(a) < func(b) ? a : b);
	}
}

export default Selector;