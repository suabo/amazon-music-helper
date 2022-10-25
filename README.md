# Amazon Music Helper

Amazon Music Helper is a browser extension which helps you add tracks to your favourite playlist and send notifications with next song informations.
The extension will add an icon to your browser bar. This way you can add the currently playing track without the need to switch into the browser window/tab with Amazon Music playing. The extension will grab your existing connection to amazon music and use it to make it happen. This way you only need to listen to your music like you would normally. If you use the shortcuts you can even hide the icon in the toolbar by customizing your toolbar.

## How Amazon Music Helper works?

The extension will look for a open tab with music.amazon. loaded and hook onto it. 
It will look for requests matching `https://eu.mesk.skill.music.a2z.com/*` and listen to them for request header and current song information.
The extension needs the request header to make own request (getPlaylists, addToPlaylist). Current song information is needed to display notifications
and add a track to the playlist. On startup and opening the options page it will send a request to receive your playlists and save them in browser storage.
Another request is sent if a song is added to a playlist.

## Shortcuts

* `STRG` + `SHIFT` + `1` - Add current song to playlist

* `STRG` + `SHIFT` + `2` - Show notification for currently playing song

## Install

[Add to Firefox](https://addons.mozilla.org/de/firefox/addon/amazon-music-helper/)

Add to Chrome is coming soon


## Credits
[HTTP-TRACKER](https://github.com/venukbh/http-tracker) - Thanks for showing me how to listen to requests made by browser

[Amazon Music](https://icons8.com/icon/3TE5FcLikFfj/amazon-music) icon by [Icons8](https://icons8.com)