function saveOptions() {
    browser.storage.sync.set({
        amazonMusicHelperDefaultPlaylist: document.getElementById('amazonMusicHelperDefaultPlaylist').selectedIndex,
        amazonMusicHelperShowNotifications: document.getElementById('amazonMusicHelperShowNotifications').checked
    }, function() {
        var status = document.getElementById('status');
        status.style.display = 'inline-block';
        setTimeout(function() {
            status.style.display = 'none';
        }, 5000);
    });
}

function restoreOptions() {
	browser.storage.sync.get({
		amazonMusicPlaylists: {},
        amazonMusicHelperDefaultPlaylist: 0,
        amazonMusicHelperShowNotifications: true
    }, function(data) {
        document.getElementById("amazonMusicHelperShowNotifications").checked = data.amazonMusicHelperShowNotifications;
        // load amazon music playlists to select a default one to add to
		getPlaylists().then((playlists) => {
			if(playlists.length > 0) {
				let i = 0;
				for (let playlist of playlists) {
					var option = document.createElement('option');
					option.innerHTML = playlist.name;
					option.value = playlist.id;
					
					document.getElementById("amazonMusicHelperDefaultPlaylist").appendChild(option);
					i++;
				}
				document.getElementById("amazonMusicHelperDefaultPlaylist").disabled = false;
				document.getElementById("amazonMusicHelperDefaultPlaylist").selectedIndex = data.amazonMusicHelperDefaultPlaylist;
			} else {
				document.getElementById("amazonMusicHelperDefaultPlaylist").disabled = true;
			}
		});
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);