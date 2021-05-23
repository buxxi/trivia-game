const fetch = require("node-fetch");

const YOUTUBE_REGION = 'SE';

class YoutubeLoader {
	constructor(channelId, apiKey) {
		this._channelId = channelId;
		this._apiKey = apiKey;
	}

	loadChannel(progress) {
		return new Promise(async (resolve, reject) => {
			try {
				let response = await fetch(`https://www.googleapis.com/youtube/v3/channels?id=${this._channelId}&key=${this._apiKey}&part=contentDetails`);
				let data = await this._toJSON(response);
				var result = [];
				let playListId = data.items[0].contentDetails.relatedPlaylists.uploads;
				result = await this._loadPage(result, progress, playListId);
				resolve(result);
			} catch (e) {
				reject(e);
			}
		});
	}

	checkEmbedStatus(videoId) {
		return new Promise(async (resolve, reject) => {
			try {
				let response = await fetch(`https://www.googleapis.com/youtube/v3/videos?key=${this._apiKey}&id=${videoId}&part=status,contentDetails`);
				let data = await this._toJSON(response);
				if (data.items.length == 0) {
					return reject("Video not found");
				}
				let item = data.items[0];
				if (!item.status.embeddable) {
					return reject("Video not embeddable");
				}
				let regionRestriction = item.contentDetails.regionRestriction;
				if (regionRestriction) {
					if (regionRestriction.blocked && regionRestriction.blocked.indexOf(YOUTUBE_REGION) != -1) {
						return reject("Video is not available in " + YOUTUBE_REGION);
					}
					if (regionRestriction.allowed && regionRestriction.allowed.indexOf(YOUTUBE_REGION) == -1) {
						return reject("Video is not available in " + YOUTUBE_REGION);
					}
				}
				resolve();
			} catch (e) {
				reject(e);
			}
		});
	}

	_loadPage(result, progress, playListId, pageToken) {
		return new Promise(async (resolve, reject) => {
			var url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${this._apiKey}&playlistId=${playListId}&part=id,snippet,contentDetails&maxResults=50`;
			if (pageToken) {
				url = url = `${url}&pageToken=${pageToken}`;
			}
			try {
				let response = await fetch(url);
				let data = await this._toJSON(response);
				var current = result.length;
				var total = data.pageInfo.totalResults;
				progress(current, total);
				var nextPage = data.nextPageToken;

				result = result.concat(data.items.map((item) => {
					return {
						id : item.contentDetails.videoId,
						title : item.snippet.title
					}
				}));
				if (nextPage) {
					result = await this._loadPage(result, progress, playListId, nextPage);
					resolve(result);
				} else {
					resolve(result);
				}
			} catch(e) {
				reject(e);
			};
		});
	}

	_toJSON(response) { //TODO: copy pasted
		if (!response.ok) {
			throw response;
		}
		return response.json();
	}
}

module.exports = YoutubeLoader;