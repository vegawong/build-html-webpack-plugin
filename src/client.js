
import socket from 'webpack-dev-server/client/socket';
import url from 'url';

function getCurrentScriptSource() {
  // `document.currentScript` is the most accurate way to find the current script,
  // but is not supported in all browsers.
  if (document.currentScript) {
    return document.currentScript.getAttribute('src');
  }
  // Fall back to getting all scripts in the document.
  const scriptElements = document.scripts || [];
  const currentScript = scriptElements[scriptElements.length - 1];
  if (currentScript) {
    return currentScript.getAttribute('src');
  }
  // Fail as there was no script to use.
  throw new Error('[WDS] Failed to get current script source');
}


let urlParts;
if (typeof __resourceQuery === 'string' && __resourceQuery) {
  // If this bundle is inlined, use the resource query to get the correct url.
  urlParts = url.parse(__resourceQuery.substr(1));
} else {
  // Else, get the url from the <script> this file was called with.
  let scriptHost = getCurrentScriptSource();
  scriptHost = scriptHost.replace(/\/[^\/]+$/, '');
  urlParts = url.parse((scriptHost || '/'), false, true);
}

let hostname = urlParts.hostname;
let protocol = urlParts.protocol;

// check ipv4 and ipv6 `all hostname`
if (hostname === '0.0.0.0' || hostname === '::') {
  // why do we need this check?
  // hostname n/a for file protocol (example, when using electron, ionic)
  // see: https://github.com/webpack/webpack-dev-server/pull/384
  if (self.location.hostname && !!~self.location.protocol.indexOf('http')) {
    hostname = self.location.hostname;
  }
}

// `hostname` can be empty when the script path is relative. In that case, specifying
// a protocol would result in an invalid URL.
// When https is used in the app, secure websockets are always necessary
// because the browser doesn't accept non-secure websockets.
if (hostname && (self.location.protocol === 'https:' || urlParts.hostname === '0.0.0.0')) {
  protocol = self.location.protocol;
}

const onSockMsg = {
  changeTpl() {
    console.log('[WDS] The html template was changed! Reloading...');
    self.location.reload();
  }
};


const socketUrl = url.format({
  protocol,
  auth: urlParts.auth,
  hostname,
  port: (urlParts.port === '0') ? self.location.port : urlParts.port,
  pathname: urlParts.path === null || urlParts.path === '/' ? '/sockjs-node' : urlParts.path
});

socket(socketUrl, onSockMsg);
