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

angular.module('aem-chrome-plugin-app')

    .factory('TracerSetService', [function () {

        var isEnabledByOptions = function (optionsTracerSets, loggerName) {
            var enabled = false;

            angular.forEach(optionsTracerSets, function(tracerSet) {
                if (loggerName === tracerSet.package) {
                    enabled = tracerSet.enabled;
                }
            });

            return enabled;
        };

        return {
            convert: function(loggerNames) {
                var convertedLoggerNames = [],
                    loggerNames = loggerNames || [];
                angular.forEach(loggerNames, function (loggerName) {
                    convertedLoggerNames.push({
                        enabled: false,
                        package: loggerName,
                        level: 'DEBUG',
                        getInitialEnabled:  function(optionsTracerSets, loggerName) {
                            var enabled = false;
                            angular.forEach(optionsTracerSets, function(optionsTracerSet) {
                                if (optionsTracerSet.package === loggerName) {
                                    enabled = optionsTracerSet.enabled;
                                }
                            });
                            return enabled;
                        }
                    });
                });

                return convertedLoggerNames;
            },
            syncOptionsToRequestLoggerNames: function(optionsTracerSets, requestTracerSets) {
                angular.forEach(optionsTracerSets, function(optionsTracerSet) {
                    angular.forEach(requestTracerSets, function(requestTracerSet) {
                        if (optionsTracerSet.package === requestTracerSet.package) {
                            requestTracerSet.enabled = optionsTracerSet.enabled;
                            requestTracerSet.level = optionsTracerSet.level;
                        }
                    });
                });

                return requestTracerSets;
            },
            syncRequestToOptions: function(requestTracerSet, optionsTracerSets) {
                var found = false;
                angular.forEach(optionsTracerSets, function(optionsTracerSet) {
                    if (optionsTracerSet.package === requestTracerSet.package) {
                        optionsTracerSet.enabled = requestTracerSet.enabled;
                        optionsTracerSet.level = requestTracerSet.level;
                        found = true;
                    }
                });

                if (!found) {
                    // Add to options
                    optionsTracerSets.push(requestTracerSet);
                }
            },
            syncOptionRemovalToRequests: function(removedTracerSet, requestTracerSets) {
                angular.forEach(requestTracerSets, function(requestTracerSet) {
                    if (removedTracerSet.package === requestTracerSet.package) {
                        requestTracerSet.enabled = false;
                    }
                });
            }
        };
    }]);
