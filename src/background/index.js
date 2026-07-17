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

import { initOptions, getOptions, onOptionsChanged } from '../shared/options-service.js';
import { isAEMReadyForLogTracer, getSlingTracerJSON, enableSlingTracer } from './aem-client.js';
import * as tabRegistry from './tab-registry.js';

// Listeners must be registered synchronously at the top level so Chrome can wake this
// service worker for the right event; the async init work below is only awaited from
// inside the listener bodies, never used to gate registering the listeners themselves.
const optionsReady = initOptions();
const tabRegistryReady = optionsReady.then(() => tabRegistry.restore());

const ports = [];

chrome.runtime.onConnect.addListener((port) => {
    console.assert(port.name === 'aem-chrome-plugin');
    ports.push(port);
    let tabId;

    port.onMessage.addListener((msg) => {
        if (msg.action === 'register') {
            tabId = msg.tabId;
            tabRegistryReady.then(() => tabRegistry.registerTab(tabId, getOptions()));
        }
    });

    port.onDisconnect.addListener(() => {
        if (typeof tabId !== 'undefined') {
            tabRegistryReady.then(() => tabRegistry.unregisterTab(tabId));
        }
        const index = ports.indexOf(port);
        if (index > -1) {
            ports.splice(index, 1);
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getSlingTracerJSON') {
        optionsReady.then(() => getSlingTracerJSON(message.requestId, message.tabId, getOptions())).then(sendResponse);
        return true;
    }

    if (message.action === 'updateURLFilter') {
        // Keyed per-tab (unlike the legacy single global urlFilter var) so multiple open
        // devtools panels on different tabs don't stomp on each other's filter.
        tabRegistryReady.then(() => {
            tabRegistry.setUrlFilter(message.tabId, (message.urlFilter || '').trim());
            if (tabRegistry.isRegistered(message.tabId)) {
                return tabRegistry.registerTab(message.tabId, getOptions());
            }
        });
        return false;
    }

    if (message.action === 'isAEMReadyForLogTracer') {
        optionsReady.then(() => isAEMReadyForLogTracer(message.tabId, getOptions())).then(sendResponse);
        return true;
    }

    if (message.action === 'enableSlingTracer') {
        optionsReady.then(() => enableSlingTracer(message.tabId, getOptions())).then(sendResponse);
        return true;
    }

    return false;
});

onOptionsChanged((options) => {
    tabRegistryReady.then(() => tabRegistry.resyncAllRules(options));
});
