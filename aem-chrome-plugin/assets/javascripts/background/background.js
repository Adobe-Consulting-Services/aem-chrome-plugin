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
    var tabCount = 0;
    var listenerRegistered = false;
    var tabs = {};
    var api ={};
    var activationCallback;
    var deactivationCallback;

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
          tracerIds: 'oak-query,oak-writes',
          tracerSets: [],
          host: 'http://localhost:4502',
          maxHistory: 200
      })
  );
}

// an array of all the connections
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
      getSlingTracerJSON(message, sender, callback);
      return true;
    } else if (message.action === 'updateURLFilter') {
      // sync the urlFilter from AEMPanel to background.js
      urlFilter = (message.urlFilter || '').trim();
    } else if (message.action === 'getTracerConfig') {
      getTracerConfig(callback);
      return true;
    } else if(message.action === "af-editor-loaded"){
        sendToDevTools(message);
    }
  });

function getOptions() {
  var options = JSON.parse(localStorage.getItem('aem-chrome-plugin.options'));
  return {
    host: options.host,
    user: options.user,
    password: options.password,
    url: function(url) {
        return options.host + url;
    }
  };
}

function getWithAuth(url, callback) {
  var options = getOptions();

  $.ajax({
    url: options.url(url),
    method: 'GET',
    beforeSend: function(xhr) {
        xhr.setRequestHeader("Authorization", "Basic " + btoa(options.user + ":" + options.password));
      }
    }).always(function(data) {
      if (callback) {
        callback(data);
      }
    });
  }

/**
 * Make XHR request to Sling Tracer endpoint to collect JSON data.
 **/
function getTracerConfig(callback) {
  var BUNDLE_URL = '/system/console/bundles/org.apache.sling.tracer.json',
      CONFIG_URL = '/system/console/configMgr/org.apache.sling.tracer.internal.LogTracer.json',
      options = getOptions(),
      status = { };

  console.log('Requesting Sling Tracer Bundle information @ ' + BUNDLE_URL);

  getWithAuth(BUNDLE_URL, function(d) {
    if (d && d.data && d.data[0]) {
      status.bundleActive = 'Active' === d.data[0].state;
      status.bundleVersion = d.data[0].version || '0.0.0';

      if (status.bundleActive) {
        console.log('Requesting Sling Tracer Config information @ ' + CONFIG_URL);

        getWithAuth(CONFIG_URL, function(d2) {
          var properties;

          if (d2 && d2[0] && d2[0].properties) {
            properties = d2[0].properties;
            status.configEnabled = properties.enabled.value || false;
            status.configServletEnabled = properties.servletEnabled.value || false;
            status.configTracerSets = properties.tracerSets.values || [];
          }

          callback(status);
        });
      } else {
        callback(status);
      }
    } else {
      callback(status);
    }
  });
}



/**
 * Make XHR request to Sling Tracer endpoint to collect JSON data.
 **/
function getSlingTracerJSON(request, sender, callback) {
  var options = getOptions(),
      url = '/system/console/tracer/' + request.requestId + '.json';
      // Servlet context can be supported by adding to the options.host configuration

  console.log('Requesting Sling Tracer information @ ' + url);
  getWithAuth(url, callback);
}

var injectHeaderListener = function (details) {
  var options;

  if (urlFilter.length > 0 && details.url.search(urlFilter) === -1) {
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

    details.requestHeaders.push({
      name: 'Sling-Tracers',
      value: options.tracerIds
    });

    var tracerSets = [];
    $.each(options.tracerSets, function(index, value) {
      if (value.enabled && value.package) {
        tracerSets.push(value.package + ';level=' + value.level || 'DEBUG');
      }
    });

    if (tracerSets) {
      details.requestHeaders.push({
        name: 'Sling-Tracer-Config',
        value: tracerSets.join(',')
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
