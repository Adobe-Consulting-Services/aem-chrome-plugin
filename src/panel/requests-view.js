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

import { getOptions, setOptions } from '../shared/options-service.js';
import * as communications from './communications.js';
import * as optionsPanel from './options-panel.js';
import { createLogList } from './log-list.js';
import { download } from '../shared/download-service.js';
import { logBlacklist, queryBlacklist } from '../shared/filters.js';
import * as tracerSet from '../shared/tracer-set-service.js';

const MAX_REQUESTS = 100;

const state = {
    controls: {
        urlFilter: '.html|.json',
        searchFilter: '',
        maxRequests: MAX_REQUESTS
    },
    activeKey: null,
    activeRequest: null,
    activeTracerData: null,
    requestKeys: [],
    requests: {},
    ready: true
};

let logList;
let requestProgressList;
let queriesList;

function getMaxRequests() {
    if (!state.controls.maxRequests || state.controls.maxRequests < 0) {
        return MAX_REQUESTS;
    }
    return state.controls.maxRequests;
}

function removeRequests(max) {
    while (state.requestKeys.length > max) {
        const key = state.requestKeys.shift();
        delete state.requests[key];
    }
}

function debounce(fn, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), wait);
    };
}

/** Request list rendering **/

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
}

function getFilteredRequests() {
    const filter = (state.controls.searchFilter || '').toLowerCase();
    const requests = state.requestKeys.map((key) => state.requests[key]);
    if (!filter) {
        return requests;
    }
    return requests.filter((request) => (request.request.url || '').toLowerCase().indexOf(filter) > -1);
}

function renderRequestsTable() {
    const tbody = document.getElementById('requests-tbody');
    const requests = getFilteredRequests();

    tbody.innerHTML = requests
        .map((request) => `
            <tr data-key="${escapeHtml(request.key)}" class="${request.key === state.activeKey ? 'selected' : ''}">
                <td class="status">${escapeHtml(request.response.status)}</td>
                <td class="url ellipsis">${escapeHtml(request.request.url)}</td>
                <td class="method">${escapeHtml(request.request.method)}</td>
                <td class="numQueries">${escapeHtml((request.tracerData.queries || []).length)}</td>
                <td class="duration">${Math.round(request.time || 0)}ms</td>
            </tr>
        `)
        .join('') + `
            <tr class="filler">
                <td class="status"></td>
                <td class="url"></td>
                <td class="method"></td>
                <td class="numQueries"></td>
                <td class="duration"></td>
            </tr>
        `;

    document.getElementById('request-count').textContent = state.requestKeys.length;
}

/** Active request / details pane rendering **/

function renderActiveRequestInfo() {
    const noActive = document.getElementById('no-active-request-message');
    const activeTitle = document.getElementById('active-request-title');

    if (state.activeRequest) {
        noActive.style.display = 'none';
        activeTitle.style.display = '';
        activeTitle.textContent = state.activeRequest.request.method + ' ' + state.activeRequest.request.url;
    } else {
        noActive.style.display = '';
        activeTitle.style.display = 'none';
    }
}

function renderTabBadges() {
    const data = state.activeTracerData || {};
    const setBadge = (id, entries) => {
        const el = document.getElementById(id);
        if (entries && entries.length) {
            el.style.display = '';
            el.textContent = '(' + entries.length + ')';
        } else {
            el.style.display = 'none';
        }
    };

    setBadge('log-count-badge', data.logs);
    setBadge('request-progress-count-badge', data.requestProgressLogs);
    setBadge('queries-count-badge', data.queries);
    setBadge('logger-names-count-badge', data.loggerNames);

    const loggerNamesTab = document.getElementById('logger-names-tab');
    loggerNamesTab.style.display = (data.loggerNames && data.loggerNames.length > 0) ? '' : 'none';
}

function renderDownloadButtons() {
    const data = state.activeTracerData || {};
    const toggle = (id, entries) => {
        document.getElementById(id).style.display = (entries && entries.length) ? '' : 'none';
    };
    toggle('log-download-button', data.logs);
    toggle('request-progress-download-button', data.requestProgressLogs);
    toggle('queries-download-button', data.queries);
}

