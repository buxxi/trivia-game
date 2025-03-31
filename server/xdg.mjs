import path from "path";
import { homedir } from "os";

const APPLICATION_FOLDER = "trivia-game";

function xdgData() {
    return path.normalize(path.join(process.env.XDG_DATA_HOME || path.join(homedir(), ".local", "share"), APPLICATION_FOLDER));
}

function xdgConfig() {
    return path.normalize(path.join(process.env.XDG_CONFIG_HOME || path.join(homedir(), ".config"), APPLICATION_FOLDER));
}

function xdgCache() {
    return path.normalize(path.join(process.env.XDG_CACHE_HOME || path.join(homedir(), ".cache"), APPLICATION_FOLDER));
}

export function customQuestionPath(file) {
    return path.resolve(xdgData(), "questions", file);
}

export function customDataPath(file) {
    return path.resolve(xdgData(), "data", file);
}

export function statsPath(file) {
    return path.resolve(xdgData(), "stats", file);
}

export function configPath() {
    return path.resolve(xdgConfig(), "config.json");
}

export function cachePath(file) {
    return path.resolve(xdgCache(), file);
}