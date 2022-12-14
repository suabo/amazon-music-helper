async function addTrackToPlaylist(playlist, track) {
	return new Promise((resolve, reject) => {
		// load track from storage if not given
		browser.storage.sync.get([
			'amazonMusicCurrentSong',
			'amazonMusicHelperDefaultPlaylist',
			'amazonMusicPlaylists',
			'amazonRequestHeaders'
		]).then((data) => {
			// check if user is logged in
			if(data.amazonRequestHeaders == undefined) {
				return reject("addTrackToPlaylist: storage property amazonRequestHeaders not set!")
			}
			var addTrackRequest = {
				"isTrackInLibrary": "false",
				"playlistId": "[playlist.id]",
				"playlistTitle": "[playlist.name]",
				"rejectDuplicate": "true",
				"shouldReplaceAddedTrack": "false",
				"trackId": "[track.id]",
				"trackTitle": "[track.title]",
				"userHash": "{\"level\":\"HD_MEMBER\"}",
				"version": "99" // can't find out where we get this but 99 seams to work?
			};
			if(track == undefined) {
				addTrackRequest.trackId = data.amazonMusicCurrentSong.mediaId;
				addTrackRequest.trackTitle = data.amazonMusicCurrentSong.title;
			} else {
				addTrackRequest.trackId = track.id;
				addTrackRequest.trackTitle = track.title;
			}
			// load playlist from storage if not given
			if(playlist == undefined) {
				playlist = data.amazonMusicPlaylists.at(data.amazonMusicHelperDefaultPlaylist);
			}
			addTrackRequest.playlistId = playlist.id;
			addTrackRequest.playlistTitle = playlist.name;

			const xhr = new XMLHttpRequest();
			xhr.open("POST", ADDTOPLAYLISTURL, true);
			// set content type
			xhr.setRequestHeader("Content-Type", "application/json");
			// set amazon header
			data.amazonRequestHeaders.forEach((header) => {
				xhr.setRequestHeader(header.name, header.value);
			});
			let amazonCustomHeader = createCustomAmazonHeader();
			xhr.setRequestHeader("x-amzn-request-id", amazonCustomHeader.requestId);
			xhr.setRequestHeader("x-amzn-timestamp", amazonCustomHeader.timestamp);

			xhr.onreadystatechange = () => {
			  	if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
				    let response = JSON.parse(xhr.response);
				    //console.log(response);
				    // todo: check if we was successful
				    for (let method of response.methods) {
				    	if(method.interface == "TemplateListInterface.v1_0.CreateAndBindTemplateMethod") {
				    		reject(method.template.header);
				    	}
				    }
				    resolve(playlist);
			  	}
			}
			xhr.send(JSON.stringify(addTrackRequest));
		});
	});
}

async function getPlaylists() {
	return new Promise((resolve, reject) => {
		// load header from last recorded request
		browser.storage.sync.get('amazonRequestHeaders').then((data) => {
			if(data.amazonRequestHeaders == undefined) {
				return reject("getPlaylists: storage property amazonRequestHeaders not set!");
			}
			const xhr = new XMLHttpRequest();
			xhr.open("POST", SHOWPLAYLISTSURL, true);
			// set content type header
			xhr.setRequestHeader("Content-Type", "application/json");
			// set amazon header
			data.amazonRequestHeaders.forEach((header) => {
				xhr.setRequestHeader(header.name, header.value);
			});
			let amazonCustomHeader = createCustomAmazonHeader();
			xhr.setRequestHeader("x-amzn-request-id", amazonCustomHeader.requestId);
			xhr.setRequestHeader("x-amzn-timestamp", amazonCustomHeader.timestamp);

			xhr.onreadystatechange = () => {
			  	if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
				    var response = JSON.parse(xhr.response);
				    if(response.methods[0].template.widgets != undefined) {
					    // format playlists to a more simple object
					    let playlists = [];
					    for (var playlist of response.methods[0].template.widgets[0].items) {
					    	//console.log(playlist);
					    	playlists.push({
					    		id: playlist.primaryText.observer.storageKey,
					    		image: playlist.image,
					    		imageAltText: playlist.imageAltText,
					    		name: playlist.primaryText.observer.defaultValue.text
					    	});
					    }
					    browser.storage.sync.set({ amazonMusicPlaylists: playlists});
					    resolve(playlists);
					} else {
						reject(response.methods[0].template.header);
					}
			  	}
			}
			let requestBody = { "userHash":"{\"level\":\"HD_MEMBER\"}" };
			xhr.send(JSON.stringify(requestBody));
		});
	});
}