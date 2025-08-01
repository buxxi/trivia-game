import Random from '../random.mjs';
import Questions from './questions.mjs';

class MathQuestions extends Questions {
    constructor(config, categoryName) {
        super(config, categoryName);
        this._expressions = [
            new ExpressionCategory([ { from: 1, to: 20 } ], 
                (values) => new Exponent(new Constant(values[0]), 2)
            ),
            new ExpressionCategory([ { from: 1, to: 20} ], 
                (values) => new SquareRoot(new Constant(Math.pow(values[0], 2)))
            ),
            new ExpressionCategory([ { from: 5, to: 10 }, { from: 1, to: 6 }, { from: 5, to: 10 }, { from: 1, to: 6 }],
                (values) => new Multiply(new Parantheses(new Subtract(new Constant(values[0]), new Constant(values[1]))), new Parantheses(new Add(new Constant(values[2]), new Constant(values[3]))))    
            ),    
            new ExpressionCategory([ { from: 1, to: 10 }, { from: 2, to: 6 }, { from: 2, to: 4 } ], 
                (values) => new Add(new Add(new Exponent(new Constant(values[0]), 1), new Exponent(new Constant(values[1]), 2)), new Exponent(new Constant(values[2]), 3))
            ),
            new ExpressionCategory([ { from: 1, to: 20 }, { from: 1, to: 20}, { from: 1, to: 20 }, { from: 1, to: 20 } ], 
                (values) => new Add(new Subtract(new Add(new Constant(values[0]), new Constant(values[1])), new Constant(values[2])), new Constant(values[3]))
            ),
            new ExpressionCategory([ { from: 5, to: 10 }, { from: 1, to: 5} ], 
                (values) => new Exponent(new Parantheses(new Subtract(new Constant(values[0]), new Constant(values[1]))), 2)
            ),
            new ExpressionCategory([ { from: -50, to: 100 }, { from: -50, to: 100} ], 
                (values) => new Add(new Constant(values[0]), new Constant(values[1]))
            ),  
            new ExpressionCategory([ { from: 100, to: 200 }, { from: 50, to: 100} ], 
                (values) => new Subtract(new Constant(values[0]), new Constant(values[1]))
            ),
            new ExpressionCategory([ { from: 5, to: 10 }, { from: 1, to: 6 }, { from: 5, to: 10 }, { from: 1, to: 6 } ],
                (values) => new Add(new Parantheses(new Multiply(new Constant(values[0]), new Constant(values[1]))), new Parantheses(new Multiply(new Constant(values[2]), new Constant(values[3]))))    
            ),
            new ExpressionCategory([ { from: 5, to: 15 }, { from: 2, to: 10}, { from: 1, to: 10}],
                (values) => new Subtract(new Parantheses(new Divide(new Constant(values[0] * values[1]), new Constant(values[1]))), new Constant(values[2]))
            )
        ];
        this._addQuestion({
			title : (_) => this._translatable("question.calculate"),
			correct : () => Random.fromArray(this._expressions).generate(),
			similar : (correct, _) => correct.alternativeValues(),
			load : (correct) => this._loadQuote(correct),
			format : (answer, _) => this._format(answer)
		});
    }

    describe() {
		return {
			name : this._translatable('title'),
			icon : 'fa-calculator',
			attribution : []
		};
	}

	async preload(language, progress) {
        progress(1, 1);
		return this._countQuestions();
	}

    _loadQuote(correct) {
        return {
            player : 'quote',
            quote : correct.display(),
            attribution : {
                title : this._translatable("title"),
                name : "" + correct.eval(),
                links : []
            }
        };
    }

    _format(num) {
        return "" + num.eval();
    }

    _countQuestions() {
        return this._expressions.map(e => {
            return e.possibleVariableCount();
        }).reduce((a, b) => a + b, 0);
    }
}

class Constant {
    constructor(number) {
        this._number = number;
    }

    eval() {
        return this._number;
    }

    display() {
        return "" + this._number;
    }
}

class SquareRoot {
    constructor(expression) {
        this._expression = expression;
    }

    eval() {
        return Math.sqrt(this._expression.eval());
    }

