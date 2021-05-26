import { promises as fs } from 'fs';

const CACHE_PATH = '.cache';

class FileSystemCache {
	constructor(primaryKey) {
		this._primaryKey = primaryKey;
	}

	get(subKey, promiseFunction) {
		return new Promise(async (resolve, reject) => {
			let folderPath = `${CACHE_PATH}/${this._primaryKey}`;
			let filePath = `${folderPath}/${subKey}.json`
			try {
				let data = await fs.readFile(filePath);
				resolve(JSON.parse(data));
			} catch (e) {
				promiseFunction(async (result) => {
					try {
						await fs.mkdir(folderPath, { recursive: true });
						await fs.writeFile(filePath, JSON.stringify(result));
						resolve(result);
					} catch(e) {
						reject(e);
					}
				}, reject);
			}
		});
	}

	static clearAll() {
		throw new Error("Not implemented");
	}
}

export default FileSystemCache;