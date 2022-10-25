let eventTracker = (function() {
    let addedRequestId = [];
    let allRequestHeaders = new Map();
    let allRequestBodys = new Map();
    let requestIdRedirectCount = new Map();

    let logRequestDetails = async function(webEvent) {
        let inserted = insertEventUrls(webEvent);
    };

    let insertEventUrls = function(webEvent) {
        if (isEventToCapture(webEvent)) {
            setRedirectCount(webEvent);
            actionOnBeforeRequest(webEvent);
            actionOnBeforeSendHeaders(webEvent);
            actionOnSendHeaders(webEvent);
            actionOnBeforeRedirect(webEvent);
            actionOnCompleted(webEvent);
            return true;
        }
        return false;
    };

    let setRedirectCount = function(webEvent) {
        let redirectCount = requestIdRedirectCount.get(webEvent.requestId); // this value can be undefined here
        if (redirectCount === undefined) {
            redirectCount = 0;
            requestIdRedirectCount.set(webEvent.requestId, redirectCount);
        } else if (redirectCount) {
            webEvent.requestIdEnhanced = `${webEvent.requestId}_${redirectCount}`;
        }
    };

    let actionOnBeforeRequest = function(webEvent) {
    	if (webEvent.callerName === "onBeforeRequest") {
	        if (webEvent.requestBody !== undefined) {
	            formatRequestBody(webEvent);
	        }
	        // get response
	        let filter = browser.webRequest.filterResponseData(webEvent.requestId);
	        let decoder = new TextDecoder("utf-8");
	        let responseBytes = new Uint8Array();

	        filter.ondata = (event) => {
	        	// listen to response
	        	responseBytes = appendBuffer(responseBytes, event.data);
	            filter.write(event.data);
	        }
	        filter.onstop = (event) => {
	        	filter.close();
	        	let responseBody = decoder.decode(responseBytes, { stream: true });
	        	responseBody = formatResponseBody(responseBody);

	        	//console.log(webEvent.url);
	        	//console.log(responseBody);
	        	for (let interface of responseBody.methods) {
	        		// look for song informations in response
	        		if(interface.interface == "PlaybackInterface.v1_0.SetMediaMethod") {
						// create song object
						var song = {
							mediaId: interface.metadata.mediaId,
							title: interface.metadata.title,
							artistName: interface.metadata.artistName,
							artwork: interface.metadata.artwork,
							albumName: interface.metadata.albumName
						}
						// store song information in storage
						browser.storage.sync.set({
							amazonMusicCurrentSong: song,
							currentAmazonMusicTrackId: interface.metadata.mediaId
						});
						showSongNotification();
	        		}
	        	}
	        };
    	}
    };

    let actionOnBeforeSendHeaders = function(webEvent) {
        if (webEvent.callerName === "onBeforeSendHeaders") {
            insertRequestHeaders(webEvent);
        }
    };

    let actionOnSendHeaders = function(webEvent) {
        if (webEvent.callerName === "onSendHeaders") {
            insertRequestHeaders(webEvent);
        }
    };

    let actionOnBeforeRedirect = function(webEvent) {
        if (webEvent.callerName === "onBeforeRedirect") {
            if (webEvent.ip) {
                let redirectCount = requestIdRedirectCount.get(webEvent.requestId);
                requestIdRedirectCount.set(webEvent.requestId, ++redirectCount);
            }
        }
    };

    let actionOnCompleted = function(webEvent) {
        if (webEvent.callerName === "onCompleted") {
            addEventList(webEvent);
        }
    };

    let isEventToCapture = function(webEvent) {
        let captureEventHeaderMethod = headerMethodMatchIncludePattern(webEvent);
        return captureEventHeaderMethod;
    };

    let headerMethodMatchIncludePattern = function(webEvent) {
        return (webEvent.method.toUpperCase() == LISTENREQUESTMETHOD.toUpperCase() ? true : false);
    };

    let insertRequestHeaders = function(webEvent) {
        if (webEvent.requestHeaders) {
            allRequestHeaders.set(webEvent.requestIdEnhanced, webEvent);
        }
    };

    let addEventList = function(webEvent) {
        addedRequestId.push(webEvent.requestIdEnhanced);
        // save request headers to storage
        browser.storage.sync.set({
            amazonRequestHeaders: getFilteredRequestHeaders(allRequestHeaders.get(webEvent.requestIdEnhanced).requestHeaders)
        });
        // get request body
        var requestBody = allRequestBodys.get(webEvent.requestIdEnhanced);
        // try to get track id (ASIN) from request body and save it to storage
        var audioTrackASIN = (requestBody.metricsInfo != undefined && requestBody.metricsInfo.audioTrackASIN != undefined) ? requestBody.metricsInfo.audioTrackASIN : undefined;
        if (audioTrackASIN != undefined) {
            //console.log('Saved amazon music track asin: ' + allRequestBodys.get(webEvent.requestIdEnhanced).metricsInfo.audioTrackASIN);
            browser.storage.sync.set({
                currentAmazonMusicTrackId: audioTrackASIN
            })
        };
        // clean up
        allRequestHeaders.delete(webEvent.requestIdEnhanced);
        allRequestBodys.delete(webEvent.requestIdEnhanced);
        requestIdRedirectCount.delete(webEvent.requestId);
    };

    let formatRequestBody = function(webEvent) {
	    let requestBody = '';
	    let decoder = new TextDecoder("UTF-8");
	    let url = webEvent.url.toLowerCase();
	    switch (url) {
	        case "https://eu.mesk.skill.music.a2z.com/api/playbackstarted":
	            requestBody = JSON.parse(decoder.decode(webEvent.requestBody.raw[0].bytes));
	            Object.entries(requestBody).forEach(entry => {
	                const [key, value] = entry;
	                requestBody[key] = JSON.parse(value);
	            });
	            break;

	        case "https://eu.mesk.skill.music.a2z.com/api/playbackfinished":
	            // set request body for playbackFinished
	            requestBody = JSON.parse(decoder.decode(webEvent.requestBody.raw[0].bytes));
	            //console.log(requestBody);
	            break;
	    }
	    allRequestBodys.set(webEvent.requestIdEnhanced, requestBody);
	};

	let formatResponseBody = function(responseBody) {
		responseBody = JSON.parse(responseBody);
	    return responseBody;
	};

    return {
        logRequestDetails: logRequestDetails
    }
})();