    display() {
        let numberText = [...this._expression.display()].map(c => c + '\u0305').join("");
        return "\u221A" + numberText;
    }
}

class Exponent {
    constructor(expression, exponent) {
        this._expression = expression;
        this._exponent = exponent;
    }

    eval() {
        return Math.pow(this._expression.eval(), this._exponent);
    }

    display() {
        let superscripts = ['\u2070', '\u00B9', '\u00B2', '\u00B3', '\u2074', '\u2075', '\u2076', '\u2077', '\u2078', '\u2079'];
        let powText = [...this._exponent.toString()].map(c => superscripts[parseInt(c)]).join("");
        return this._expression.display() + powText;
    }
}

class Add {
    constructor(left, right) {
        this._left = left;
        this._right = right;
    }

    eval() {
        return this._left.eval() + this._right.eval();
    }

    display() {
        return this._left.display() + " + " + this._right.display();
    }
}

class Subtract {
    constructor(left, right) {
        this._left = left;
        this._right = right;
    }

    eval() {
        return this._left.eval() - this._right.eval();
    }

    display() {
        return this._left.display() + " - " + this._right.display();
    }
}

class Multiply {
    constructor(left, right) {
        this._left = left;
        this._right = right;
    }

    eval() {
        return this._left.eval() * this._right.eval();
    }

    display() {
        return this._left.display() + " \u00D7 " + this._right.display();
    }
}

class Divide {
    constructor(left, right) {
        this._left = left;
        this._right = right;
    }

    eval() {
        return this._left.eval() / this._right.eval();
    }

    display() {
        return this._left.display() + " \u00F7 " + this._right.display();
    }
}

class Parantheses {
    constructor(expression) {
        this._expression = expression;
    }

    eval() {
        return this._expression.eval();
    }

    display() {
        return "(" + this._expression.display() + ")";
    }
}

class ExpressionQuestion {
    constructor(expressionResolver, values) {
        this._expressionResolver = expressionResolver;
        this._values = values;
    }

    eval() {
        return this._expressionResolver(this._values).eval();
    }

    display() {
        return this._expressionResolver(this._values).display();
    }  
    
    alternativeValues() {
        let values = this._values.slice();
        let originalValues = this._values;
        let expressionResolver = this._expressionResolver;
        let shuffleDigits = this._shuffleDigits;

        function* generator() {
            while (true) {
                switch (Random.random(5)) {
                    case 0: //Decrease random variable
                        values[Random.random(values.length)]--;
                        yield new ExpressionQuestion(expressionResolver, values);
                        break;
                    case 1: //Decrease random variable
                        values[Random.random(values.length)]++;
                        yield new ExpressionQuestion(expressionResolver, values);
                        break;
                    case 2: //Off by small amount on correct
                        yield new Constant(new ExpressionQuestion(expressionResolver, originalValues).eval() + Random.fromArray([-3, -2, -1, 1, 2, 3, 10, 10, -10, -10, 20, -20]));
                        break;
                    case 3: //Off by small amount on current
                        yield new Constant(new ExpressionQuestion(expressionResolver, values).eval() + Random.fromArray([-3, -2, -1, 1, 2, 3, 10, 10, -10, -10, 20, 20]));
                        break;
                    case 4: //Shuffle digits
                        yield new Constant(shuffleDigits(new ExpressionQuestion(expressionResolver, values).eval()));
                        break;
                }  
            }
        }

        return generator();
    }

    _shuffleDigits(input) {
        let sign = input >= 0 ? 1 : -1;
        let digits = Math.abs(input).toString().split("");
        let result = [];
        while (digits.length > 0) {
            result.push(digits.splice(Random.random(digits.length), 1)[0]);
        }
        return sign * parseInt(result.join(""));
    }
}

class ExpressionCategory {
    constructor(variables, expressionResolver) {
        this._variables = variables;
        this._expressionResolver = expressionResolver;
    }

    generate() {
        let values = this._variables.map(v => {
            return v.from + Random.random(v.to - v.from + 1);
        });
        return new ExpressionQuestion(this._expressionResolver, values);
    }

    possibleVariableCount() {
        return this._variables.map(v => {
            return v.to - v.from + 1;
        }).reduce((a, b) => a * b, 1);
    }
}

export default MathQuestions;