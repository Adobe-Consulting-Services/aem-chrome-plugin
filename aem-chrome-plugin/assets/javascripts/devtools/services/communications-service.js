angular.module('aem-chrome-plugin-app')
/**
 * Angular Service responsible for brokering communication between the Chrome devtools and background script.
 **/
.factory('CommunicationsService', [ 'RequestsService', function(requests) {

  /**
   * Port used to communicate with background logic in background.js
   */
  var port = chrome.runtime.connect({name: 'aem-chrome-plugin'});

  /**
   * Listen for Requests in the current window and process accordingly.
   **/
  var bindListener = function(scope) {

      chrome.devtools.network.onRequestFinished.addListener(function(chromeRequest) {
        var request = requests.create(chromeRequest);
        if (request && request.key) {

          if (chrome && chrome.runtime) {
            console.log("Requesting Sling Tracer JSON for: " + chromeRequest.request.url);
            chrome.runtime.sendMessage({
                action: 'getSlingTracerJSON',
                requestId: request.key
              },
              function(data) {
                if (data) {
                  scope.processRequest(request, data);
                }
                // Better added to a directive
                $('.data-container').scrollTop(100000000);
              }
            );
          }
        }
      });

      //Send message to enable tracer headers for *this* tab
      port.postMessage({"action" : "register", "tabId" : chrome.devtools.inspectedWindow.tabId});
  };

  return {
    listen: function(scope) {
      bindListener(scope);
    }
  };
}]);
