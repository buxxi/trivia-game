function YoutubeLoader($http) {
	var self = this;
	var YOUTUBE_REGION = 'SE';

	self.loadChannel = function(channelId, progress, apiKey) {
		return new Promise((resolve, reject) => {
			var result = [];

			function loadUploads() {
				$http.get('https://www.googleapis.com/youtube/v3/channels', {
					params : {
						id : channelId,
						key : apiKey,
						part : 'contentDetails'
					}
				}).then((response) => {
					loadPage(response.data.items[0].contentDetails.relatedPlaylists.uploads);
				});
			}

			function loadPage(playListId, pageToken) {
				$http.get('https://www.googleapis.com/youtube/v3/playlistItems', {
					params : {
						key : apiKey,
						playlistId : playListId,
						part : 'id,snippet,contentDetails',
						maxResults : 50,
						pageToken : pageToken
					}
				}).
				then((response) => {
					var current = result.length;
					var total = response.data.pageInfo.totalResults;
					progress(current, total);
					var nextPage = response.data.nextPageToken;

					result = result.concat(response.data.items.map((item) => {
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
				});
			}

			loadUploads();
		});
	}

	self.checkEmbedStatus = function(videoId, apiKey) {
		return new Promise((resolve, reject) => {
			$http.get('https://www.googleapis.com/youtube/v3/videos', {
				params : {
					key : apiKey,
					id : videoId,
					part : 'status,contentDetails'
				}
			}).then((response) => {
				var item = response.data.items[0];
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

}