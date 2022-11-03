const MIN_SPINS = 15;
const MAX_SPINS = 50;
const MAX_DURATION = 50;
const MIN_DURATION = 1000;

class TransitionCounter {
    constructor() {
        this._count = 0;
        this._promise = new Promise((resolve, reject) => {
            this._resolvePromise = resolve;
        });
    }

    wait() {
        return this._promise;
    }

    countUp() {
        this._count++;
    }

    countDown() {
        this._count--;
        if (this._count <= 0) {
            this._resolvePromise();
        }
    }
}

export default {
    data: function() { return {
		duration: MAX_DURATION,
        done: false,
        stepsLeft: -1,
        totalSteps: -1
    } },
    props: ['categories', 'correct'],
    methods: {
        start: function() {
            return new Promise(async (resolve, reject) => {
                this.totalSteps = this._calculateSteps()
                this.stepsLeft = this.totalSteps;

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

        flip: async function() {
            this.$emit('flip');

            this.duration = this._calculateDuration();

            try {
                if (this.stepsLeft > 0) {
                    this.transitionCounter = new TransitionCounter();
                    this.categories.unshift(this.categories.pop());
                    this.stepsLeft--;

                    await this.$nextTick();
                    await Promise.race([this.transitionCounter.wait(), this._detectStuck()]);
                    await this.$nextTick();

                    return false;
                }
            } catch (ex) {
                console.log(ex);
                this.duration = 0;
                while (this.stepsLeft > 0) {
                    this.categories.unshift(this.categories.pop());
                    this.stepsLeft--;
                }
                await this.$nextTick();
            }

            return true;
        }, 

        transitionStart: function(event) {
            if (event.propertyName == 'transform') {
                this.transitionCounter.countUp();
            }
        },

        transitionEnd: function(event) {
            if (event.propertyName == 'transform') {
                this.transitionCounter.countDown();
            }
        },

        _detectStuck: function() {
            return new Promise((resolve, reject) => {
                let checkDuration = this.duration * 2;
                if (checkDuration < 250) {
                    checkDuration = 500;
                }
                setTimeout(() => {
                    reject(new Error("Spinner seems to be stuck"));
                }, checkDuration);
            });
        },

        _calculateSteps: function() {
            let indexesOfChosen = this.categories.map((current, index) => {
                if (current.name == this.correct) {
                    return index;
                } else {
                    return -1;
                }
            }).filter(index => index > -1);

            // Create an array of possible amount of laps with a minimum of [0]
            let possibleLaps = [...Array(Math.ceil((MAX_SPINS - MIN_SPINS) / this.categories.length)).keys()];

            // Multiply each lap with the amount of categories for each index and make sure it's in the range of the minimum and maximum
            let possibleSpins = indexesOfChosen.flatMap(index => {
                return possibleLaps.map(laps => (laps * this.categories.length) + (this.categories.length - index + 3));
            }).filter(spins => spins >= MIN_SPINS && spins <= MAX_SPINS);

            // If we somehow got no result that matches just use a basic spin
            if (possibleSpins.length == 0) {
                return this.categories.length - indexesOfChosen[0] + 3;
            }

            return possibleSpins[(possibleSpins.length * Math.random() << 0)];
        },

        _calculateDuration: function() {
            let curve = this._cubicBezier(0, -1, -0.1, 1);
            let normalizedStep = (this.totalSteps - this.stepsLeft) / this.totalSteps;
            let curvedStep = Math.max(0, curve(normalizedStep));

            return (curvedStep * (MIN_DURATION - MAX_DURATION)) + MAX_DURATION;

        },

        _cubicBezier: function(p0, p1, p2, p3) {
            return (t) =>   Math.pow(1 - t, 3) * p0 +
                            3 * Math.pow(1 - t, 2) * t * p1 +
                            3 * (1 - t) * Math.pow(t, 2) * p2 +
                            Math.pow(t, 3) * p3;
        }
    }
}