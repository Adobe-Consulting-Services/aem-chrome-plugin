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

var urlFilter = '';

var tracer = (function(global){
    var tabCount = 0,
        listenerRegistered = false,
        tabs = {},
        api = {},
        activationCallback,
        deactivationCallback,
        currentTabIsTraceable = true,
        lastGoodTabOrigin = '',
        lastTestedTabOrigin = '';

    api.registerTab = function(tabId){
        console.assert(typeof tabId !== 'undefined');
        tabs[tabId] = true;
        tabCount++;
        tabCountChanged();
        console.log("Registered tab " + tabId);
    };

    api.unregisterTab = function(tabId){
        delete tabs[tabId];
        tabCount--;
        tabCountChanged();
        console.log("Unregisterd " + tabId);
    };

    api.shouldInjectHeaders = function(tabId) {
        return tabs.hasOwnProperty(tabId);
    };

    api.registerListener = function (activate, deactivate) {
        activationCallback = activate;
        deactivationCallback = deactivate;
    };

    var tabCountChanged = function () {
        if (tabCount <= 0 && (typeof deactivationCallback !== 'undefined') && listenerRegistered){
            deactivationCallback();
            listenerRegistered = false;
        } else if (tabCount > 0 && (typeof activationCallback !== 'undefined') && !listenerRegistered){
            activationCallback();
            listenerRegistered = true;
        }
    };

    return api;
}(this));


/**
 * Options Initialization
 *
 * Initialize the local storate AEM Panel options if they do not already exist.
 * This triggers for first use of the plug-in or when local storage has been cleared.
 **/
if (!localStorage.getItem('aem-chrome-plugin.options')) {
  localStorage.setItem('aem-chrome-plugin.options',
      JSON.stringify({
          user: 'admin',
          password: 'admin',
          tracerSets: [
              {
                enabled: true,
                permanent: true,
                package: 'org.apache.jackrabbit.oak.query',
                level: 'DEBUG'
              },
              {
                enabled: true,
                permanent: true,
                package: 'org.apache.jackrabbit.oak.jcr.operations.writes',
                level: 'TRACE'
              }
          ],
          servletContext: '',
          maxHistory: 200
      })
  );
}
    

// An array of all the connections
var ports =[];
chrome.runtime.onConnect.addListener(function(port) {
    console.assert(port.name == "aem-chrome-plugin");
    ports.push(port);
    var tabId;
    port.onMessage.addListener(function(msg) {
        var action = msg.action;
        if (action === "register"){
            tabId = msg.tabId;
            tracer.registerTab(tabId);
        }
    });

    port.onDisconnect.addListener(function(msg){
        if (typeof tabId !== 'undefined') {
            tracer.unregisterTab(tabId);
        //remove the port when the devtools panel is disconnected.
        var index = ports.indexOf(port);
            ports.splice(index,1);
        }
    });
});

/*
* This function sends the message to all the devtools panel connected to the background page
* */
function sendToDevTools(msg){
    ports.forEach(function(port){
        port.postMessage(msg);
    });
}

/**
 * Listen for messages from the devtools panel. Supported message types are:
 * > message.action => getSlingTracerJSON
 * > message.action => updateURLFilter
 **/
chrome.runtime.onMessage.addListener(
  function(message, sender, callback) {
    if (message.action === 'getSlingTracerJSON') {
      getSlingTracerJSON(message.requestId, callback);
      return true;
    } else if (message.action === 'updateURLFilter') {
      // sync the urlFilter from AEMPanel to background.js
      urlFilter = (message.urlFilter || '').trim();
    } else if (message.action === 'isAEMReadyForLogTracer') {
      isAEMReadyForLogTracer(callback);
      return true;
    } else if(message.action === "af-editor-loaded"){
        sendToDevTools(message);
    }
  }
);

/**
 * Make XHR to determine if the Sling Log Tracer is accepting requests.
 **/
function isAEMReadyForLogTracer(callback) {
    var SLING_TRACER_URL = '/system/console/tracer';

     getWithAuthenticatedAjax(SLING_TRACER_URL, function(data) {
        // Return true on success
        tracer.currentTabIsTraceable = data !== null;
        console.log('Current tab is found to traceable: ' + tracer.currentTabIsTraceable);
        if (tracer.currentTabIsTraceable) {
            tracer.lastGoodTabOrigin = tracer.lastTestedTabOrigin;
        }
        callback(tracer.currentTabIsTraceable);
     });
}

/**
 * Make XHR request to Sling Tracer endpoint to collect JSON data.
 **/
function getSlingTracerJSON(requestId, callback) {
    console.log('Requesting Sling Tracer information for Sling Tracer Id: ' + requestId);
  
    // Servlet context can be supported by adding to the options.host configuration
    getWithAuthenticatedAjax('/system/console/tracer/' + requestId + '.json', function(data) {
        // Return true on success
        callback(data);
    });
}

function getWithAuthenticatedAjax(url, callback) {
  getOptions(function (options) {
      var uri;
      
      if (!options || options == null) { 
          console.log('Could not derive options for the active tab (more likely there is no active tab)');
          callback(null); 
          return;
      }
      
      uri = options.url(url);

      $.ajax({
          url: uri,
          method: 'GET',
          beforeSend: function(xhr) {
              xhr.setRequestHeader("Authorization", "Basic " + btoa(options.user + ":" + options.password));
          }
      }).always(function(data, status) {
          if (callback) {
              console.log('AJAX Request made to: ' + uri + ' -> ' + status);
              
              if (status !== 'success') {
                  data = null;
              } else {
                  data = data || 'success';
              }

              callback(data);
          }
      });
  });
}

