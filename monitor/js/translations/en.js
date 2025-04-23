export default {
    title: 'Trivia Game',
    loading: 'Loading',
    ready: 'Game is ready to start',
    join: {
        header: 'Join on your Smartphone!',
        qrCodeOrUrl: 'By QR Code or go to'
    },
    players: {
        header: 'Players',
        none: 'No players have joined yet',
        kick: 'Kick player'
    },
    rules: {
        header: 'Rules',
        controller: 'Use your phone to select the answer you think is correct',
        scoring: 'A correct answer awards you points and an incorrect removes points',
        belowZero: 'You can\'t go below 0 points, make wild guesses if you don\'t know the correct answer',
        speed: 'You are awarded more points for answering quick',
        multiplier: {
            correct: 'A correct answer will increase the points multiplier (up to {maxMultiplier}x) for the next question',
            incorrect: 'An invalid answer will reset the points multiplier to 1x',
            unanswered: 'Not answering will reset the points multiplier to 1x'
        },
        time: 'You have {seconds} seconds to answer each question'
    },
    poweredBy: 'Powered by',
    settings: {
        header: 'Settings',
        questions: 'Number of questions',
        time: 'Seconds to answer',
        pointsPerRound: 'Points per question',
        maxMultiplier: 'Max multiplier',
        stopOnAnswers: 'Stop after all answered',
        allowMultiplier: 'Use multiplier',
        backgroundMusic: 'Play background music',
        text2Speech: 'Text-2-speech of questions',
        soundEffects: 'Sound effects',
        categorySpinner: 'Categories spinner',
        saveStatistics: 'Save statistics',
        fullscreen: 'Toggle fullscreen',
        language: 'Language'
    },
    categories: {
        header: 'Categories',
        none: 'Not enough categories selected',
        clearCache: 'Clear cache for {category}, this could take a while?',
        stillLoading: 'Not all selected categories has preloaded',
        selectAll: 'Select all',
        selectRandom: 'Select 1 random',
        questionCount: '{questionCount} possible questions in the selected categories'
    },
    errors: {
        initial: 'Error when loading initial setup: {message}',
        clearCache: 'Failed to clear cache: {message}',
        startGame: 'Failed to start game: {message}'
    },
    credits: {
        attribution: 'Lookup at {domain}',
        music: {
            by: 'Music by',
            spotify: 'Play on Spotify'
        },
        game: {
            by: 'A game made by',
            source: 'Lookup at github.com'
        }
    },
    states: {
        postQuestion: 'The correct answer was',
        error: 'An error occured'
    }
}