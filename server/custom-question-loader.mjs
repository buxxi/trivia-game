import path from 'path';
import {fileURLToPath, pathToFileURL} from 'url';
import {customQuestionPath} from "./xdg.mjs";
import {realpathSync} from "fs";

const ALLOWED_DEPENDENCIES = ['world-countries', 'convert-units'];

function isSubPath(parent, dir) {
    try {
        parent = realpathSync(parent);
        dir = realpathSync(dir);
        const relative = path.relative(parent, dir);
        return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
    } catch (e) {
        // If any of the paths doesn't exist, treat it as not sub path
        if (e.code === 'ENOENT') {
            return false;
        } else {
            throw e;
        }
    }
}

export function resolve(specifier, context, nextResolve) {
    if (isSubPath(customQuestionPath('.'), fileURLToPath(context.parentURL)) && (specifier.startsWith("#") || ALLOWED_DEPENDENCIES.includes(specifier))) {
        context = Object.assign(Object.assign({}, context), {parentURL: pathToFileURL(import.meta.url)});
    }
    return nextResolve(specifier, context);
}