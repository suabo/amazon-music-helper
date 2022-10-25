// send amznMusic object to background script
if(window.wrappedJSObject.amznMusic != undefined) {
	browser.runtime.sendMessage({ amznMusic: window.wrappedJSObject.amznMusic });
}