angular.module('aem-chrome-plugin-app')
/**
 * Angular Service responsible for brokering communication between the Chrome devtools and background service worker.
 **/
.factory('CommunicationsService', [ 'RequestsService', function(requests) {

  /**
   * Port used to communicate with the background service worker in background.js (service worker).
   * In Manifest V3, this is asynchronous and we are using chrome.runtime.connect in an updated way.
   */
  var port = chrome.runtime.connect({name: 'aem-chrome-plugin'});

  /**
   * Listen for Requests in the current window and process accordingly.
   **/
  var bindListener = function(scope) {
    // Listen for network requests finished in the current devtools context
    chrome.devtools.network.onRequestFinished.addListener(function(chromeRequest) {
      var request = requests.create(chromeRequest);
      if (request && request.key) {
        console.log("Requesting Sling Tracer JSON for: " + chromeRequest.request.url);

        // Send a message to the service worker (background.js) to fetch Sling Tracer data
        chrome.runtime.sendMessage({
          action: 'getSlingTracerJSON',
          requestId: request.key,
          tabId: chrome.devtools.inspectedWindow.tabId
        }, function(data) {
          if (chrome.runtime.lastError) {
            console.error('Error: ', chrome.runtime.lastError);
            return;
          }
          
          if (data) {
            scope.processRequest(request, data);
          } else {
            console.log('Unable to collect Sling Log Tracer data');
          }
        });
      }
    });

    // Register the tab with the service worker to enable header injection for this tab
    port.postMessage({
      action: 'register',
      tabId: chrome.devtools.inspectedWindow.tabId
    });

    // Listen to messages from the background service worker (this is async now)
    port.onMessage.addListener(function(msg) {
      if (msg.url === afPlugin.url) {
        $(document).trigger("editorLoaded.afPlugin");
      }
    });
  };

  return {
    // Start the listener
    listen: function(scope) {
      bindListener(scope);
    }
  };
}]);
