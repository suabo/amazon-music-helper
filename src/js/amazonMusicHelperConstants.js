// listen to this request pattern
const TRACKURLS = {
  urls: [ "https://eu.mesk.skill.music.a2z.com/*" ],
  types: [ "xmlhttprequest" ]
};
// there are also requests with method OPTION, we want to filter them since they don't contain the wanted content
const LISTENREQUESTMETHOD = "POST";
// playback finished url
const PLAYBACKFINISHEDURL = "https://eu.mesk.skill.music.a2z.com/api/playbackFinished";
// show playlists url
const SHOWPLAYLISTSURL = "https://eu.mesk.skill.music.a2z.com/api/showLibraryPlaylists";
// add song to playlist
const ADDTOPLAYLISTURL = "https://eu.mesk.skill.music.a2z.com/api/addTrackToPlaylist";
// remove request header
const REMOVEREQUESTHEADER = [
	// header not allowed to overwrite
	"Host",
	"User-Agent",
	"Accept",
	"Accept-Language",
	"Accept-Encoding",
	"Cookie",
	"Content-Type",
	"Content-Length",
	"Connection",
	"Referer",
	"Origin",
	"Sec-Fetch-Dest",
	"Sec-Fetch-Mode",
	"Sec-Fetch-Site",
	// amazon header need to be overwritten
	"x-amzn-request-id", 
	"x-amzn-timestamp"
];