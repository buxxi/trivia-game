import i18next from 'i18next';

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

        return i18n(key, variables);
    }
}

export async function init(config) {
    let languages = ['sv', 'en'];
    let paths = ['./translations/{language}.mjs'];

    let resources = Object.fromEntries(languages.map(l => [l, { translation: {}}]));

    for (let path of paths) {
        for (let language of languages) {
            let p = path.replace("{language}", language);
            let data = await import(p);
            resources[language].translation = Object.assign(resources[language].translation, data.default);
        }
    }

    i18n = await i18next.init({
        lng: 'en',
        resources: resources
    });
}

export default Translator;