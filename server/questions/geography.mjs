import fetch from 'node-fetch';
import Generators from '../generators.mjs';
import Random from '../random.mjs';
import Questions from './questions.mjs';
import GeoJson2Svg from '../geojson2svg.mjs';
import countryDefs from 'world-countries';
import Selector from "#selector";

class GeographyQuestions extends Questions {
    constructor(config, categoryName) {
        super(config, categoryName);
        this._countries = [];

        this._addQuestion({
            title: (_) => this._translatable("question.flag"),
            format: (answer, _) => this._formatName(answer),
            correct: () => this._randomCountry(),
            similar: (correct, _) => this._similarCountries(correct),
            load: (correct) => this._loadFlag(correct),
            weight: 30
        });
        this._addQuestion({
            title: (_) => this._translatable("question.shape"),
            format: (answer, _) => this._formatName(answer),
            correct: () => this._randomCountry(),
            similar: (correct, _) => this._similarCountries(correct),
            load: (correct) => this._loadMap(correct),
            weight: 15
        });
        this._addQuestion({
            title : (_) => this._translatable("question.population"),
            format : (answer, _) => this._formatName(answer),
            correct : () => this._randomNonMicroCountry(),
            similar : (correct, _) => this._similarPopulationCountries(correct),
            load : (correct) => this._loadBlank(correct),
            weight : 10
        });
        this._addQuestion({
            title: (correct) => this._translatable("question.capital", {capital: correct.capital}),
            format: (answer, _) => this._formatName(answer),
            correct: () => this._randomCountryWithCapital(),
            similar: (correct, _) => this._similarCountries(correct),
            load: (correct) => this._loadBlank(correct),
            weight: 15
        });
        this._addQuestion({
            title: (_) => this._translatable("question.borders"),
            format: (answer, _) => this._formatName(answer),
            correct: () => this._randomCountryWith2Neighbours(),
            similar: (correct, _) => this._similarNeighbouringCountries(correct),
            load: (correct) => this._loadNeighbours(correct),
            weight: 10
        });
        this._addQuestion({
            title: (correct) => this._translatable("question.region", {code: correct.code}),
            format: (answer, _) => this._formatRegion(answer),
            correct: () => this._randomCountry(),
            similar: (correct, _) => this._allCountriesRandom(correct),
            load: (correct) => this._loadBlank(correct),
            weight: 10
        });
        this._addQuestion({
            title: (_) => this._translatable("question.area"),
            format: (answer, _) => this._formatName(answer),
            correct: () => this._randomNonMicroCountry(),
            similar: (correct, _) => this._similarAreaCountries(correct),
            load: (correct) => this._loadBlank(correct),
            weight: 10
        });
    }

    describe() {
        return {
            name: this._translatable('title'),
            icon: 'fa-globe-europe',
            attribution: [
                {url: 'https://public.opendatasoft.com/', name: 'OpenDataSoft'}
            ]
        };
    }

    async preload(language, progress, cache) {
        progress(0, 3);
        this._countries = await this._loadCountries();
        progress(1, 3);
        await this._loadPopulation(cache);
        progress(2, 3);
        this._worldMap = await this._loadWorldMap(cache);
        progress(3, 3);
        return this._countQuestions();
    }

    _countQuestions() {
        return this._countries.length * Object.keys(this._types).length;
    }

    async _loadCountries() {
        return countryDefs.map((country) => {
            return {
                code: country.cca2,
                region: this._parseRegion(!country.subregion ? country.region : country.subregion),
                capital: country.capital ? country.capital[0] : undefined,
                area: country.area,
                neighbours: (country.borders || []).map((code) => countryDefs.find((c) => code === c.cca3).cca2)
            }
        }).filter(country => !!country.region && !!country.capital);
    }