function renderLoggerNamesList() {
    const list = document.getElementById('logger-names-list');
    const options = getOptions();
    const loggerNames = (state.activeTracerData && state.activeTracerData.loggerNames) || [];

    tracerSet.syncOptionsToRequestLoggerNames(options.tracerSets, loggerNames);

    list.innerHTML = loggerNames
        .map((loggerName, index) => `
            <li data-index="${index}">
                <input type="checkbox" ${loggerName.enabled ? 'checked' : ''}/>
                <label>${escapeHtml(loggerName.package)}</label>
            </li>
        `)
        .join('');
}

function toggleLoggerName(index) {
    const loggerNames = (state.activeTracerData && state.activeTracerData.loggerNames) || [];
    const requestTracerSet = loggerNames[index];
    if (!requestTracerSet || !requestTracerSet.package) {
        return;
    }

    requestTracerSet.enabled = !requestTracerSet.enabled;
    const options = getOptions();
    options.tracerSets = options.tracerSets || [];
    tracerSet.syncRequestLoggerNamesToOptions(requestTracerSet, options.tracerSets);
    setOptions(options);

    optionsPanel.render();
    renderLoggerNamesList();
}

function renderDetailsPane() {
    const data = state.activeTracerData;
    logList.setEntries(data ? data.logs : []);
    requestProgressList.setEntries(data ? data.requestProgressLogs : []);
    queriesList.setEntries(data ? data.queries : []);

    renderActiveRequestInfo();
    renderTabBadges();
    renderDownloadButtons();
    renderLoggerNamesList();
}

function setActive(key) {
    state.activeKey = key;
    state.activeRequest = key ? state.requests[key] : null;
    state.activeTracerData = state.activeRequest ? state.activeRequest.tracerData : null;

    renderRequestsTable();
    renderDetailsPane();
}

/** Readiness **/

function setReady(ready) {
    state.ready = ready;
    document.getElementById('error-overlay').style.display = ready ? 'none' : '';
}

function checkReadiness(repeat) {
    const SUCCESS_WAIT = 20000;
    const FAILURE_WAIT = 1000;

    if (!chrome || !chrome.runtime) {
        console.log('Not attached to a tab. Please attach Dev Tools to a browser window');
        setReady(false);
        if (repeat) {
            setTimeout(() => checkReadiness(true), FAILURE_WAIT);
        }
        return;
    }

    console.log('Dev Panel is attached to Chrome; Making XHR to check if AEM is ready');
    chrome.runtime.sendMessage(
        { action: 'isAEMReadyForLogTracer', tabId: chrome.devtools.inspectedWindow.tabId },
        (success) => {
            setReady(success);

            if (!success) {
                console.log('Unable to find valid Sling Log Tracer endpoint');
            } else {
                console.log('Success! Found a valid Sling Log Tracer endpoint');
            }

            if (repeat) {
                setTimeout(() => checkReadiness(true), success ? SUCCESS_WAIT : FAILURE_WAIT);
            }
        }
    );
}

function enableSlingTracer() {
    chrome.runtime.sendMessage(
        { action: 'enableSlingTracer', tabId: chrome.devtools.inspectedWindow.tabId },
        () => checkReadiness(false)
    );
}

/** Incoming tracer data **/

function processRequest(request, data) {
    request.tracerData = data;
    request.tracerData.loggerNames = tracerSet.convert(request.tracerData.loggerNames);
    request.tracerData.logs = logBlacklist(request.tracerData.logs);
    request.tracerData.queries = queryBlacklist(request.tracerData.queries);

    state.requestKeys.push(request.key);
    state.requests[request.key] = request;
    removeRequests(getMaxRequests());

    renderRequestsTable();

    const container = document.querySelector('.data-container');
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 10);
}

/** Wiring **/

