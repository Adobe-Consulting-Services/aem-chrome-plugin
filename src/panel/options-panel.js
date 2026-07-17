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

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
}

/**
 * The "mini options" panel embedded in panel.html: caller-enabled toggle + the
 * provided/ad-hoc Tracer Set lists. Mirrors the old embedded OptionsCtrl instance -
 * a second, independent instance lives in options.html (src/options/options.js),
 * reconciled only through chrome.storage, exactly like the two separate $scope
 * copies the Angular version kept.
 **/

let onTracerSetRemoved = null;

export function setOnTracerSetRemoved(fn) {
    onTracerSetRemoved = fn;
}

function levelOptionsHtml(selected) {
    return ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR']
        .map((level) => `<option value="${level}"${level === selected ? ' selected' : ''}>${level}</option>`)
        .join('');
}

function callerOptionsHtml(selected) {
    const options = [
        { value: '', label: 'Inherit' },
        { value: 'true', label: 'Include caller' },
        { value: 'false', label: 'Exclude caller' }
    ];
    return options
        .map((o) => `<option value="${o.value}"${o.value === (selected || '') ? ' selected' : ''}>${o.label}</option>`)
        .join('');
}

function renderProvidedTracerSets() {
    const container = document.getElementById('provided-tracer-sets');
    if (!container) {
        return;
    }
    const options = getOptions();

    container.innerHTML = (options.providedTracerSets || [])
        .map((tracerSet, index) => `
            <div class="tracer-set" data-index="${index}">
                <span class="tracer-set--enabled--wrapper">
                    <input class="tracer-set--enabled" type="checkbox" ${tracerSet.enabled ? 'checked' : ''}/>
                </span>
                <input class="tracer-set--package" type="text" value="${escapeHtml(tracerSet.package)}" readonly/>
                <select class="tracer-set--level">${levelOptionsHtml(tracerSet.level)}</select>
                <select class="tracer-set--caller">${callerOptionsHtml(tracerSet.caller)}</select>
            </div>
        `)
        .join('');
}

function renderAdHocTracerSets() {
    const container = document.getElementById('adhoc-tracer-sets');
    if (!container) {
        return;
    }
    const options = getOptions();

    container.innerHTML = (options.tracerSets || [])
        .map((tracerSet, index) => `
            <div class="tracer-set" data-index="${index}">
                <span class="tracer-set--enabled--wrapper">
                    <input class="tracer-set--enabled" type="checkbox" ${tracerSet.enabled ? 'checked' : ''}/>
                </span>
                <input class="tracer-set--package" type="text" value="${escapeHtml(tracerSet.package)}" placeholder="Package"/>
                <select class="tracer-set--level">${levelOptionsHtml(tracerSet.level)}</select>
                <select class="tracer-set--caller">${callerOptionsHtml(tracerSet.caller)}</select>
                <button class="tracer-set--remove">Remove</button>
            </div>
        `)
        .join('');
}

export function render() {
    renderProvidedTracerSets();
    renderAdHocTracerSets();
}

async function persist(options) {
    await setOptions(options);
}

function bindProvidedTracerSetEvents() {
    const container = document.getElementById('provided-tracer-sets');
    container.addEventListener('change', (e) => {
        const row = e.target.closest('.tracer-set');
        if (!row) {
            return;
        }
        const index = Number(row.dataset.index);
        const options = getOptions();
        const tracerSet = options.providedTracerSets[index];

        if (e.target.classList.contains('tracer-set--enabled')) {
            tracerSet.enabled = e.target.checked;
        } else if (e.target.classList.contains('tracer-set--level')) {
            tracerSet.level = e.target.value;
        } else if (e.target.classList.contains('tracer-set--caller')) {
            tracerSet.caller = e.target.value;
        }
        persist(options);
    });
}

function bindAdHocTracerSetEvents() {
    const container = document.getElementById('adhoc-tracer-sets');

    container.addEventListener('change', (e) => {
        const row = e.target.closest('.tracer-set');
        if (!row) {
            return;
        }
        const index = Number(row.dataset.index);
        const options = getOptions();
        const tracerSet = options.tracerSets[index];

        if (e.target.classList.contains('tracer-set--enabled')) {
            tracerSet.enabled = e.target.checked;
        } else if (e.target.classList.contains('tracer-set--package')) {
            tracerSet.package = e.target.value;
        } else if (e.target.classList.contains('tracer-set--level')) {
            tracerSet.level = e.target.value;
        } else if (e.target.classList.contains('tracer-set--caller')) {
            tracerSet.caller = e.target.value;
        }
        persist(options);
    });

    container.addEventListener('click', (e) => {
        if (!e.target.classList.contains('tracer-set--remove')) {
            return;
        }
        const row = e.target.closest('.tracer-set');
        const index = Number(row.dataset.index);
        const options = getOptions();
        const [removed] = options.tracerSets.splice(index, 1);
        persist(options);
        renderAdHocTracerSets();

        if (removed && onTracerSetRemoved) {
            onTracerSetRemoved(removed);
        }
    });

    document.querySelector('.tracer-set--add').addEventListener('click', () => {
        const options = getOptions();
        options.tracerSets = options.tracerSets || [];
        options.tracerSets.push({ enabled: true, package: '', level: 'DEBUG' });
        persist(options);
        renderAdHocTracerSets();
    });
}

function bindCallerEnabledCheckbox() {
    const checkbox = document.getElementById('caller-enabled--checkbox');
    checkbox.checked = !!getOptions().callerEnabled;

    checkbox.addEventListener('click', () => {
        const options = getOptions();
        options.callerEnabled = !options.callerEnabled;
        persist(options);
    });
}

function bindMiniOptionsToggle() {
    const miniOptions = document.getElementById('mini-options');
    const toggleButton = document.querySelector('.mini-options--button');
    const closeButton = document.querySelector('.mini-options--close');

    toggleButton.addEventListener('click', () => {
        miniOptions.style.display = miniOptions.style.display === 'none' ? '' : 'none';
    });
    closeButton.addEventListener('click', () => {
        miniOptions.style.display = 'none';
    });
    miniOptions.style.display = 'none';
}

export function init() {
    bindMiniOptionsToggle();
    bindCallerEnabledCheckbox();
    bindProvidedTracerSetEvents();
    bindAdHocTracerSetEvents();
    render();
}
