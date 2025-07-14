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
var PLUGIN_HEADER = "From-AEM-Chrome-Plugin";
var tracer = (function(global) {
  var tabCount = 0,
    listenerRegistered = false,
    tabs = {},
    api = {},
    activationCallback,
    deactivationCallback;

  api.registerTab = function(tabId) {
    console.assert(typeof tabId !== 'undefined');
    tabs[tabId] = true;
    tabCount++;
    tabCountChanged();
    console.log("Registered tab " + tabId);
  };

  api.unregisterTab = function(tabId) {
    delete tabs[tabId];
    tabCount--;
    tabCountChanged();
    console.log("Unregisterd " + tabId);
  };

  api.shouldInjectHeaders = function(tabId) {
    return tabs.hasOwnProperty(tabId);
  };

  api.registerListener = function(activate, deactivate) {
    activationCallback = activate;
    deactivationCallback = deactivate;
  };

  var tabCountChanged = function() {
    if (tabCount <= 0 && typeof deactivationCallback !== 'undefined' && listenerRegistered) {
      deactivationCallback();
      listenerRegistered = false;
    } else if (tabCount > 0 && typeof activationCallback !== 'undefined' && !listenerRegistered) {
      activationCallback();
      listenerRegistered = true;
    }
  };

  return api;
}(this));

/**
 * Options Initialization
 * Initialize the chrome storage AEM Panel options if they do not already exist.
 */
function initializeOptions() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('aem-chrome-plugin.options', function(data) {
      if (!data['aem-chrome-plugin.options']) {
        const defaultOptions = {
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
        };

        chrome.storage.local.set({'aem-chrome-plugin.options': defaultOptions}, function() {
          resolve(defaultOptions);
        });
      } else {
        resolve(data['aem-chrome-plugin.options']);
      }
    });
  });
}

// Initialize options asynchronously
initializeOptions().then(options => {
  console.log('Options initialized:', options);
});

// An array of all the connections
var ports = [];
chrome.runtime.onConnect.addListener(function(port) {
  var tabId;

  console.assert(port.name == "aem-chrome-plugin");
  ports.push(port);

  port.onMessage.addListener(function(msg) {
    var action = msg.action;
    if (action === "register") {
      tabId = msg.tabId;
      tracer.registerTab(tabId);
    }
  });

  port.onDisconnect.addListener(function() {
    if (typeof tabId !== 'undefined') {
      tracer.unregisterTab(tabId);
      // remove the port when the devtools panel is disconnected.
      const index = ports.indexOf(port);
      ports.splice(index, 1);
    }
  });
});

/**
 * This function sends the message to all the devtools panel connected to the background page
 */
function sendToDevTools(msg) {
  ports.forEach(function(port) {
    port.postMessage(msg);
  });
}

/**
 * Listen for messages from the devtools panel.
 */
chrome.runtime.onMessage.addListener(function(message, sender, callback) {
  if (message.action === 'getSlingTracerJSON') {
    getSlingTracerJSON(message.requestId, message.tabId, callback);
    return true;
  } else if (message.action === 'updateURLFilter') {
    // sync the urlFilter from AEMPanel to background.js
    urlFilter = (message.urlFilter || '').trim();
  } else if (message.action === 'isAEMReadyForLogTracer') {
    isAEMReadyForLogTracer(message.tabId, callback);
    return true;
  } else if (message.action === 'enableSlingTracer') {
    enableSlingTracer(message.tabId, callback);
    return true;
  } else if (message.action === "af-editor-loaded") {
    sendToDevTools(message);
  }
});

/**
 * Make XHR to determine if the Sling Log Tracer is accepting requests.
 */
function isAEMReadyForLogTracer(tabId, callback) {
  requestWithAuthenticatedAjax(tabId, 'GET', '/system/console/tracer', function(data) {
    callback(data !== null);
  }, {});
}

/**
 * Make XHR request to Sling Tracer endpoint to collect JSON data.
 */
function getSlingTracerJSON(requestId, tabId, callback) {
  console.log('Requesting Sling Tracer information for Sling Tracer Id: ' + requestId);

  requestWithAuthenticatedAjax(tabId, 'GET', '/system/console/tracer/' + requestId + '.json', function(data) {
    callback(data);
  }, {});
}

function enableSlingTracer(tabId, callback) {
  console.log('Enabling Sling Tracer on AEM');

  requestWithAuthenticatedAjax(tabId, 'GET', '/libs/granite/csrf/token.json', function(csrfData) {
    var params = {
      apply: true,
      action: 'ajaxConfigManager',
      propertylist: "enabled,servletEnabled",
      '$location': '',
      enabled: true,
      servletEnabled: true,
      ':cq_csrf_token': csrfData.token
    };

    requestWithAuthenticatedAjax(tabId, 'POST', '/system/console/configMgr/org.apache.sling.tracer.internal.LogTracer', function(data) {
      callback(false);
    }, params);
  }, {});
}

function requestWithAuthenticatedAjax(tabId, method, url, callback, params) {
  chrome.storage.local.get('aem-chrome-plugin.options', function(data) {
    debugger;
    const options = data['aem-chrome-plugin.options'];
    var uri;

    if (!options || options == null) {
      console.log('Could not derive options for the active tab (more likely there is no active tab)');
      callback(null);
      return;
    }

    uri = options.url ? options.url(url): url;

    $.ajax({
      url: uri,
      method: method,
      data: params,
      beforeSend: function(xhr) {
        if (options.user && options.password) {
          xhr.setRequestHeader(PLUGIN_HEADER, true);
          xhr.setRequestHeader("Authorization", "Basic " + btoa(options.user + ":" + options.password));
        }
      }
    }).always(function(data, status) {
      if (callback) {
        console.log(method + ' AJAX Request made to [ ' + uri + ' ]  -> [ ' + status + ' ]');

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
  chrome.tabs.get(tabId, function(tab) {
    if (tab) {
      var url = new URL(tab.url);
      $.each(getHttpParams(url.origin), function(index, httpParam) {
        callback(httpParam);
      });
    } else {
      console.log('Unable to find tab associated with tabId ' + tabId);
      callback(null);
    }
  });
}

function getHttpParams(tabOrigin) {
  var params = [];

  chrome.storage.local.get('aem-chrome-plugin.options', function(data) {
    const options = data['aem-chrome-plugin.options'];
    tabOrigin = stripTrailingSlash(tabOrigin);

    console.log('Deriving proper AEM end-points to retrieve Sling Tracer Data from based on Tab Origin: ' + tabOrigin);

    options.tabHostOptions = options.tabHostOptions || [];

    $.each(options.tabHostOptions, function(index, tabHostOption) {
      if (tabOrigin === stripTrailingSlash(tabHostOption.tabHost) && params.length === 0) {
        tabHostOption.tracerHosts = tabHostOption.tracerHosts || [];
        $.each(tabHostOption.tracerHosts, function(index, tracerHost) {
          params.push(getParam(tracerHost.origin, tabHostOption.servletContext, tabHostOption.user, tabHostOption.password));
        });
      }
    });

    if (params.length === 0) {
      params.push(getParam(tabOrigin, options.servletContext, options.user, options.password));
    }
  });

  return params;
}

function stripTrailingSlash(str) {
  if (!str) {
    str = '';
  } else if (str.indexOf("/") === str.length - 1) {
    str = str.slice(0, -1);
  }
  return str;
}

function getParam(origin, servletContext, user, password) {
  return {
    origin: origin,
    servletContext: servletContext,
    user: user,
    password: password
  };
}