function bindControls() {
    const urlFilterInput = document.getElementById('url-filter-input');
    urlFilterInput.value = state.controls.urlFilter;
    urlFilterInput.addEventListener('input', () => {
        state.controls.urlFilter = urlFilterInput.value;
        chrome.runtime.sendMessage({
            action: 'updateURLFilter',
            urlFilter: state.controls.urlFilter,
            tabId: chrome.devtools.inspectedWindow.tabId
        });
    });

    const searchFilterInput = document.getElementById('search-filter-input');
    searchFilterInput.addEventListener('input', () => {
        state.controls.searchFilter = searchFilterInput.value;
        renderRequestsTable();
    });

    const maxRequestsInput = document.getElementById('max-requests-input');
    maxRequestsInput.value = state.controls.maxRequests;
    maxRequestsInput.addEventListener('input', () => {
        state.controls.maxRequests = Number(maxRequestsInput.value);
        removeRequests(getMaxRequests());
        renderRequestsTable();
    });

    document.getElementById('clear-button').addEventListener('click', () => {
        while (state.requestKeys.length > 0) {
            const key = state.requestKeys.pop();
            delete state.requests[key];
        }
        setActive(null);
        renderRequestsTable();
    });

    document.getElementById('reload-button').addEventListener('click', () => {
        chrome.devtools.inspectedWindow.reload({ ignoreCache: true });
    });

    document.getElementById('enable-tracer-button').addEventListener('click', enableSlingTracer);
}

function bindRequestsTable() {
    document.getElementById('requests-tbody').addEventListener('click', (e) => {
        const row = e.target.closest('tr[data-key]');
        if (row) {
            setActive(row.dataset.key);
        }
    });
}

function bindLoggerNamesList() {
    document.getElementById('logger-names-list').addEventListener('click', (e) => {
        const item = e.target.closest('li[data-index]');
        if (item && (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL')) {
            toggleLoggerName(Number(item.dataset.index));
        }
    });
}

function bindTabPanels() {
    logList = createLogList(document.getElementById('log'), 'logs');
    requestProgressList = createLogList(document.getElementById('request-progress'), 'requestProgress');
    queriesList = createLogList(document.getElementById('queries'), 'queries');

    const bindFilter = (inputId, list) => {
        document.getElementById(inputId).addEventListener(
            'input',
            debounce((e) => list.setFilter(e.target.value), 500)
        );
    };
    bindFilter('log-filter-input', logList);
    bindFilter('request-progress-filter-input', requestProgressList);
    bindFilter('queries-filter-input', queriesList);

    document.getElementById('log-download-button').addEventListener('click', () => {
        const data = state.activeTracerData;
        download(data.logs, 'logs', activeRequestUrl(), 'text/json');
    });
    document.getElementById('request-progress-download-button').addEventListener('click', () => {
        const data = state.activeTracerData;
        download(data.requestProgressLogs, 'request-progress', activeRequestUrl(), 'text/plain');
    });
    document.getElementById('queries-download-button').addEventListener('click', () => {
        const data = state.activeTracerData;
        download(data.queries, 'queries', activeRequestUrl(), 'text/json');
    });
}

function activeRequestUrl() {
    return state.activeRequest.request.method + ' ' + state.activeRequest.request.url;
}

export function init() {
    bindControls();
    bindRequestsTable();
    bindLoggerNamesList();
    bindTabPanels();

    optionsPanel.init();
    optionsPanel.setOnTracerSetRemoved((removedTracerSet) => {
        const loggerNames = (state.activeTracerData && state.activeTracerData.loggerNames) || [];
        tracerSet.syncOptionRemovalToRequestLoggerNames(removedTracerSet, loggerNames);
        renderLoggerNamesList();
    });

    setActive(null);
    renderRequestsTable();

    chrome.runtime.sendMessage({
        action: 'updateURLFilter',
        urlFilter: state.controls.urlFilter,
        tabId: chrome.devtools.inspectedWindow.tabId
    });

    checkReadiness(true);
    communications.listen(processRequest);
}