    async _loadPopulation(cache) {
        let countries = this._countries;
        let data = await cache.get('population', async (resolve, reject) => {
            try {
                let url = 'https://ourworldindata.org/grapher/population.csv?v=1&csvType=full&useColumnShortNames=true';
                let response = await fetch(url);
                resolve(await response.text());
            } catch (e) {
                reject(e);
            }
        });

        function addPopulation(countryCode, population) {
            if (countryCode === 'ANT') {
                countryCode = 'ATG';
            }
            let countryDef = countryDefs.find((country) => country.cca3 === countryCode);
            let country = countries.find((c) => c.code === countryDef.cca2);
            if (country) {
                country.population = population;
            }
        }

        data = data.split('\n').slice(1);
        var previousCountry = "";
        var previousPopulation = 0;
        for (let line of data) {
            let parts = line.split(',');
            let country = parts[1];
            if (country !== previousCountry && previousCountry.length === 3) {
                addPopulation(previousCountry, previousPopulation);
            }
            previousCountry = country;
            previousPopulation = parseInt(parts[3]);
        }
        if (previousCountry && previousCountry.length === 3) {
            addPopulation(previousCountry, previousPopulation);
        }

        return data;
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

    _allCountriesRandom() {
        return Generators.random(this._countries);
    }

    _similarNeighbouringCountries(country) {
        let result = this._countries
            .filter(c => !country.neighbours.includes(c.code)) //The current alternative can't be one of the one presented
            .filter(c => !country.neighbours.every((o) => c.neighbours.includes(o))); //Can't have the same answer as the correct one
        return Generators.sortedCompareCorrect(result, Selector.levenshteinDistance, country, o => o.region.split(""), true);
    }

    _similarCountries(country) {
        let result = this._countries.filter(function (c) {
            return country.region === c.region;
        });
        return Generators.random(result);
    }

    _similarAreaCountries(country) {
        function areaSort(c) {
            return Math.floor(Math.log(c.area));
        }

        let result = this._countries.filter((c) => c.area < country.area).sort((a, b) => areaSort(b) - areaSort(a));
        return Generators.inOrder(result);
    }

    _similarPopulationCountries(country) {
        function populationSort(c) {
            return Math.floor(Math.log(c.population));
        }

        let result = this._countries.filter((c) => c.population < country.population).sort((a, b) => populationSort(b) - populationSort(a));
        return Generators.inOrder(result);
    }

    _formatName(country, translator) {
        return this._translatable('country', { code: country.code });
    }

    _formatRegion(country, translator) {
        return this._translatable(`region.${country.region}`);
    }

    _loadFlag(country) {
        return Object.assign(this._loadBlank(country, "attribution.flag"), {
            player: 'image',
            url: 'https://flagcdn.com/' + country.code.toLowerCase() + '.svg'
        });
    }

    _loadMap(country) {
        let data = new GeoJson2Svg(this._worldMap).convert(country.code);
        return Object.assign(this._loadBlank(country, "attribution.map"), {
            player: 'image',
            url: 'data:image/svg+xml,' + encodeURIComponent(data).replace(/'/g, '%27').replace(/"/g, '%22')
        });
    }

    _loadNeighbours(country) {
        return Object.assign(this._loadBlank(country), {
            player: 'list',
            list: country.neighbours.map(n => this._translatable('country', {code: n}))
        });
    }

    _loadBlank(country, attributionKey = "attribution.name") {
        return {
            attribution: {
                title: this._translatable(attributionKey),
                name: this._translatable('country', { code: country.code }),
                links: ['https://restcountries.com', 'https://flagpedia.net?q=' + country.code]
            }
        };
    }

    _parseRegion(str) {
        return str
            .replace(/\s(.)/g, function (m) {
                return "_" + m.toLowerCase();
            })
            .replace(/\s/g, '')
            .replace(/^(.)/, function (m) {
                return m.toLowerCase();
            })
            .replace('southern', 'south')
            .replace('northern', 'north')
            .replace('western', 'west')
            .replace(/-?[E|e]astern/g, 'east')
            .replace('middle', 'central');
    }
}

export default GeographyQuestions;