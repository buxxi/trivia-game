export default {
    category: {
        math: {
            title: 'Quick maths',
            question: {
                calculate: 'Calculate the following'
            }
        },
        geography: {
            title: 'Geography',
            question: {
                flag: 'Which country does this flag belong to?',
                population: 'Which of these countries has the largest population?',
                shape: 'Which country has this shape?',
                capital: 'In which country is {capital} the capital?',
                borders: 'Which country has borders to all these countries?',
                region: 'Where is $(country.{code}) located?',
                area: 'Which of these countries has the largest land area?'
            },
            country: '$(country.{code})',
            region: {
                caribbean: 'Caribbean',
                east_asia: 'Eastern Asia',
                southeast_asia: 'Southeastern Asia',
                south_asia: 'Southern Asia',
                west_asia: 'Western Asia',
                central_asia: 'Central Asia',
                north_africa: 'Northern Africa',
                east_africa: 'Eastern Africa',
                south_africa: 'Southern Africa',
                west_africa: 'Western Africa',
                central_africa: 'Middle Africa',
                north_europe: 'Northern Europe',
                east_europe: 'Eastern Europe',
                southeast_europe: 'Southeast Europe',
                south_europe: 'Southern Europe',
                west_europe: 'Western Europe',
                central_europe: 'Central Europe',
                north_america: 'North America',
                south_america: 'South America',
                central_america: 'Central America',
                polynesia: 'Polynesia',
                antarctic: 'Antarctic',
                australia_and_new_zealand: 'Australia and New Zealand',
                melanesia: 'Melanesia',
                micronesia: 'Micronesia'
            },
            attribution: {
                flag: 'Flag',
                map: 'Map of',
                name: 'Country'
            }
        },
        meta: {
            title: 'Current Game',
            question: {
                animal: 'Which animal does {player} have as avatar?',
                most_correct: 'Who has the most correct answers so far?',
                most_incorrect: 'Who has the most incorrect answers so far?',
                total_correct: 'What is the total amount of correct answers so far?',
                total_incorrect: 'What is the total amount of incorrect answers so far?',
                fastest_correct: 'Who has made the fastest correct answers so far?',
                slowest_correct: 'Who has made the slowest correct answers so far?'
            },
            attribution: {
                animal: 'Avatar',
                most_correct: 'Most correct player (at that time)',
                most_incorrect: 'Most incorrect player (at that time)',
                total_correct: 'Total correct answers (at that time)',
                total_incorrect: 'Total incorrect answers (at that time)',
                fastest_correct: 'Fastest player (at that time)',
                slowest_correct: 'Slowest player (at that time)'
            },
            avatar: {
                monkey: 'Monkey',
                dog: 'Dog',
                wolf: 'Wolf',
                cat: 'Cat',
                lion: 'Lion',
                tiger: 'Tiger',
                horse: 'Horse',
                cow: 'Cow',
                dragon: 'Dragon',
                pig: 'Pig',
                mouse: 'Mouse',
                hamster: 'Hamster',
                rabbit: 'Rabbit',
                bear: 'Bear',
                panda: 'Panda',
                frog: 'Frog',
                octopus: 'Octopus',
                turtle: 'Turtle',
                bee: 'Bee',
                snail: 'Snail',
                penguin: 'Penguin'
            }
        },
        movies: {
            title: 'Movies',
            question: {
                title: 'Which movie is this from?',
                year: 'Which year is this movie from?'
            },
            attribution: {
                clip: 'Clip from'
            }
        },
        videogames: {
            title: 'Video Games',
            question: {
                screenshot: 'Which game is this a screenshot of?',
                release: 'In which year was \'{game}\' first released?',
                platform: '\'{game}\' was released to one of these platforms, which one?'
            },
            attribution: {
                screenshot: 'Screenshot of',
                title: 'Video Game'
            }
        }
    }
}