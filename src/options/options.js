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

import { initOptions, getOptions, setOptions } from '../shared/options-service.js';

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
}

function ensureDefaults() {
    const options = getOptions();

    options.tracerSets = options.tracerSets || [];
    options.tabHostOptions = options.tabHostOptions || [];

    if (!options.providedTracerSets || options.providedTracerSets.length === 0) {
        options.providedTracerSets = [
            { enabled: true, package: 'org.apache.jackrabbit.oak.query', level: 'DEBUG', caller: '' },
            { enabled: false, package: 'org.apache.jackrabbit.oak.jcr.operations.writes', level: 'TRACE', caller: '' }
        ];
    }

    return options;
}

function persist(options) {
    setOptions(options);
}

function renderGlobalFields() {
    const options = getOptions();
    document.getElementById('global-servlet-context').value = options.servletContext || '';
    document.getElementById('global-user').value = options.user || '';
    document.getElementById('global-password').value = options.password || '';
}

function bindGlobalFields() {
    const bind = (id, key) => {
        document.getElementById(id).addEventListener('input', (e) => {
            const options = getOptions();
            options[key] = e.target.value;
            persist(options);
        });
    };
    bind('global-servlet-context', 'servletContext');
    bind('global-user', 'user');
    bind('global-password', 'password');
}

function tracerHostsHtml(tabHostOption) {
    return (tabHostOption.tracerHosts || [])
        .map((tracerHost, index) => `
            <li data-tracer-host-index="${index}">
                <input type="text" class="tracer-host-origin" value="${escapeHtml(tracerHost.origin)}"/>
                <button class="tracer-hosts--remove">Remove</button>
            </li>
        `)
        .join('');
}

function renderHostConfigs() {
    const options = getOptions();
    const container = document.getElementById('host-configs');

    container.innerHTML = (options.tabHostOptions || [])
        .map((tabHostOption, index) => `
            <form class="form-options host-options" data-index="${index}">
                <label class="text">
                    Host name
                    <p>Ex: http://www.example.com, https://author.internal.my-company.com</p>
                    <input type="text" class="host-tab-host" value="${escapeHtml(tabHostOption.tabHost)}"/>
                </label>

                <label class="text">
                    AEM end-points
                    <p>The end-points AEM Chrome Plug-in will check for Sling Log Tracer data.</p>
                    <ul class="tracer-hosts">
                        ${tracerHostsHtml(tabHostOption)}
                        <li class="tracer-hosts--add"><button>Add</button></li>
                    </ul>
                </label>

                <label class="text">
                    Servlet context
                    <input type="text" class="host-servlet-context" value="${escapeHtml(tabHostOption.servletContext)}"/>
                </label>

                <label class="text">
                    Web console user
                    <br/>
                    <input type="text" class="host-user" value="${escapeHtml(tabHostOption.user)}"/>
                </label>
                <label class="text">
                    Web console password
                    <br/>
                    <input type="password" class="host-password" value="${escapeHtml(tabHostOption.password)}"/>
                </label>

                <button class="host-config--remove">Remove this Host Configuration</button>
            </form>
        `)
        .join('');
}

function bindHostConfigs() {
    const container = document.getElementById('host-configs');

    container.addEventListener('input', (e) => {
        const form = e.target.closest('.host-options');
        if (!form) {
            return;
        }
        const options = getOptions();
        const tabHostOption = options.tabHostOptions[Number(form.dataset.index)];

        if (e.target.classList.contains('host-tab-host')) {
            tabHostOption.tabHost = e.target.value;
        } else if (e.target.classList.contains('host-servlet-context')) {
            tabHostOption.servletContext = e.target.value;
        } else if (e.target.classList.contains('host-user')) {
            tabHostOption.user = e.target.value;
        } else if (e.target.classList.contains('host-password')) {
            tabHostOption.password = e.target.value;
        } else if (e.target.classList.contains('tracer-host-origin')) {
            const li = e.target.closest('[data-tracer-host-index]');
            tabHostOption.tracerHosts[Number(li.dataset.tracerHostIndex)].origin = e.target.value;
        }
        persist(options);
    });

    container.addEventListener('click', (e) => {
        const form = e.target.closest('.host-options');
        if (!form) {
            return;
        }
        const options = getOptions();
        const index = Number(form.dataset.index);
        const tabHostOption = options.tabHostOptions[index];

        if (e.target.classList.contains('host-config--remove')) {
            e.preventDefault();
            options.tabHostOptions.splice(index, 1);
            persist(options);
            renderHostConfigs();
        } else if (e.target.classList.contains('tracer-hosts--remove')) {
            e.preventDefault();
            const li = e.target.closest('[data-tracer-host-index]');
            tabHostOption.tracerHosts.splice(Number(li.dataset.tracerHostIndex), 1);
            persist(options);
            renderHostConfigs();
        } else if (form.querySelector('.tracer-hosts--add button') === e.target) {
            e.preventDefault();
            tabHostOption.tracerHosts = tabHostOption.tracerHosts || [];
            tabHostOption.tracerHosts.push({ origin: '' });
            persist(options);
            renderHostConfigs();
        }
    });

    document.getElementById('add-host-configuration').addEventListener('click', (e) => {
        e.preventDefault();
        const options = getOptions();
        options.tabHostOptions = options.tabHostOptions || [];
        options.tabHostOptions.push({ tracerHosts: [], user: 'admin', password: 'admin' });
        persist(options);
        renderHostConfigs();
    });
}

async function bootstrap() {
    await initOptions();
    ensureDefaults();

    renderGlobalFields();
    bindGlobalFields();
    renderHostConfigs();
    bindHostConfigs();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}
