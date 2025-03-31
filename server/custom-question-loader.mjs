import path from 'path';
import {fileURLToPath, pathToFileURL} from 'url';
import {customQuestionPath} from "./xdg.mjs";
import {realpathSync} from "fs";

function isSubPath(parent, dir) {
    parent = realpathSync(parent);
    dir = realpathSync(dir);
    const relative = path.relative(parent, dir);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}


export function resolve(specifier, context, nextResolve) {
    if (isSubPath(customQuestionPath('.'), fileURLToPath(context.parentURL)) && specifier.startsWith("#")) {
        context = Object.assign(Object.assign({}, context), {parentURL: pathToFileURL(import.meta.url)});
    }
    return nextResolve(specifier, context);
}