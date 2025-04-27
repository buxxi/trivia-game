import fetch from 'node-fetch';
import Generators from '../generators.mjs';
import Random from '../random.mjs';
import Questions from './questions.mjs';
import GeoJson2Svg from '../geojson2svg.mjs';
import countryDefs from 'world-countries';

class GeographyQuestions extends Questions {
    constructor(config, categoryName) {
        super(config, categoryName);
        this._countries = [];

        this._addQuestion({
            title: () => "Which country does this flag belong to?",
            format: (correct) => this._formatName(correct),
            correct: () => this._randomCountry(),
            similar: (correct) => this._similarCountries(correct),
            load: (correct) => this._loadFlag(correct),
            weight: 35
        });
        this._addQuestion({
            title: () => "Which country has this shape?",
            format: (correct) => this._formatName(correct),
            correct: () => this._randomCountry(),
            similar: (correct) => this._similarCountries(correct),
            load: (correct) => this._loadMap(correct),
            weight: 15
        });
        this._addQuestion({
            title: (correct) => "In which country is " + correct.capital + " the capital?",
            format: (correct) => this._formatName(correct),
            correct: () => this._randomCountryWithCapital(),
            similar: (correct) => this._similarCountries(correct),
            load: (correct) => this._loadBlank(correct),
            weight: 20
        });
        this._addQuestion({
            title: () => "Which country has borders to all these countries?",
            format: (correct) => this._formatName(correct),
            correct: () => this._randomCountryWith2Neighbours(),
            similar: (correct) => this._similarNeighbouringCountries(correct),
            load: (correct) => this._loadNeighbours(correct),
            weight: 10
        });
        this._addQuestion({
            title: (correct) => "Where is " + correct.name + " located?",
            format: (correct) => this._formatRegion(correct),
            correct: () => this._randomCountry(),
            similar: (correct) => this._allCountriesRandom(correct),
            load: (correct) => this._loadBlank(correct),
            weight: 10
        });
        this._addQuestion({
            title: () => "Which of these countries has the largest land area?",
            format: (correct) => this._formatName(correct),
            correct: () => this._randomNonMicroCountry(),
            similar: (correct) => this._similarAreaCountries(correct),
            load: (correct) => this._loadBlank(correct),
            weight: 10
        });
    }

    describe() {
        return {
            name: 'Geography',
            icon: 'fa-globe-europe',
            attribution: [
                {url: 'https://restcountries.eu', name: 'REST Countries'},
                {url: 'https://public.opendatasoft.com/', name: 'OpenDataSoft'}
            ]
        };
    }

    async preload(language, progress, cache) {
        this._onlyEnglish(language);
        progress(0, 2);
        this._countries = await this._loadCountries();
        progress(1, 2);
        this._worldMap = await this._loadWorldMap(cache);
        progress(2, 2);
        return this._countQuestions();
    }

    _countQuestions() {
        return this._countries.length * Object.keys(this._types).length;
    }

    async _loadCountries() {
        return countryDefs.map((country) => {
            return {
                code: country.cca2,
                region: !country.subregion ? country.region : country.subregion,
                name: country.name.common,
                capital: country.capital ? country.capital[0] : undefined,
                area: country.area,
                neighbours: (country.borders || []).map((code) => countryDefs.find((c) => code === c.cca3).name.common)
            }
        }).filter(country => !!country.region && !!country.capital);
    }

    _loadWorldMap(cache) {
        return cache.get('worldmap', async (resolve, reject) => {
            try {
                var result = [];
                var data;
                do {
                    data = await this._loadWorldMapChunk(result.length);
                    result = result.concat(data.results);
                } while (result.length < data.total_count);

                resolve(result);
            } catch (e) {
                reject(e);
            }
        });
    }

    async _loadWorldMapChunk(offset) {
        let url = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/world-administrative-boundaries/records?limit=100&offset=${offset}`;
        let response = await fetch(url);
        return await this._toJSON(response);
    }

    _randomCountry() {
        return Random.fromArray(this._countries);
    }

	_randomNonMicroCountry() {
		return Random.fromArray(this._countries, c => c.area > 50000);
	}

	_randomCountryWithCapital() {
		return Random.fromArray(this._countries, c => !!c.capital);
	}

    _randomCountryWith2Neighbours() {
        return Random.fromArray(this._countries, c => c.neighbours.length >= 2);
    }

    _allCountries() {
        return Generators.random(this._countries);
    }

    _allCountriesRandom() {
        return Generators.inOrder(this._countries);
    }

    _similarNeighbouringCountries(country) {
        let result = this._countries.filter(c => country.region === c.region && !country.neighbours.includes(c)).filter(c => !country.neighbours.every((o) => c.neighbours.includes(o)));
        return Generators.inOrder(result);
    }

    _similarCountries(country) {
        let result = this._countries.filter(function (c) {
            return country.region === c.region;
        });
        return Generators.inOrder(result);
    }

    _similarAreaCountries(country) {
        function areaSort(c) {
            return Math.floor(Math.log(c.area));
        }

        let result = this._countries.filter((c) => c.area < country.area).sort((a, b) => areaSort(b) - areaSort(a));
        return Generators.inOrder(result);
    }

    _formatName(country) {
        return country.name;
    }

    _formatRegion(country) {
        return country.region;
    }

    _loadFlag(country) {
        return Object.assign(this._loadBlank(country, "Flag"), {
            player: 'image',
            url: 'https://flagcdn.com/' + country.code.toLowerCase() + '.svg'
        });
    }

    _loadMap(country) {
        let data = new GeoJson2Svg(this._worldMap).convert(country.code);
        return Object.assign(this._loadBlank(country, "Image of"), {
            player: 'image',
            url: 'data:image/svg+xml,' + encodeURIComponent(data).replace(/'/g, '%27').replace(/"/g, '%22')
        });
    }

    _loadNeighbours(country) {
        return Object.assign(this._loadBlank(country), {
            player: 'list',
            list: country.neighbours
        });
    }

    _loadBlank(country, title = "Country") {
        return {
            attribution: {
                title: title,
                name: country.name,
                links: ['https://restcountries.com', 'https://flagpedia.net?q=' + country.code]
            }
        };
    }
}

export default GeographyQuestions;