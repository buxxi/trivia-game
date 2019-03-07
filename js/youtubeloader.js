export default function YoutubeLoader() {
	var self = this;
	var YOUTUBE_REGION = 'SE';

	self.loadChannel = function(channelId, progress, apiKey) {
		return new Promise((resolve, reject) => {
			var result = [];

			function loadUploads() {
				fetch(`https://www.googleapis.com/youtube/v3/channels?id=${channelId}&key=${apiKey}&part=contentDetails`).
				then(toJSON).
				then((data) => {
					loadPage(data.items[0].contentDetails.relatedPlaylists.uploads);
				});
			}

			function loadPage(playListId, pageToken) {
				var url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&playlistId=${playListId}&part=id,snippet,contentDetails&maxResults=50`;
				if (pageToken) {
					url = url = `${url}&pageToken=${pageToken}`;
				}
				fetch(url).
				then(toJSON).
				then((data) => {
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
						loadPage(playListId, nextPage);
					} else {
						resolve(result);
					}
				}).catch((err) => {
					console.log(err);
					loadPage(playListId, pageToken);
				});
			}

			loadUploads();
		});
	}

	self.checkEmbedStatus = function(videoId, apiKey) {
		return new Promise((resolve, reject) => {
			fetch(`https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoId}&part=status,contentDetails`).
			then(toJSON).
			then((data) => {
				if (data.items.length == 0) {
					return reject("Video not found");
				}
				var item = data.items[0];
				if (!item.status.embeddable) {
					return reject("Video not embeddable");
				}
				var regionRestriction = item.contentDetails.regionRestriction;
				if (regionRestriction) {
					if (regionRestriction.blocked && regionRestriction.blocked.indexOf(YOUTUBE_REGION) != -1) {
						return reject("Video is not available in " + YOUTUBE_REGION);
					}
					if (regionRestriction.allowed && regionRestriction.allowed.indexOf(YOUTUBE_REGION) == -1) {
						return reject("Video is not available in " + YOUTUBE_REGION);
					}
				}
				resolve();
			});
		});
	}

	function toJSON(response) { //TODO: copy pasted
		if (!response.ok) {
			throw response;
		}
		return response.json();
	}
}
