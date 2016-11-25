triviaApp.service('youtube', function($http, apikeys) {
	function YoutubeLoader() {
		var self = this;
		var YOUTUBE_REGION = 'SE';

		self.loadChannel = function(channelId, progress) {
			return new Promise(function(resolve, reject) {
				var result = [];

				function loadUploads() {
					$http.get('https://www.googleapis.com/youtube/v3/channels', {
						params : {
							id : channelId,
							key : apikeys.youtube,
							part : 'contentDetails'
						}
					}).then(function(response) {
						loadPage(response.data.items[0].contentDetails.relatedPlaylists.uploads);
					});
				}

				function loadPage(playListId, pageToken) {
					$http.get('https://www.googleapis.com/youtube/v3/playlistItems', {
						params : {
							key : apikeys.youtube,
							playlistId : playListId,
							part : 'id,snippet,contentDetails',
							maxResults : 50,
							pageToken : pageToken
						}
					}).
					then(function(response) {
						var current = result.length;
						var total = response.data.pageInfo.totalResults;
						progress(current, total);
						var nextPage = response.data.nextPageToken;

						result = result.concat(response.data.items.map(function(item) {
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

		self.checkEmbedStatus = function(videoId) {
			return new Promise(function(resolve, reject) {
				$http.get('https://www.googleapis.com/youtube/v3/videos', {
					params : {
						key : apikeys.youtube,
						id : videoId,
						part : 'status,contentDetails'
					}
				}).then(function(response) {
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
	return new YoutubeLoader();
});
