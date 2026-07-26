<template>
<div>
    <div id="results" v-bind:class="resultsClass">
        <div class="top-3">
            <div v-for="(score, index) in scores.slice(0, 3)" v-bind:class="podiumClass(index)">
                <div class="avatar-wrapper">
                    <div class="avatar" v-bind:style="{'background-color': score.color, 'border-color': score.color}"  v-bind:data-score="score.name">
                        <img v-bind:src="'../common/img/avatars/' + score.avatar + '.png'" alt=""/>
                    </div>
                </div>
                <div class="podium">
                    <span class="place">{{ index + 1}}</span>
                    <span class="score" v-bind:style="'--total-count:' + score.score"></span>
                </div>
                <div class="summary">
                    <span class="correct" v-bind:style="'--total-count:' + score.correct"><i class="fas fa-fw fa-check"></i></span>
                    <span class="failed" v-bind:style="'--total-count:' + score.wrong"><i class="fas fa-fw fa-times"></i></span>
                </div>
            </div>
        </div>
        <div class="others">
            <div v-for="(score, index) in scores.slice(3)" v-bind:class="loserClass(index + 3)">
                <span class="place">{{ $t('credits.place', {count: index + 4}) }}</span>
                <div>
                    <div class="avatar" v-bind:style="{'background-color': score.color, 'border-color': score.color}"
                         v-bind:data-score="score.name">
                        <img v-bind:src="'../common/img/avatars/' + score.avatar + '.png'" alt=""/>
                    </div>
                </div>
                <span class="score" v-bind:style="'--total-count:' + score.score"></span>
                <div class="summary">
                    <span class="correct" v-bind:style="'--total-count:' + score.correct"><i class="fas fa-fw fa-check"></i></span>
                    <span class="failed" v-bind:style="'--total-count:' + score.wrong"><i class="fas fa-fw fa-times"></i></span>
                </div>
            </div>
        </div>
    </div>
    <div id="credits" v-bind:style="{'animation-duration': duration + 's'}" v-bind:class="creditsClass">
        <div v-for="attr in attribution" class="attribution">
            <h1>{{ attr.title }}</h1>
            <span>{{ attr.name }}</span>
            <ul>
                <li v-for="link in attr.links">
                    <a v-bind:href="link">{{ $t('credits.attribution', {domain: domain(link)}) }} <i class="fas fa-fw fa-external-link-alt"></i></a>
                </li>
            </ul>
        </div>

        <div class="attribution">
            <h1>{{ $t('credits.music.by') }}</h1>
            <span>Suno</span>
            <ul>
                <li>
                    <a href="https://suno.com/s/FnM53Cv3rCqP0xfp">{{ $t('credits.music.suno') }} <i class="fas fa-fw fa-external-link-alt"></i></a>
                </li>
            </ul>
        </div>

        <div class="attribution">
            <h1>{{ $t('credits.game.by') }}</h1>
            <span>BuXXi</span>
            <ul>
                <li>
                    <a href="https://github.com/buxxi/trivia-game">{{ $t('credits.game.source') }} <i class="fas fa-fw fa-external-link-alt"></i></a>
                </li>
            </ul>
        </div>
    </div>

    <div id="start">
        <a v-on:click="restart"><i class="fas fa-fw fa-redo"></i></a>
    </div>
</div>
</template>

<script>
export default {
	computed: {
		duration: function() {
			if (!this.history || !this.history) {
				return 0;
			}
			return (this.history.length + 2) * 5;
		},

		scores: function() {
			if (!this.results) {
				return [];
			}
			return Object.values(this.results).sort((a, b) => b.score - a.score);
		},

		attribution: function() {
			if (!this.history) {
				return [];
			}
			return this.history.map((question) => question.view.attribution);
		},

		resultsClass: function() {
			return this.minimizedResults ? 'minimize' : '';
		},

		creditsClass: function() {
			return this.minimizedResults ? 'scrolling' : '';
		}
	},
	data: function() {
		return {
			showPlaceAbove: 0,
			celebrate: false,
			minimizedResults: false
		}
	},
	props: ['gameId', 'results', 'history', 'sound'],
	methods: {
		domain : function(link) {
			try {
				return new URL(link).hostname;
			} catch (e) {
				return link;
			}
		},
		restart : function() {
			this.$router.push({ path: "/", query : { gameId: this.gameId } });
		},
		podiumClass: function(index) {
			let classList = ['medalist'];
			classList.push(['gold', 'silver', 'bronze'][index]);
			if (index >= this.showPlaceAbove) {
				classList.push('show');
			}
			if (index === 0 && this.celebrate) {
				classList.push('celebrate');
			}
			return classList;
		},

		loserClass: function(index) {
			let classList = ['loser'];
			if (index >= this.showPlaceAbove) {
				classList.push('show');
			}
			return classList;
		},

		showNextScore() {
			//TODO: these timeout should only have one place where it's defined or listen to animation end event
			this.showPlaceAbove--;
			if (this.showPlaceAbove > 0) {
				setTimeout(() => this.showNextScore(), 1000)
			} else {
				setTimeout(() => this.celebrateVictory(), 1000);
				setTimeout(() => this.minimizeResults(), 5000);
			}
		},

		celebrateVictory() {
			this.celebrate = true;
			this.sound.celebrateVictory();
		},

		minimizeResults: function() {
			this.minimizedResults = true;
		}
	},
	created: function() {
		if (!this.results && !this.history) {
			this.$router.push({ path: "/", query : { gameId: this.gameId } });
			return;
		}
		this.showPlaceAbove = this.scores.length;
		this.showNextScore();
	}
};
</script>

