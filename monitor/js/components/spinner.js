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

    static _calculateStepsBeforeSlowingDown(duration, maxDuration, categories, correct) {
        let indexOfChosen = categories.reduce((prev, current, index) => {
            if (current.name == correct) {
                return index;
            } else {
                return prev;
            }
        }, -1);

        var steps = 0;
        var sum = duration;
        while (sum < maxDuration) {
            steps++;
            sum = new LogDuration().calculate(sum);
        }

        function mod (n, m) {
            return ((n % m) + m) % m;
        }

        steps = (3 - steps) - indexOfChosen;
        return mod(steps, categories.length);
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
            return new Promise(async (resolve, reject) => {
                setTimeout(() => this.stop().catch(reject), 2000);

                while (!this.done) {
                    try {
                        this.done = await this.flip();
                        if (this.done) {
                            resolve();
                        }
                    } catch (e) {
                        reject(e);
                    }
                }
            });
        },

        stop: async function() {
            this.calculator = new StepsDuration(StepsDuration._calculateStepsBeforeSlowingDown(this.duration, this.maxDuration, this.categories, this.correct));
        },

        flip: async function() {
            this.$emit('flip');

            this.duration = this.calculator.calculate(this.duration);
            this.calculator = this.calculator.next();

            if (this.duration < this.maxDuration) {
                this.categories.unshift(this.categories.pop());

                await this.$nextTick();
                await this.wait(this.duration);
                await this.$nextTick();

                return false;
            } else {
                return true;
            }
        }, 

        wait: function(time) {
            return new Promise((resolve, reject) => {
                setTimeout(resolve, time);
            });
        }
    }
}