function getOptions(callback) {
    var tabOrigin = tracer.lastGoodTabOrigin;//'http://localhost:4502';

    // Get the origin of the active window
    if (chrome && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({'active': true, 'lastFocusedWindow': true, 'currentWindow': true}, function (tabs) {
            var url;

            if (tabs && tabs.length === 1) {
                url = new URL(tabs[0].url);
                tabOrigin = url.origin;
                console.log('Tab Origin derived from active tab: ' + tabOrigin);

                tracer.lastTestedTabOrigin = tabOrigin;
                $.each(getHttpParams(tabOrigin), function (index, httpParam) {
                    callback(httpParam);
                });
            } else {
                console.log('No active tabs found. Could not derive actual Tab Origin defaulting to last known tab origin: ' + tabOrigin);
                $.each(getHttpParams(tabOrigin), function (index, httpParam) {
                    callback(httpParam);
                });
            }
        });
    } else {
        console.log('Chrome Tabs object could not be found. It is likely this dev panel lost associated with any tab. Please close AEM Chrome Plug-in and open it docked to a Chrome Tab. Defaulting to last known tab origin: ' + tabOrigin);
        $.each(getHttpParams(tabOrigin), function (index, httpParam) {
            callback(httpParam);
        });
    }
}

function getHttpParams(tabOrigin) {
    var params = [],
        options = JSON.parse(localStorage.getItem('aem-chrome-plugin.options'));

    tabOrigin = stripTrailingSlash(tabOrigin);

    console.log('Deriving proper AEM end-points to retrieve Sling Tracer Data from based on Tab Origin: ' + tabOrigin);

    // Prevents errors in timing corner cases    
    options.tabHostOptions = options.tabHostOptions || [];
    $.each(options.tabHostOptions, function(index, tabHostOption) {
        // Check if the tab's origin matches a tab host option configuration
        if (tabOrigin === stripTrailingSlash(tabHostOption.tabHost) && params.length === 0) {
            // Tab host option configuration is found
            tabHostOption.tracerHosts = tabHostOption.tracerHosts || [];            
            $.each(tabHostOption.tracerHosts, function(index, tracerHost) {
                params.push(getParam(tracerHost.origin, tabHostOption.servletContext, tabHostOption.user, tabHostOption.password));
            });
        }
    });

    if (params.length === 0) {
        params.push(getParam(tabOrigin, options.servletContext, options.user, options.password));
    } 

    return params;
}

function stripTrailingSlash(str) {
    if (!str) {
        str = '';
    } else if (str.indexOf("/") === str.length - 1) {
        str.splice(str.length - 1, 1);
    }
    return str;
}

function getParam(origin, servletContext, user, password) {
    return {
        host: origin + (servletContext || ''),
        user: user,
        password: password,
        url: function(url) {
            return origin + (servletContext || '') + url;
        }
    };
}

/**
 * This method injects the Sling Log Tracer headers into browser requests indicating how they must be traced.
 **/
var injectHeaderListener = function (details) {
  var options;

  if (!tracer.currentTabIsTraceable) {
      // Current tab does not have a backing Sling Log Tracer endpoint so dont bother with this request.
      return;
  } else if (details.url && details.url.indexOf('/system/console/tracer') !== -1){
      // Making call to Sling Log Tracer to get logs messages; don't inject on these requests.
      return;
  } else if (urlFilter.length > 0 && details.url.search(urlFilter) === -1) {
      // URL does not match the AEM Panel urlFilter; Do not add headers.
      return;
  }

  console.log('Adding Sling-Tracer headers for: ' + details.url);

  options = JSON.parse(localStorage.getItem('aem-chrome-plugin.options'));

  if (tracer.shouldInjectHeaders(details.tabId)) {
    details.requestHeaders.push({
      name: 'Sling-Tracer-Record',
      value: 'true'
    });

    var callerEnabled = options.callerEnabled;
    var tracerSets = [];
    $.each(options.providedTracerSets, function(index, value) {
        var tracerSetConfig;
        console.log(value);
      if (value.enabled && value.package) {
          tracerSetConfig = value.package;
          tracerSetConfig = tracerSetConfig + ';level=' + value.level || 'DEBUG';
          if ((callerEnabled && value.caller === '') || value.caller === 'true') {
            tracerSetConfig = tracerSetConfig + ';caller=true';
          }
          tracerSets.push(tracerSetConfig);
      }
    });
      
    $.each(options.tracerSets, function(index, value) {
        var tracerSetConfig;
        console.log(value);
        
      if (value.enabled && value.package) {
          tracerSetConfig = value.package;
          tracerSetConfig = tracerSetConfig + ';level=' + value.level || 'DEBUG';
          if ((callerEnabled && value.caller === '') || value.caller === 'true') {
            tracerSetConfig = tracerSetConfig + ';caller=true';
          }
          tracerSets.push(tracerSetConfig);
      }
    });

    if (tracerSets && tracerSets.length > 0) {
      details.requestHeaders.push({
        name: 'Sling-Tracer-Config',
        value: tracerSets.join(',')
      });
    } else {
        details.requestHeaders.push({
            name: 'Sling-Tracer-Config',
            value: 'sling-tracer-configs-undefined'
        });
    }
  }

  return { requestHeaders: details.requestHeaders };
};

/**
 * Activate/Deactivate Sling-Tracer injection listeners
 **/
tracer.registerListener(/*activate*/ function () {
    chrome.webRequest.onBeforeSendHeaders.addListener(injectHeaderListener,
      {urls: ["<all_urls>"]},
      ['blocking', 'requestHeaders']
    );
    console.log("Registered the Sling Header injecting listener");
  },
  /*deactivate*/ function () {
    chrome.webRequest.onBeforeSendHeaders.removeListener(injectHeaderListener);
    console.log("Removed the Sling Header injecting listener");
  }
);
