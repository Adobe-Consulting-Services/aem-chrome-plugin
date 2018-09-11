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
/** requests Controller **/
    .controller('RequestsCtrl', [
        '$scope',
        '$filter',
        '$timeout',
        '$interval',
        'removeHostFilter',
        'CommunicationsService',
        'DownloadService',
        'TracerSetService',
        'OptionsService',
        function ($scope,
                  $filter,
                  $timeout,
                  $interval,
                  removeHostFilter,
                  communications,
                  download,
                  tracerSet,
                  options) {

            var MAX_REQUESTS = 100;

            // Data
            $scope.controls = {
                urlFilter: '.html|.json',
                searchFilter: '',
                maxRequests: MAX_REQUESTS
            };

            $scope.activeKey = null;
            $scope.activeRequest = {};
            $scope.activeTracerData = {};
            $scope.requestKeys = [];
            $scope.requests = {};
            $scope.ready = true;
            $scope.showMiniOptions = false;
                             
            
            /** Requests **/            
            
            $scope.$watch('controls.urlFilter', function (value) {
                if (chrome && chrome.runtime) {
                    chrome.runtime.sendMessage({action: 'updateURLFilter', urlFilter: value}, function (response) {
                    });
                }
            });

            $scope.init = function () {
                if (chrome && chrome.runtime) {
                    chrome.runtime.sendMessage({
                        action: 'updateURLFilter',
                        urlFilter: $scope.controls.urlFilter
                    }, function (response) { 
                        // Do nothing
                    });
                    
                    $scope.checkReadiness(true);

                    communications.listen($scope);                    
                }
            };

            $scope.checkReadiness = function(repeat) {
                var SUCCESS_WAIT = 20000,
                    FAILURE_WAIT = 1000,
                    interval;
                
                if (chrome && chrome.runtime) {
                    console.log("Dev Panel is attached to Chrome; Making XHR to check if AEM is ready");
                    chrome.runtime.sendMessage({action: 'isAEMReadyForLogTracer', 
                                                tabId: chrome.devtools.inspectedWindow.tabId}, function (success) {
                        $scope.ready = success;
                        $timeout(0);                            

                        if (!success) {
                            console.log('Unable to find valid Sling Log Tracer endpoint');
                            if (repeat) {
                                $timeout($scope.checkReadiness, FAILURE_WAIT, true, true);
                            }
                        } else {        
                            console.log('Success! Found a valid Sling Log Tracer endpoint');
                            if (repeat) {
                                $timeout($scope.checkReadiness, SUCCESS_WAIT, true, true);
                            }
                        }
                    });
                } else {
                    console.log("Not attached to a tab. Please attach Dev Tools to a browser window");
                    $scope.ready = false;
                    $timeout(0);                            
                    
                    if (repeat) {
                        $timeout($scope.checkReadiness, FAILURE_WAIT, true, true);
                    }
                }     
            };

            $scope.enableSlingTracer = function() {
                chrome.runtime.sendMessage({
                    action: 'enableSlingTracer',
                    tabId: chrome.devtools.inspectedWindow.tabId
                }, $scope.checkReadiness);
            };


            $scope.requests = function () {
                return $scope.requestKeys.map(function (key) {
                    return $scope.requests[key];
                });
            };

            $scope.clear = function () {
                var key;
                while ($scope.requestKeys.length > 0) {
                    key = $scope.requestKeys.pop();
                    delete $scope.requests[key];
                }
            };

            $scope.setActive = function (requestId) {
                $scope.activeKey = requestId;
                $scope.activeRequest = $scope.activeKey ? $scope.requests[$scope.activeKey] : null;
                $scope.activeTracerData = $scope.activeRequest.tracerData || null;
            };

            $scope.notEmpty = function (col) {
                if (!col) {
                    return false;
                } else {
                    return col.length > 0;
                }
            };

            $scope.getMaxRequests = function () {
                if (!$scope.controls.maxRequests || $scope.controls.maxRequests < 0) {
                    return MAX_REQUESTS;
                } else {
                    return $scope.controls.maxRequests;
                }
            };

            $scope.getClass = function (requestId) {
                return (requestId === $scope.activeKey) ? 'selected' : '';
            };

            $scope.processRequest = function (request, data) {
                request.tracerData = data;

                request.tracerData.loggerNames = tracerSet.convert(request.tracerData.loggerNames);
                request.tracerData.logs = $filter('logBlacklist')(request.tracerData.logs);
                request.tracerData.queries = $filter('queryBlacklist')(request.tracerData.queries);

                $scope.requestKeys.push(request.key);
                $scope.requests[request.key] = request;

                $scope.removeRequests($scope.getMaxRequests());

                $timeout(0);
                
                $timeout(function() { 
                    $('.data-container').scrollTop(100000000);
                }, 10);
                //$timeout(0);
            };

            $scope.removeRequests = function (max) {
                var key;
                while ($scope.requestKeys.length > max) {
                    // Remove from front of array
                    key = $scope.requestKeys.shift();
                    delete $scope.requests[key];
                }
            };

            $scope.reload = function () {
                chrome.devtools.inspectedWindow.reload({
                    ignoreCache: true
                });
            };

            $scope.download = function (data, name, type) {
                var url = $scope.activeRequest.request.method 
                            + ' ' + $scope.activeRequest.request.url;
                download.download(data, name, url, type);
            };
            
            $scope.toggleCallerEnabled = function() {
                var tmp = options.getOptions();
                tmp.callerEnabled = !tmp.callerEnabled;
                options.setOptions(tmp);                
            }
            
            $scope.getCallerEnabled = function() {
                var callerEnabled = options.getOptions().callerEnabled;
                return callerEnabled;
            }

            $scope.toggleLoggerName = function(requestTracerSet, optionsTracerSets) {
                if (requestTracerSet && requestTracerSet.package) {
                    requestTracerSet.enabled = !requestTracerSet.enabled;
                    tracerSet.syncRequestLoggerNamesToOptions(requestTracerSet, optionsTracerSets);
                }
            };

            $scope.syncOptionsToRequestLoggerNames = function(optionsTracerSets, requestTracerSets) {
                tracerSet.syncOptionsToRequestLoggerNames(optionsTracerSets, requestTracerSets);
                return requestTracerSets;
            };

            $scope.syncOptionRemovalToRequests = function(removedTracerSet, requestTracerSets) {
                tracerSet.syncOptionRemovalToRequestLoggerNames(removedTracerSet, requestTracerSets);
            };
        }]);