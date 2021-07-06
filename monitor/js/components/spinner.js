class KeepDuration {
    calculate(duration) {
        return duration;
    }

    next() {
        return this;
    }
}

class LogDuration {
    calculate(duration) {
        return Math.max(Math.log10(duration * 0.1),1.1) * duration;
    }

    next() {
        return this;
    }
}

class StepsDuration {
    constructor(steps) {
        this._steps = steps;
    }

    calculate(duration) {
        this._steps--;
        return duration;
    }

    next() {
        if (this._steps < 0) {
            return new LogDuration();
        }
        return this;
    }

    static _calculateStepsBeforeSlowingDown(duration, maxDuration) {
        var steps = 0;
        var sum = duration;
        while (sum < maxDuration) {
            steps++;
            sum = new LogDuration().calculate(sum);
        }

        var indexOfChosen = -1;
        let lis = document.querySelectorAll(".spinner li");
        for (var i = 0; i < lis.length; i++) {
            if (lis[i].dataset.spinnerStop) {
                indexOfChosen = i;
            }
        }

        function mod (n, m) {
            return ((n % m) + m) % m;
        }

        steps = (3 - steps) - indexOfChosen;
        return mod(steps, lis.length);
    }
}

export default {
    data: function() { return {
		duration: 50,
        maxDuration: 2000,
        done: false,
        calculator: new KeepDuration()
    } },
    props: ['categories', 'correct'],
    methods: {
        start: function() {
            return new Promise((resolve, reject) => {
                let checkIfDone = () => {
                    try {
                        this.done = this.flip();
                        if (this.done) {
                            resolve();
                        } else {
                            setTimeout(checkIfDone, this.duration);
                        }
                    } catch (e) {
                        reject(e);
                    }
                }
    
                setTimeout(() => this.stop().catch(reject), 2000);
                checkIfDone();
            });
        },

        stop: async function() {
            this.calculator = new StepsDuration(StepsDuration._calculateStepsBeforeSlowingDown(this.duration, this.maxDuration));
        },

        flip() {
            this.$emit('flip');

            this.duration = this.calculator.calculate(this.duration);
            this.calculator = this.calculator.next();

            let lis = document.querySelectorAll(".spinner li");
    
            if (this.duration < this.maxDuration) {
                let li = lis[lis.length -1];
                if (!li) {
                    return false;
                }
                let parent = li.parentNode;
                parent.removeChild(li);
                parent.insertBefore(li, parent.childNodes[0]);
                return false;
            } else {
                return true;
            }
        },    

        isCorrectCategory(cat) {
            return cat.name === this.correct;
        }
    }
}