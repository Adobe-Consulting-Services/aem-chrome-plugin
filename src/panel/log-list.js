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

/* This module 'manually' constructs the HTML for performance reasons; naive re-rendering
 * (e.g. a framework's repeat directive) has trouble managing potentially large log lists. */

function genericTemplate(entry) {
    return {
        html: '<li>' + entry + '</li>',
        haystack: entry.toLowerCase()
    };
}

function requestProgressTemplate(entry) {
    return {
        html: '<li>' + entry.replace(/(^\d+\s[A-Z_]+)/m, '<strong>$1</strong> ') + '</li>',
        haystack: entry.toLowerCase()
    };
}

function queriesTemplate(entry) {
    let html = '';
    let haystack = '';

    if (entry.caller && entry.caller.length > 0) {
        html += '<p><strong>CALLER: ' + entry.caller + '</strong></p>';
        haystack += entry.caller + ' ';
    }

    html += '<p><strong>QUERY:</strong> ' + entry.query + '</p>';
    html += '<p><strong>PLAN:</strong> ' + entry.plan + '</p>';
    haystack += entry.query + ' ' + entry.plan;

    return {
        html: '<li>' + html + '</li>',
        haystack: haystack.toLowerCase()
    };
}

function logsTemplate(entry) {
    const haystack = entry.level + ' ' + entry.logger + ' ' + entry.message;
    let html = '<li class="tracer-log-list--entry">';

    html += '<p><strong>' + entry.level + ' ' + entry.logger + '</strong></p>';
    html += '<p>';

    if (entry.caller && entry.caller.length > 0) {
        html += '<button class="tracer-log-list--entry--caller-button">Show Caller</button> ';
    }

    html += entry.message;
    html += '</p>';

    if (entry.caller && entry.caller.length > 0) {
        html += '<ul class="tracer-log-list--entry--caller">';
        entry.caller.forEach((caller) => {
            html += '<li>' + caller + '</li>';
        });
        html += '</ul>';
    }

    html += '</li>';

    return { html, haystack: haystack.toLowerCase() };
}

function buildEntry(format, entry) {
    if (format === 'logs') {
        return logsTemplate(entry);
    }
    if (format === 'queries') {
        return queriesTemplate(entry);
    }
    if (format === 'requestProgress') {
        return requestProgressTemplate(entry);
    }
    return genericTemplate(entry);
}

function render(container, html) {
    container.innerHTML = html ? '<ul>' + html + '</ul>' : '';
}

/**
 * Creates a filterable log list bound to `container`, rendering entries in `format`.
 * Entries are converted to {html, haystack} once per `setEntries()` call and cached;
 * `setFilter()` re-renders cheaply from that cache without rebuilding entry HTML.
 **/
export function createLogList(container, format) {
    let cache = [];
    let currentFilter = '';

    function renderFromCache() {
        const filter = (currentFilter || '').toLowerCase();
        let html = '';

        cache.forEach((entry) => {
            if (!filter || entry.haystack.indexOf(filter) > -1) {
                html += entry.html;
            }
        });

        render(container, html);
    }

    return {
        setEntries(entries) {
            cache = (entries || [])
                .filter(Boolean)
                .map((entry) => buildEntry(format, entry))
                .filter((built) => built.html);
            renderFromCache();
        },
        setFilter(filterText) {
            currentFilter = filterText;
            renderFromCache();
        }
    };
}
