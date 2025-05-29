import i18next from 'i18next';
import countryDefs from "world-countries";
import {customTranslationPath} from "./xdg.mjs";
import fs from "fs/promises";

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
        if (typeof obj === "string") {
            let m = obj.match(/^\$\(.*\)$/);
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
    for (let path of paths) {
        for (let language of languages) {
            let p = path.replace("{language}", language);
            try {
                let data = JSON.parse(await fs.readFile(p, 'utf8'));
                resources[language].translation = Object.assign(resources[language].translation, data);
            } catch (e) {
                console.warn(e.message);
            }
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
            prefix: '{',
            suffix: '}',
            nestingPrefix: '$(',
            nestingSuffix: ')'
        }
    });
}

export default Translator;