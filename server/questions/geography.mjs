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
            title: (_, translator) => translator.translate("question.flag"),
            format: (correct, translator) => this._formatName(correct, translator),
            correct: () => this._randomCountry(),
            similar: (correct) => this._similarCountries(correct),
            load: (correct, translator) => this._loadFlag(correct, translator),
            weight: 30
        });
        this._addQuestion({
            title: (_, translator) => translator.translate("question.shape"),
            format: (correct, translator) => this._formatName(correct, translator),
            correct: () => this._randomCountry(),
            similar: (correct) => this._similarCountries(correct),
            load: (correct, translator) => this._loadMap(correct, translator),
            weight: 15
        });
        this._addQuestion({
            title : (correct, translator) => translator.translate("question.population"),
            format : (correct, translator) => this._formatName(correct, translator),
            correct : () => this._randomNonMicroCountry(),
            similar : (correct) => this._similarPopulationCountries(correct),
            load : (correct, translator) => this._loadBlank(correct, translator),
            weight : 10
        });
        this._addQuestion({
            title: (correct, translator) => translator.translate("question.capital", {capital: correct.capital}),
            format: (correct, translator) => this._formatName(correct, translator),
            correct: () => this._randomCountryWithCapital(),
            similar: (correct) => this._similarCountries(correct),
            load: (correct, translator) => this._loadBlank(correct, translator),
            weight: 15
        });
        this._addQuestion({
            title: (_, translator) => translator.translate("question.borders"),
            format: (correct, translator) => this._formatName(correct, translator),
            correct: () => this._randomCountryWith2Neighbours(),
            similar: (correct) => this._similarNeighbouringCountries(correct),
            load: (correct, translator) => this._loadNeighbours(correct, translator),
            weight: 10
        });
        this._addQuestion({
            title: (correct, translator) => translator.translate("question.region", {code: correct.code}),
            format: (correct, translator) => this._formatRegion(correct, translator),
            correct: () => this._randomCountry(),
            similar: (correct) => this._allCountriesRandom(correct),
            load: (correct, translator) => this._loadBlank(correct, translator),
            weight: 10
        });
        this._addQuestion({
            title: (_, translator) => translator.translate("question.area"),
            format: (correct, translator) => this._formatName(correct, translator),
            correct: () => this._randomNonMicroCountry(),
            similar: (correct) => this._similarAreaCountries(correct),
            load: (correct, translator) => this._loadBlank(correct, translator),
            weight: 10
        });
    }

    describe(language) {
        return {
            name: this._translator.to(language).translate('title'),
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

    _similarPopulationCountries(country) {
        function populationSort(c) {
            return Math.floor(Math.log(c.population));
        }

        let result = this._countries.filter((c) => c.population < country.population).sort((a, b) => populationSort(b) - populationSort(a));
        return Generators.inOrder(result);
    }

    _formatName(country, translator) {
        return translator.translate('country', { code: country.code });
    }

    _formatRegion(country, translator) {
        return translator.translate(`region.${country.region}`);
    }

    _loadFlag(country, translator) {
        return Object.assign(this._loadBlank(country, translator, "attribution.flag"), {
            player: 'image',
            url: 'https://flagcdn.com/' + country.code.toLowerCase() + '.svg'
        });
    }

    _loadMap(country, translator) {
        let data = new GeoJson2Svg(this._worldMap).convert(country.code);
        return Object.assign(this._loadBlank(country, translator, "attribution.map"), {
            player: 'image',
            url: 'data:image/svg+xml,' + encodeURIComponent(data).replace(/'/g, '%27').replace(/"/g, '%22')
        });
    }

    _loadNeighbours(country, translator) {
        return Object.assign(this._loadBlank(country, translator), {
            player: 'list',
            list: country.neighbours.map(n => translator.translate('country', {code: n}))
        });
    }

    _loadBlank(country, translator, attributionKey = "attribution.name") {
        return {
            attribution: {
                title: translator.translate(attributionKey),
                name: translator.translate('country', { code: country.code }),
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