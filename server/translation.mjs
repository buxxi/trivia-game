import i18next from 'i18next';
import countryDefs from "world-countries";

var i18n = undefined;

class Translator {
    constructor(base, language) {
        this._base = base;
        this._language = language;
    }

    to(language) {
        return new Translator(this._base, language);
    }

    translate(key, variables = {}) {
        if (!this._language) {
            throw new Error("No language was provided");
        }
        key = this._base ? `${this._base}.${key}` : key;
        variables = Object.assign({lng: this._language}, variables);

        let result = i18n(key, variables);
        if (key === result) { //TODO: only temp before translating
            return key + ":" + JSON.stringify(variables);
        }
        return result;
    }
}

async function initFromPaths(paths, languages, resources) {
    for (let path of paths) {
        for (let language of languages) {
            let p = path.replace("{language}", language);
            let data = await import(p);
            resources[language].translation = Object.assign(resources[language].translation, data.default);
        }
    }
}

async function initCountries(languages, resources) {
    for (let language of languages) {
        let countryNames = {};
        for (let country of countryDefs) {
            countryNames[country.cca2] = language === 'en' ? country.name.common : country.translations["swe"].common;
        }
        resources[language].translation = Object.assign(resources[language].translation, { country: countryNames });
    }
}

export async function init(config) {
    let languages = config.languages;
    let paths = ['./translations/{language}.mjs'];

    let resources = Object.fromEntries(languages.map(l => [l, { translation: {}}]));
    await initFromPaths(paths, languages, resources);
    await initCountries(languages, resources);

    i18n = await i18next.init({
        resources: resources,
        interpolation: {
            prefix: '{',
            suffix: '}',
            nestingPrefix: '$(',
            nestingSuffix: ')'
        }
    });
}

export default Translator;