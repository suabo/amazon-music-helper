async function startUp() {
	// add listener for amazon music requests
	addEventListeners();
	syncWithAmazonMusic().then((amznMusic) => {
		//console.log(amznMusic);
		browser.browserAction.enable();
	}, (error) => {
		console.warn(error);
		browser.browserAction.disable();
	});

	// add main browser icon onClicked listener
	browser.browserAction.onClicked.addListener(() => { 
		addTrackToPlaylist().then((playlist) => {
			showAddedToPlaylistNotification(playlist);
		}, onError);
	});

	createToolbarButtonContextMenus();

	// add listener for commands
	browser.commands.onCommand.addListener((command) => {
	    if (command === "amazonMusicHelper-currentSongInfo") {
	        showSongNotification();
	    }
	});
}

async function syncWithAmazonMusic() {
	return new Promise((resolve, reject) => {
		// look for amazon music in open tabs
		getAmazonMusicTabId().then((amazonMusicTabId) => {
			if(amazonMusicTabId != undefined) {
				// check if we already got access token
				browser.storage.sync.get("amznMusic").then((amznMusic) => {
					if(amznMusic.appConfig != undefined && amznMusic.appConfig.accessToken != "") {
						resolve(amznMusic);
					}
				});

				browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
					if(tabId == amazonMusicTabId) {
						console.warn("The amazon music tab was closed. The extension will not work without a tab opened with amazon music.");
					}
				});

				// execute content script to receive amznMusic object from tab
				browser.tabs.executeScript(amazonMusicTabId, {
					file: "/src/js/amazonMusicHelperContent.js"
				});

				browser.runtime.onMessage.addListener((message) => {
				  	//console.log(message.amznMusic);
				  	// check if we are logged in
				  	if(message.amznMusic.appConfig.accessToken != "") {
					  	// save object to storage
					  	//browser.storage.sync.set({ amznMusic: message.amznMusic });
					  	resolve(message.amznMusic);
					} else {
						// remove old amznMusic object
						browser.storage.sync.remove("amznMusic");
						reject("Not logged in to amazon music.");
					}
				});
			} else {
				// remove old amznMusic object
				browser.storage.sync.remove("amznMusic");
				reject("No tab with amazon music found.");
			}
		});
	});
}

async function getAmazonMusicTabId() {
	return new Promise((resolve) => {
		browser.tabs.query({}).then((tabs) => {
			for (const tab of tabs) {
				if(tab.url.includes("music.amazon.")) {
					// save tab id to storage
					browser.storage.sync.set({ amazonMusicTabId: tab.id });
					return resolve(tab.id);
				}
			}
			resolve();
		}, onError);
	});
}

function enableBrowserAction() {
	browser.browserAction.isEnabled({}).then((enabled) => {
		if(!enabled) {
			syncWithAmazonMusic().then((amznMusic) => {
				//console.log(amznMusic);
				browser.browserAction.enable();
				updateToolbarButtonPlaylistContextMenu();
			}, (error) => {
				console.error(error);
				browser.browserAction.disable();
			});			
		}
	});	
}

// open the addon options window, or if already opened, bring to front preventing multiple windows
function openAddonOptions() {
    browser.windows.getAll({
        "populate": true
    }, getAddonOptions);
}

function getAddonOptions(details) {
    let existingWindow;
    if (details.length > 0) {
        details.some(eachWindow => {
            if (eachWindow.tabs && eachWindow.tabs.some(tab => tab.url.includes("/src/html/options.html"))) {
                existingWindow = eachWindow;
            }
        })
    }
    if (existingWindow) {
        browser.tabs.query({
            "windowId": existingWindow.id,
            "url": browser.runtime.getURL("/src/html/options.html")
        }, function(tabs) {
            if (tabs && tabs.length == 1) {
                browser.windows.update(
                    existingWindow.id, {
                        focused: true
                    }
                );
                browser.tabs.update(tabs[0].id, {
                    active: true
                });
            }
        })
    } else {
        browser.runtime.openOptionsPage();
    }
}

function createToolbarButtonContextMenus() {
	browser.menus.create({
	    id: "amazonMusicHelperAddSongToPlaylist",
	    title: "Add current song to playlist",
	    contexts: ["browser_action"]
	});

	updateToolbarButtonPlaylistContextMenu();

	browser.menus.create({
	    id: "amazonMusicHelperShoWSongNotification",
	    title: "Show current song information",
	    contexts: ["browser_action"]
	});

	browser.menus.onClicked.addListener((info, tab) => {
		if(info.parentMenuItemId == "amazonMusicHelperAddSongToPlaylist") {
			browser.storage.sync.get('amazonMusicPlaylists').then((data) => {
				if(data.amazonMusicPlaylists != undefined) {
					let selectedPlaylist = data.amazonMusicPlaylists.at(info.menuItemId.substr(35));
					addTrackToPlaylist(selectedPlaylist).then((playlist) => {
						showAddedToPlaylistNotification(playlist);
					}, onError);
				}
			});
		}
		if(info.menuItemId == "amazonMusicHelperShoWSongNotification") {
			showSongNotification();
		}
	});
}

function updateToolbarButtonPlaylistContextMenu() {
	getPlaylists().then((playlists) => {
		// remove all playlists
		for(let i = 0; i < playlists.length; i++) {
			browser.menus.remove("amazonMusicHelperAddSongToPlaylist-" + i);
		}
		// insert all playlists
		let i = 0;
		for (let playlist of playlists) {
			browser.menus.create({
			    id: "amazonMusicHelperAddSongToPlaylist-" + i,
			    parentId: "amazonMusicHelperAddSongToPlaylist",
			    title: playlist.name,
			    contexts: ["browser_action"]
			});
			i++;
		}		
	}).catch(onError);
}

startUp();

/** Install */

browser.runtime.onInstalled.addListener(async function(){
	// set default settings
	browser.storage.sync.set("amazonMusicHelperShowNotifications", true);
});