import i18next from 'i18next';
import countryDefs from "world-countries";
import {customTranslationPath} from "./xdg.mjs";
import fs from "fs/promises";
import logger from "./logger.mjs";

var i18n = undefined;

class Translator {
    constructor(language) {
        this._language = language;
    }

    translate(key) {
        if (!this._language) {
            throw new Error("No language was provided");
        }

        let result = i18n(key, { lng: this._language});

        return result;
    }

    translateObject(obj) {
        if (obj === undefined || typeof obj === "number" || typeof obj === "boolean") {
            return obj;
        }
        if (typeof obj === "string") {
            let m = obj.match(/^\$t\(.*\)$/);
            if (m) {
                return this.translate(obj);
            } else {
                return obj;
            }
        } else if (Array.isArray(obj)) {
            return obj.map(v => this.translateObject(v));
        } else {
            return Object.fromEntries(Object.entries(obj).map(([key, value]) => {
                return [key, this.translateObject(value)];
            }));
        }
    }
}

async function initFromPaths(paths, languages, resources) {
    for (let language of languages) {
        var loadSuccess = false;
        for (let path of paths) {
            let p = path.replace("{language}", language);
            try {
                let data = JSON.parse(await fs.readFile(p, 'utf8'));
                resources[language].translation = deepMergeObjects(resources[language].translation, data);
                loadSuccess = true;
            } catch (e) {
                logger.debug(e.message);
            }
        }
        if (!loadSuccess) {
            throw new Error(`None of the translation files where loaded for language: ${language}`);
        }
    }
}

async function initCountries(languages, resources) {
    for (let language of languages) {
        let countryNames = {};
        for (let country of countryDefs) {
            countryNames[country.cca2] = language === 'en' ? country.name.common : country.translations["swe"].common;
        }
        resources[language].translation = deepMergeObjects(resources[language].translation, { country: countryNames });
    }
}

function deepMergeObjects(a, b) {
    let keys = Object.keys(a).concat(Object.keys(b));
    let result = {};
    for (let key of keys) {
        if (key in a && key in b) {
            if (typeof a[key] === "string" && typeof b[key] === "string") {
                result[key] = a;
            } else if (typeof a[key] !== "string" && typeof b[key] !== "string") {
                result[key] = deepMergeObjects(a[key], b[key]);
            } else {
                throw new Error("Value either needs to be an object or a string");
            }
        } else if (key in a) {
            result[key] = a[key];
        } else if (key in b) {
            result[key] = b[key];
        }
    }

    return result;
}

export function getTranslationBundle(language) {
    return i18next.getResourceBundle(language);
}

export async function init(config) {
    let languages = config.languages;
    let paths = ['./translations/{language}.json', customTranslationPath('{language}.json')];

    let resources = Object.fromEntries(languages.map(l => [l, { translation: {}}]));
    await initFromPaths(paths, languages, resources);
    await initCountries(languages, resources);

    i18n = await i18next.init({
        resources: resources,
        interpolation: {
            escapeValue: false
        }
    });
    i18next.services.formatter.add('lowercase', (value, lng, options) => {
        return value.toLowerCase();
    });
    i18next.services.formatter.add('article', (value, lng, options) => {
        if (lng === 'en') {
            return ['a', 'e', 'i', 'o', 'u', 'h'].includes(value.toLowerCase().substring(0, 1)) ? `an ${value}` : `a ${value}`;
        } else if (lng === 'sv') {
            // There's no fixed rule for swedish, but ~80% is 'en' and words ending with these are 'ett'
            return ['um', 'ment', 'skap', 'döme', 'at', 'on', 'gram', 'huvud', 'mang'].some(v => value.toLowerCase().endsWith(v)) ? `ett ${value}` : `en ${value}`;
        } else {
            return value;
        }
    });
}

export default Translator;