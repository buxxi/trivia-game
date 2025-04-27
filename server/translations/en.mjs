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
                shape: 'Which country has this shape?',
                capital: 'In which country is {capital} the capital?',
                borders: 'Which country has borders to all these countries?',
                region: 'Where is $(country.{code}) located?',
                area: 'Which of these countries has the largest land area?'
            },
            country: '$(country.{code})',
            region: {
                'caribbean': 'Caribbean',
                'eastAsia': 'Eastern Asia',
                'southeastAsia': 'Southeastern Asia',
                'southAsia': 'Southern Asia',
                'westAsia': 'Western Asia',
                'centralAsia': 'Central Asia',
                'nortAfrica': 'Northern Africa',
                'eastAfrica': 'Eastern Africa',
                'southAfrica': 'Southern Africa',
                'westAfrica': 'Western Africa',
                'centralAfrica': 'Middle Africa',
                'northEurope': 'Northern Europe',
                'eastEurope': 'Eastern Europe',
                'southeastEurope': 'Southeast Europe',
                'southEurope': 'Southern Europe',
                'westEurope': 'Western Europe',
                'centralEurope': 'Central Europe',
                'northAmerica': 'North America',
                'southAmerica': 'South America',
                'centralAmerica': 'Central America',
                'polynesia': 'Polynesia',
                'antarctic': 'Antarctic',
                'australiaAndNewZealand': 'Australia and New Zealand',
                'melanesia': 'Melanesia',
                'micronesia': 'Micronesia'
            },
            attribution: {
                flag: 'Flag',
                map: 'Map of',
                name: 'Country'
            }
        }
    }
}