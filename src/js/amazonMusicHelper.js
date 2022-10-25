async function startUp() {
	await syncWithAmazonMusic();
	let amznMusic = await browser.storage.sync.get("amznMusic");
	if(amznMusic != undefined) {
		//browser.browserAction.enable();
	} else {
		//browser.browserAction.disable();
	}
}

async function syncWithAmazonMusic() {
	// look for amazon music in open tabs
	var amazonMusicTabId = await getAmazonMusicTabId();

	if(amazonMusicTabId != undefined) {
		// add listener for amazon music requests
		addEventListeners();
		// execute content script to receive amznMusic object from tab
		browser.tabs.executeScript(amazonMusicTabId, {
			file: "/src/js/amazonMusicHelperContent.js"
		});

		browser.runtime.onMessage.addListener((message) => {
		  	//console.log(message.amznMusic);
		  	// check if we are logged in
		  	if(message.amznMusic.appConfig.accessToken != "") {
			  	// save object to storage
			  	browser.storage.sync.set({ amznMusic: message.amznMusic });
			} else {
				// remove old amznMusic object
				browser.storage.sync.remove("amznMusic");
				console.warn("Not logged in to amazon music.");
			}
		});
	}
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
		}, onError);
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

startUp();

browser.browserAction.setTitle({
    "title": getManifestDetails().title
});
browser.browserAction.onClicked.addListener(() => { addTrackToPlaylist() });


browser.commands.onCommand.addListener((command) => {
    if (command === "amazonMusicHelper-currentSongInfo") {
        showSongNotification();
    }
});

browser.menus.create({
    id: "amazonMusicHelperAddSongToPlaylist",
    title: "Add current song to playlist",
    contexts: ["browser_action"],
    onclick: () => {
        addTrackToPlaylist();
    }
});

getPlaylists().then((playlists) => {
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

browser.menus.onClicked.addListener((info, tab) => {
	if(info.parentMenuItemId == "amazonMusicHelperAddSongToPlaylist") {
		browser.storage.sync.get('amazonMusicPlaylists').then((data) => {
			let selectedPlaylist = data.amazonMusicPlaylists.at(info.menuItemId.substr(35));
			addTrackToPlaylist(selectedPlaylist);
		});
	}
});

browser.menus.create({
    id: "amazonMusicHelperShoWSongNotification",
    title: "Show current song information",
    contexts: ["browser_action"],
    onclick: () => {
        showSongNotification();
    }
});

/** Install */

browser.runtime.onInstalled.addListener(async function(){
	// set default settings
	browser.storage.sync.set("amazonMusicHelperShowNotifications", true);
});