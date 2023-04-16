import QuestionSelector from '../selector.mjs';
import Generators from '../generators.mjs';
import Random from '../random.mjs';

class MathQuestions {
    constructor(config) {
        this._expressions = [
            new ExpressionGenerator([ { from: 1, to: 20 } ], 
                (values) => new Exponent(new Constant(values[0]), 2)
            ),
            new ExpressionGenerator([ { from: 1, to: 20} ], 
                (values) => new SquareRoot(new Constant(Math.pow(values[0], 2)))
            ),
            new ExpressionGenerator([ { from: 5, to: 10 }, { from: 1, to: 6 }, { from: 5, to: 10 }, { from: 1, to: 6 }],
                (values) => new Multiply(new Parantheses(new Subtract(new Constant(values[0]), new Constant(values[1]))), new Parantheses(new Add(new Constant(values[2]), new Constant(values[3]))))    
            ),    
            new ExpressionGenerator([ { from: 1, to: 10 }, { from: 2, to: 6 }, { from: 2, to: 4 } ], 
                (values) => new Add(new Add(new Exponent(new Constant(values[0]), 1), new Exponent(new Constant(values[1]), 2)), new Exponent(new Constant(values[2]), 3))
            ),
            new ExpressionGenerator([ { from: 1, to: 20 }, { from: 1, to: 20}, { from: 1, to: 20 }, { from: 1, to: 20 } ], 
                (values) => new Add(new Subtract(new Add(new Constant(values[0]), new Constant(values[1])), new Constant(values[2])), new Constant(values[3]))
            ),
            new ExpressionGenerator([ { from: 5, to: 10 }, { from: 1, to: 5} ], 
                (values) => new Exponent(new Parantheses(new Subtract(new Constant(values[0]), new Constant(values[1]))), 2)
            ),
            new ExpressionGenerator([ { from: 50, to: 100 }, { from: 50, to: 100} ], 
                (values) => new Add(new Constant(values[0]), new Constant(values[1]))
            ),  
            new ExpressionGenerator([ { from: 100, to: 200 }, { from: 50, to: 100} ], 
                (values) => new Subtract(new Constant(values[0]), new Constant(values[1]))
            ),
            new ExpressionGenerator([ { from: 5, to: 10 }, { from: 1, to: 6 }, { from: 5, to: 10 }, { from: 1, to: 6 } ],
                (values) => new Add(new Parantheses(new Multiply(new Constant(values[0]), new Constant(values[1]))), new Parantheses(new Multiply(new Constant(values[2]), new Constant(values[3]))))    
            )    
        ];
    }

    describe() {
		return {
			name : 'Quick maths',
			icon : 'fa-calculator',
			attribution : []
		};
	}

	async preload(progress) {
        progress(1, 1);
		return this._countQuestions();
	}

	async nextQuestion() {
        let generator = Random.fromArray(this._expressions);
        let values = generator.generateValues();
        let exp = generator.generate(values);
        let correct = exp.eval();
        let similar = Generators.inOrder(generator.alternativeValues(values));

		return ({
			text : "Calculate the following",
			answers : QuestionSelector.alternatives(similar, correct, (e) => this._format(e)),
			correct : this._format(correct),
			view : {
                player : 'quote',
                quote : exp.display(),
				attribution : {
					title : "Quick maths",
					name : exp.display(),
					links : []
				}
			}
		});
    }

    _format(num) {
        return "" + num;
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

class ExpressionGenerator {
    constructor(variables, expressionResolver) {
        this._variables = variables;
        this._expressionResolver = expressionResolver;
    }

    generate(values) {
        let exp = this._expressionResolver(values);
        return exp;
    }

    possibleVariableCount() {
        return this._variables.map(v => {
            return v.to - v.from + 1;
        }).reduce((a, b) => a * b, 1);
    }

    generateValues() {
        return this._variables.map(v => {
            return v.from + Random.random(v.to - v.from + 1);
        });
    }

    //TODO: convert to generator function
    alternativeValues(values) {
        values = values.slice();
        let result = [];
        for (let i = 0; i < 100; i++) {
            let j = Random.random(values.length);
            switch (Random.random(5)) {
                case 0, 1:
                    values[j]--;
                    break;
                case 2,3:
                    values[j]++;
                    break;
                case 4:
                    values[j] = values[j] + 3;
            }
            result.push(this.generate(values).eval());
        }

        return result;
    }
}

export default MathQuestions;