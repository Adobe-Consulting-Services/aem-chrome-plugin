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

/**
 * Builds the Sling-Tracer-Config header value exactly as the legacy blocking-webRequest
 * listener did: providedTracerSets first, then ad-hoc tracerSets, each rendered as
 * "package;level=X[;caller=true]", falling back to a literal placeholder if nothing is
 * enabled (kept byte-for-byte in case AEM-side tooling depends on this exact string).
 **/
function buildTracerConfigValue(options) {
    const callerEnabled = options.callerEnabled;
    const tracerSets = [];

    const addSets = (sets) => {
        (sets || []).forEach((value) => {
            if (value.enabled && value.package) {
                let config = value.package + ';level=' + (value.level || 'DEBUG');
                if ((callerEnabled && value.caller === '') || value.caller === 'true') {
                    config += ';caller=true';
                }
                tracerSets.push(config);
            }
        });
    };

    addSets(options.providedTracerSets);
    addSets(options.tracerSets);

    return tracerSets.length > 0 ? tracerSets.join(',') : 'sling-tracer-configs-undefined';
}

function buildRule(tabId, ruleId, urlFilter, options, includeUrlCondition) {
    const condition = { tabIds: [tabId] };

    if (includeUrlCondition && urlFilter && urlFilter.trim().length > 0) {
        // DNR's regexFilter uses RE2 syntax, unlike the legacy code's JS `.search(urlFilter)`
        // regex match - translate as directly as possible, falling back to no URL condition
        // (matching every request for this tab) if the pattern is rejected as invalid RE2.
        condition.regexFilter = urlFilter;
        condition.isUrlFilterCaseSensitive = false;
    }

    return {
        id: ruleId,
        priority: 1,
        condition,
        action: {
            type: 'modifyHeaders',
            requestHeaders: [
                { header: 'Sling-Tracer-Record', operation: 'set', value: 'true' },
                { header: 'Sling-Tracer-Config', operation: 'set', value: buildTracerConfigValue(options) }
            ]
        }
    };
}

/**
 * Fully replaces (rather than partially patches) the session rule for a tab - updateSessionRules
 * doesn't support partial edits, and a full resync avoids drift between installed DNR state and
 * what the background *thinks* is installed.
 **/
export async function syncTabRule(tabId, ruleId, urlFilter, options) {
    try {
        await chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [ruleId],
            addRules: [buildRule(tabId, ruleId, urlFilter, options, true)]
        });
    } catch (err) {
        console.warn('Rejected urlFilter "' + urlFilter + '" as a DNR regexFilter; falling back to matching all requests for this tab.', err);
        await chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [ruleId],
            addRules: [buildRule(tabId, ruleId, urlFilter, options, false)]
        });
    }
}

export async function removeTabRule(ruleId) {
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [ruleId] });
}

export async function getInstalledRuleIds() {
    const rules = await chrome.declarativeNetRequest.getSessionRules();
    return new Set(rules.map((rule) => rule.id));
}
