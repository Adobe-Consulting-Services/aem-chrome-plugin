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
/** Options Controller **/
    .controller('OptionsCtrl', [
        '$scope',
        '$timeout',
        'OptionsService',
        function ($scope,
                  $timeout,
                  options) {

            $scope.options = options.getOptions();
    
            if (!$scope.options.tracerSets || $scope.options.tracerSets.length === 0) {
                $scope.options.tracerSets = [];
            }       

            if (!$scope.options.tabHostOptions || $scope.options.tabHostOptions.length === 0) {
                $scope.options.tabHostOptions = [];
            }          
            
            if (!$scope.options.providedTracerSets || $scope.options.providedTracerSets.length === 0) {
                $scope.options.providedTracerSets = [];
                
               $scope.options.providedTracerSets.push({
                    enabled: true,
                    package: 'org.apache.jackrabbit.oak.query',
                    level: 'DEBUG',
                    caller: ''                   
                });
                $scope.options.providedTracerSets.push({
                    enabled: false,
                    package: 'org.apache.jackrabbit.oak.jcr.operations.writes',
                    level: 'TRACE',
                    caller: ''
                });                   
            }
            
            $scope.$watch('options', function (value) {
                var tmp = options.getOptions();
                
                tmp.user = value.user || '';
                tmp.password = value.password || '';
                tmp.servletContext = value.servletContext || '';
                tmp.tracerSets = value.tracerSets || [];
                tmp.providedTracerSets = value.providedTracerSets || [];
                tmp.tabHostOptions = value.tabHostOptions || [];

                options.setOptions(tmp);
            }, true);      

            $scope.addTabHostOptionTracerHost = function(tabHostOption) {
                if (!Array.isArray(tabHostOption.tracerHosts)) {
                    tabHostOption.tracerHosts = [];
                }
            
                tabHostOption.tracerHosts.push({origin: ''});
            };
        }]);