import fetch from 'node-fetch';

const YOUTUBE_REGION = 'SE';

class YoutubeLoader {
	constructor(channelId, apiKey) {
		this._channelId = channelId;
		this._apiKey = apiKey;
	}

	async loadChannel(progress) {
		let response = await fetch(`https://www.googleapis.com/youtube/v3/channels?id=${this._channelId}&key=${this._apiKey}&part=contentDetails`);
		let data = await this._toJSON(response);
		var result = [];
		let playListId = data.items[0].contentDetails.relatedPlaylists.uploads;
		result = await this._loadPage(result, progress, playListId);
		return result;
	}

	async checkEmbedStatus(videoId) {
		let response = await fetch(`https://www.googleapis.com/youtube/v3/videos?key=${this._apiKey}&id=${videoId}&part=status,contentDetails`);
		let data = await this._toJSON(response);
		if (data.items.length == 0) {
			throw new YoutubeError("Video not found");
		}
		let item = data.items[0];
		if (!item.status.embeddable) {
			throw new YoutubeError("Video not embeddable");
		}
		let regionRestriction = item.contentDetails.regionRestriction;
		if (regionRestriction) {
			if (regionRestriction.blocked && regionRestriction.blocked.indexOf(YOUTUBE_REGION) != -1) {
				throw new YoutubeError("Video is not available in " + YOUTUBE_REGION);
			}
			if (regionRestriction.allowed && regionRestriction.allowed.indexOf(YOUTUBE_REGION) == -1) {
				throw new YoutubeError("Video is not available in " + YOUTUBE_REGION);
			}
		}
	}

	async _loadPage(result, progress, playListId, pageToken) {
		let url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${this._apiKey}&playlistId=${playListId}&part=id,snippet,contentDetails&maxResults=50`;
		if (pageToken) {
			url = url = `${url}&pageToken=${pageToken}`;
		}
		
		let response = await fetch(url);
		let data = await this._toJSON(response);
		let current = result.length;
		let total = data.pageInfo.totalResults;
		progress(current, total);
		let nextPage = data.nextPageToken;

		result = result.concat(data.items.map((item) => {
			return {
				id : item.contentDetails.videoId,
				title : item.snippet.title
			}
		}));
		if (nextPage) {
			result = await this._loadPage(result, progress, playListId, nextPage);
			return result;
		} else {
			return result;
		}
	}

	_toJSON(response) { //TODO: copy pasted
		if (!response.ok) {
			throw response;
		}
		return response.json();
	}
}

class YoutubeError extends Error {
	constructor(message) {
		super(message);
	}
}

export default YoutubeLoader;

export {YoutubeLoader, YoutubeError};