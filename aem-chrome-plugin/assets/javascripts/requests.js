/**
 * Port used to communicate with background logic in background.js
 */
var port = chrome.runtime.connect({name: "aem-panel"});


/**
 * Listen for Requests in the current window and process them accordingly.
 **/

var requests = {
  bindListener: function(scope) {

    chrome.devtools.network.onRequestFinished.addListener(function(chromeRequest) {
      var httpTransaction = createHTTPTransaction(chromeRequest);
      if (httpTransaction && httpTransaction.key) {

        if (chrome && chrome.runtime) {
          console.log("Requesting Sling Tracer JSON for: " + chromeRequest.request.url);
          chrome.runtime.sendMessage({
              action: 'getSlingTracerJSON',
              requestId: httpTransaction.key
            },
            function(data) {
              if (data) {
                panel.addData(httpTransaction, data, scope);
              }
              //$('.data-container').scrollTop(100000000);
            }
          );
        }
      }
    });

    //Send message to enable tracer headers for *this* tab
    port.postMessage({"action" : "register", "tabId" : chrome.devtools.inspectedWindow.tabId});
  }
};

var createHTTPTransaction = function(request) {
  var httpTransaction, requestId;

  requestId = request.response.headers.find(function(header) {
    if (header.name.toLowerCase() === 'sling-tracer-request-id' && header.value) {
      return true;
    }
  });

  if (requestId) {
    requestId = requestId.value;
  }

  if (requestId) {
    // initialize the httpTransaction w the Chrome Request/Response object
    httpTransaction = request;
    httpTransaction.key = requestId;
    return httpTransaction;
  } else {
    return null;
  }
};
