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

import { createRequest } from '../shared/requests-service.js';

/**
 * Brokers communication between the Chrome devtools panel and the background service worker.
 * `onTracerData(request, data)` is invoked whenever tracer data arrives for a finished request.
 **/
export function listen(onTracerData) {
    const port = chrome.runtime.connect({ name: 'aem-chrome-plugin' });

    chrome.devtools.network.onRequestFinished.addListener((chromeRequest) => {
        const request = createRequest(chromeRequest);
        if (request && request.key) {
            console.log('Requesting Sling Tracer JSON for: ' + chromeRequest.request.url);
            chrome.runtime.sendMessage(
                {
                    action: 'getSlingTracerJSON',
                    requestId: request.key,
                    tabId: chrome.devtools.inspectedWindow.tabId
                },
                (data) => {
                    if (data) {
                        onTracerData(request, data);
                    } else {
                        console.log('Unable to collect Sling Log Tracer data');
                    }
                }
            );
        }
    });

    // Enable tracer headers for *this* tab.
    port.postMessage({ action: 'register', tabId: chrome.devtools.inspectedWindow.tabId });
}
