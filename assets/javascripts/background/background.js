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
        deactivationCallback;

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
    var tabId;

    console.assert(port.name == "aem-chrome-plugin");
    ports.push(port);
    
    port.onMessage.addListener(function(msg) {
        var action = msg.action;
        if (action === "register"){
            tabId = msg.tabId;
            tracer.registerTab(tabId);
        }
    });

    port.onDisconnect.addListener(function(msg){
        var index;
        if (typeof tabId !== 'undefined') {
            tracer.unregisterTab(tabId);
            //remove the port when the devtools panel is disconnected.
            index = ports.indexOf(port);
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
 * Listen for messages from the devtools panel.
 **/
chrome.runtime.onMessage.addListener(
  function(message, sender, callback) {
    if (message.action === 'getSlingTracerJSON') {
      getSlingTracerJSON(message.requestId, message.tabId, callback);
      return true;
    } else if (message.action === 'updateURLFilter') {
      // sync the urlFilter from AEMPanel to background.js
      urlFilter = (message.urlFilter || '').trim();
    } else if (message.action === 'isAEMReadyForLogTracer') {
      isAEMReadyForLogTracer(message.tabId, callback);
      return true;
    } else if (message.action === "af-editor-loaded"){
        sendToDevTools(message);
    }
  }
);

/**
 * Make XHR to determine if the Sling Log Tracer is accepting requests.
 **/
function isAEMReadyForLogTracer(tabId, callback) {
    getWithAuthenticatedAjax(tabId, '/system/console/tracer', function(data) {
        // Return true on success
        callback(data !== null);
    });
}

/**
 * Make XHR request to Sling Tracer endpoint to collect JSON data.
 **/
function getSlingTracerJSON(requestId, tabId, callback) {
    console.log('Requesting Sling Tracer information for Sling Tracer Id: ' + requestId);
  
    // Servlet context can be supported by adding to the options.host configuration
    getWithAuthenticatedAjax(tabId, '/system/console/tracer/' + requestId + '.json', function(data) {
        // Return true on success
        callback(data);
    });
}

function getWithAuthenticatedAjax(tabId, url, callback) {
  getOptions(tabId, function (options) {
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
              if (options.user && options.password) {
                  xhr.setRequestHeader("Authorization", "Basic " + btoa(options.user + ":" + options.password));
              }
          }
      }).always(function(data, status) {
          if (callback) {
              console.log('AJAX Request made to [ ' + uri + ' ]  -> [ ' + status + ' ]');
              
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

function getOptions(tabId, callback) {
    // Get the origin of the active window
    chrome.tabs.get(tabId, function (tab) {        
        if (tab) {
            var url = new URL(tab.url);
            $.each(getHttpParams(url.origin), function (index, httpParam) {
                callback(httpParam);
            });
        } else {
            console.log('Unable to find tab associated with tabId ' + tabId);
            callback(null);
        }
    });
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

  if (details.url && details.url.indexOf('/system/console/tracer') !== -1){
      // Making call to Sling Log Tracer to get logs messages; don't inject on these requests.
      // However, remove all Cookies so the basic auth can be sent

      for (var i = 0; i < details.requestHeaders.length; ++i) {
          if (details.requestHeaders[i].name === 'Cookie') {
              details.requestHeaders.splice(i, 1);
              break;
          }
      }
      return {requestHeaders: details.requestHeaders};
  } else if (urlFilter.length > 0 && details.url.search(urlFilter) === -1) {
      // URL does not match the AEM Panel urlFilter; Do not add headers.
      return;
  }

  console.log('Adding Sling-Tracer headers for: ' + details.url);

  if (tracer.shouldInjectHeaders(details.tabId)) {
    options = JSON.parse(localStorage.getItem('aem-chrome-plugin.options'));
      
    details.requestHeaders.push({
      name: 'Sling-Tracer-Record',
      value: 'true'
    });

    var callerEnabled = options.callerEnabled;
    var tracerSets = [];

    $.each(options.providedTracerSets, function(index, value) {
        var tracerSetConfig;

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
