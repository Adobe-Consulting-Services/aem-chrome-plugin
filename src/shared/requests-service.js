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

export function createRequest(chromeRequest) {
    const header = chromeRequest.response.headers.find(
        (h) => h.name.toLowerCase() === 'sling-tracer-request-id' && h.value
    );
    const requestId = header ? header.value : null;

    if (!requestId) {
        return null;
    }

    const request = chromeRequest;
    request.key = requestId;
    request.tracerData = {
        time: 0,
        timestamp: 0,
        chromeRequestProgress: [],
        logs: [],
        queries: [],
        loggerNames: []
    };
    return request;
}
