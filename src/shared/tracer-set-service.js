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

export function convert(loggerNames) {
    const names = loggerNames || [];
    return names.map((loggerName) => ({
        enabled: false,
        package: loggerName,
        level: 'DEBUG'
    }));
}

export function syncOptionsToRequestLoggerNames(optionsTracerSets, requestTracerSets) {
    (optionsTracerSets || []).forEach((optionsTracerSet) => {
        (requestTracerSets || []).forEach((requestTracerSet) => {
            if (optionsTracerSet.package === requestTracerSet.package) {
                requestTracerSet.enabled = optionsTracerSet.enabled;
                requestTracerSet.level = optionsTracerSet.level;
            }
        });
    });
}

export function syncRequestLoggerNamesToOptions(requestTracerSet, optionsTracerSets) {
    let found = false;
    (optionsTracerSets || []).forEach((optionsTracerSet) => {
        if (optionsTracerSet.package === requestTracerSet.package) {
            optionsTracerSet.enabled = requestTracerSet.enabled;
            optionsTracerSet.level = requestTracerSet.level;
            found = true;
        }
    });

    if (!found) {
        optionsTracerSets.push({
            enabled: true,
            package: requestTracerSet.package,
            level: 'DEBUG'
        });
    }
}

export function syncOptionRemovalToRequestLoggerNames(removedTracerSet, requestTracerSets) {
    (requestTracerSets || []).forEach((requestTracerSet) => {
        if (removedTracerSet.package === requestTracerSet.package) {
            requestTracerSet.enabled = false;
        }
    });
}
