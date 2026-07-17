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

const PLUGIN_HEADER = 'From-AEM-Chrome-Plugin';

export function stripTrailingSlash(str) {
    if (!str) {
        return '';
    }
    return str.endsWith('/') ? str.slice(0, -1) : str;
}

export function getParam(origin, servletContext, user, password) {
    return {
        host: origin + (servletContext || ''),
        user,
        password,
        url: (url) => origin + (servletContext || '') + url
    };
}

/**
 * Servlet context can be supported by adding to the options.host configuration.
 * Resolves the one-or-more AEM endpoints that should be queried for a given tab origin,
 * based on the global options and any per-host tabHostOptions overrides.
 **/
export function getHttpParams(tabOrigin, options) {
    const params = [];
    tabOrigin = stripTrailingSlash(tabOrigin);
    const tabHostOptions = options.tabHostOptions || [];

    tabHostOptions.forEach((tabHostOption) => {
        if (tabOrigin === stripTrailingSlash(tabHostOption.tabHost) && params.length === 0) {
            (tabHostOption.tracerHosts || []).forEach((tracerHost) => {
                params.push(getParam(tracerHost.origin, tabHostOption.servletContext, tabHostOption.user, tabHostOption.password));
            });
        }
    });

    if (params.length === 0) {
        params.push(getParam(tabOrigin, options.servletContext, options.user, options.password));
    }

    return params;
}

async function getTabOrigin(tabId) {
    const tab = await chrome.tabs.get(tabId);
    if (!tab || !tab.url) {
        return null;
    }
    return new URL(tab.url).origin;
}

/**
 * Fetches issued from the service worker's own extension-page origin never attach the
 * AEM host's cookies (fetch's default credentials mode is same-origin, and the caller's
 * origin here is chrome-extension://<id>, not the AEM host) - so, unlike the legacy
 * webRequest-based approach, there is no need to explicitly strip a Cookie header.
 * Do not add `credentials: 'include'` here, or that guarantee goes away.
 **/
async function fetchWithAuth(uri, user, password, method, body) {
    const headers = {};

    if (user && password) {
        headers[PLUGIN_HEADER] = 'true';
        headers['Authorization'] = 'Basic ' + btoa(user + ':' + password);
    }

    const init = { method, headers };

    if (body) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        init.body = new URLSearchParams(body).toString();
    }

    if (method === 'POST') {
        // Set to some localhost to get around AEM's Referrer filter.
        init.referrer = 'http://localhost:4502';
    }

    let response;
    try {
        response = await fetch(uri, init);
    } catch (err) {
        console.log(method + ' request to [ ' + uri + ' ] failed: ' + err);
        return null;
    }

    console.log(method + ' request made to [ ' + uri + ' ] -> [ ' + response.status + ' ]');

    if (!response.ok) {
        return null;
    }

    const text = await response.text();
    if (!text) {
        return 'success';
    }
    try {
        return JSON.parse(text);
    } catch (err) {
        return text;
    }
}

/**
 * Tries each resolved AEM endpoint for the tab's origin in turn, returning the first
 * successful (non-null) result. (The legacy $.each-based version fired requests to every
 * configured tracerHost but, due to how chrome.runtime.onMessage's sendResponse works,
 * only ever surfaced the first host's response regardless of success - this fixes that.)
 **/
export async function requestWithAuthenticatedFetch(tabId, method, path, body, options) {
    const tabOrigin = await getTabOrigin(tabId);
    if (!tabOrigin) {
        console.log('Could not derive options for the active tab (more likely there is no active tab)');
        return null;
    }

    const httpParams = getHttpParams(tabOrigin, options);

    for (const param of httpParams) {
        const result = await fetchWithAuth(param.url(path), param.user, param.password, method, body);
        if (result !== null) {
            return result;
        }
    }
    return null;
}

export async function isAEMReadyForLogTracer(tabId, options) {
    const data = await requestWithAuthenticatedFetch(tabId, 'GET', '/system/console/tracer', null, options);
    return data !== null;
}

export async function getSlingTracerJSON(requestId, tabId, options) {
    console.log('Requesting Sling Tracer information for Sling Tracer Id: ' + requestId);
    return requestWithAuthenticatedFetch(tabId, 'GET', '/system/console/tracer/' + requestId + '.json', null, options);
}

export async function enableSlingTracer(tabId, options) {
    console.log('Enabling Sling Tracer on AEM');

    const csrfData = await requestWithAuthenticatedFetch(tabId, 'GET', '/libs/granite/csrf/token.json', null, options);
    if (!csrfData) {
        return false;
    }

    const params = {
        apply: true,
        action: 'ajaxConfigManager',
        propertylist: 'enabled,servletEnabled',
        '$location': '',
        enabled: true,
        servletEnabled: true,
        ':cq_csrf_token': csrfData.token
    };

    await requestWithAuthenticatedFetch(tabId, 'POST', '/system/console/configMgr/org.apache.sling.tracer.internal.LogTracer', params, options);
    return false;
}
