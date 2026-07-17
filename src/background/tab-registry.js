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

import { syncTabRule, removeTabRule, getInstalledRuleIds } from './tracer-rules.js';

const SESSION_KEY = 'aem-chrome-plugin.tabRegistry';

// tabId -> ruleId. Persisted to chrome.storage.session (survives service-worker restarts,
// unlike plain module state) and reconciled against the actually-installed DNR session
// rules on every worker startup, since those rules - not our own bookkeeping - are the
// ground truth for what's really active.
let tabRuleIds = new Map();
let tabUrlFilters = new Map();
let nextRuleId = 1;

async function persist() {
    await chrome.storage.session.set({
        [SESSION_KEY]: {
            tabRuleIds: Array.from(tabRuleIds.entries()),
            nextRuleId
        }
    });
}

export async function restore() {
    const stored = await chrome.storage.session.get(SESSION_KEY);
    const saved = stored[SESSION_KEY];
    const installedRuleIds = await getInstalledRuleIds();

    if (saved) {
        nextRuleId = saved.nextRuleId || 1;
        saved.tabRuleIds.forEach(([tabId, ruleId]) => {
            if (installedRuleIds.has(ruleId)) {
                tabRuleIds.set(tabId, ruleId);
            }
        });
    }
}

export function isRegistered(tabId) {
    return tabRuleIds.has(tabId);
}

export function getRegisteredTabIds() {
    return Array.from(tabRuleIds.keys());
}

export async function registerTab(tabId, options) {
    let ruleId = tabRuleIds.get(tabId);
    if (!ruleId) {
        ruleId = nextRuleId++;
        tabRuleIds.set(tabId, ruleId);
    }
    await syncTabRule(tabId, ruleId, tabUrlFilters.get(tabId), options);
    await persist();
    console.log('Registered tab ' + tabId);
}

export async function unregisterTab(tabId) {
    const ruleId = tabRuleIds.get(tabId);
    if (ruleId) {
        await removeTabRule(ruleId);
        tabRuleIds.delete(tabId);
        await persist();
        console.log('Unregistered tab ' + tabId);
    }
}

export function setUrlFilter(tabId, urlFilter) {
    tabUrlFilters.set(tabId, urlFilter);
}

export async function resyncAllRules(options) {
    for (const [tabId, ruleId] of tabRuleIds.entries()) {
        await syncTabRule(tabId, ruleId, tabUrlFilters.get(tabId), options);
    }
}
