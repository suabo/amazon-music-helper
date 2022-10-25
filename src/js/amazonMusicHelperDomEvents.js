const isFF = window.browser ? true : false;

const reqBody = isFF ? ["requestBody"] : ["requestBody", "extraHeaders"];
const reqHeaders = isFF ? ["requestHeaders"] : ["requestHeaders", "extraHeaders"];
const reqHeadersBlocking = isFF ? ["blocking", "requestHeaders"] : ["blocking", "requestHeaders", "extraHeaders"];
const resHeaders = isFF ? ["responseHeaders"] : ["responseHeaders", "extraHeaders"];
const resHeadersBlocking = isFF ? ["blocking", "responseHeaders"] : ["blocking", "responseHeaders", "extraHeaders"];
const errorHeaders = ["extraHeaders"];
const r = browser.webRequest;

function onBeforeRequestListener(details) {
  details.callerName = "onBeforeRequest";
  details.requestIdEnhanced = details.requestId;
  eventTracker.logRequestDetails(details);
}

function onBeforeSendHeadersListener(details) {
  details.callerName = "onBeforeSendHeaders";
  details.requestIdEnhanced = details.requestId;
  eventTracker.logRequestDetails(details);
  return { requestHeaders: details.requestHeaders };
}

function onSendHeadersListener(details) {
  details.callerName = "onSendHeaders";
  details.requestIdEnhanced = details.requestId;
  eventTracker.logRequestDetails(details);
}

function onBeforeRedirectListener(details) {
  details.callerName = "onBeforeRedirect";
  details.requestIdEnhanced = details.requestId;
  eventTracker.logRequestDetails(details);
}

function onCompletedListener(details) {
  details.callerName = "onCompleted";
  details.requestIdEnhanced = details.requestId;
  eventTracker.logRequestDetails(details);
}

function addEventListeners() {
  r.onBeforeRequest.addListener(
    onBeforeRequestListener, TRACKURLS, reqBody
  );

  r.onBeforeSendHeaders.addListener(
    onBeforeSendHeadersListener, TRACKURLS, reqHeadersBlocking
  );

  r.onSendHeaders.addListener(
    onSendHeadersListener, TRACKURLS, reqHeaders
  );

  r.onBeforeRedirect.addListener(
    onBeforeRedirectListener, TRACKURLS, resHeaders
  );

  r.onCompleted.addListener(
    onCompletedListener, TRACKURLS, resHeaders
  );
}

function removeEventListeners() {
  if(r.onBeforeRequest.hasListener(onBeforeRequestListener)) {
    r.onBeforeRequest.removeListener(onBeforeRequestListener);
  }

  if(r.onBeforeSendHeaders.hasListener(onBeforeSendHeadersListener)) {
    r.onBeforeSendHeaders.removeListener(onBeforeSendHeadersListener);
  }

  if(r.onSendHeaders.hasListener(onSendHeadersListener)) {
    r.onSendHeaders.removeListener(onSendHeadersListener);
  }

  if(r.onBeforeRedirect.hasListener(onBeforeRedirectListener)) {
    r.onBeforeRedirect.removeListener(onBeforeRedirectListener);
  }

  if(r.onCompleted.hasListener(onCompletedListener)) {
    r.onCompleted.removeListener(onCompletedListener);
  }
}