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

const STORAGE_KEY = 'aem-chrome-plugin.options';

let cache = null;
const subscribers = [];

function defaultOptions() {
    return {
        user: 'admin',
        password: 'admin',
        servletContext: '',
        tracerSets: [],
        providedTracerSets: [],
        tabHostOptions: [],
        maxHistory: 200
    };
}

/**
 * Loads options into an in-memory cache so the rest of the app can keep reading them
 * synchronously (chrome.storage itself is async). Migrates any pre-MV3 localStorage
 * value on first run so upgrading users don't lose their settings.
 **/
export async function initOptions() {
    const stored = await chrome.storage.local.get(STORAGE_KEY);

    if (stored[STORAGE_KEY]) {
        cache = stored[STORAGE_KEY];
    } else {
        let legacy = null;
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(STORAGE_KEY);
            legacy = raw ? JSON.parse(raw) : null;
        }
        cache = legacy || defaultOptions();
        await chrome.storage.local.set({ [STORAGE_KEY]: cache });
    }

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes[STORAGE_KEY]) {
            cache = changes[STORAGE_KEY].newValue;
            subscribers.forEach((fn) => fn(cache));
        }
    });

    return cache;
}

export function getOptions() {
    return cache || defaultOptions();
}

export async function setOptions(options) {
    cache = options;
    await chrome.storage.local.set({ [STORAGE_KEY]: options });
}

export function onOptionsChanged(fn) {
    subscribers.push(fn);
}
