/*
 * #%L
 * AEM Chrome Plug-in
 * %%
 * Copyright (C) 2016 Adobe
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */

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
                // TODO: Better added to a directive
                $('.data-container').scrollTop(100000000);
              }
            );
          }
        }
      });

      //Send message to enable tracer headers for *this* tab
      port.postMessage({"action" : "register", "tabId" : chrome.devtools.inspectedWindow.tabId});

      // Listen to the message from background page
      port.onMessage.addListener(function (msg) {
          if(msg.url === afPlugin.url) {
              $(document).trigger("editorLoaded.afPlugin");
          }
      });
  };

  return {
    listen: function(scope) {
      bindListener(scope);
    }
  };
}]);
