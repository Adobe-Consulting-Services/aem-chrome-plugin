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
        function ($scope,
                  $timeout) {

            $scope.options = JSON.parse(localStorage.getItem('aem-chrome-plugin.options')) || {
                user: 'admin',
                password: 'admin',
                servletContext: '',
                tracerSets: [],
                providedTracerSets: [],
                tabHostOptions: []
                /*
                {
                    tabHost: 'http://aem-author.local'
                    servletContext: '/aem',
                    user: 'admin',
                    password: 'admin',
                    tracerHosts: [ { origin: 'http://192.168.0.1' }, { origin: 'http://192.168.0.2' } ]
                }
                */
            };
            
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
                    level: 'DEBUG'                    
                });
                $scope.options.providedTracerSets.push({
                    enabled: false,
                    package: 'org.apache.jackrabbit.oak.jcr.operations.writes',
                    level: 'TRACE'                
                });                   
            }
            
            $scope.$watch('options', function (value) {
                var options = JSON.parse(localStorage.getItem('aem-chrome-plugin.options')) || {};
                
                options.user = value.user || '';
                options.password = value.password || '';
                options.servletContext = value.servletContext || '';
                options.tracerSets = value.tracerSets || [];
                options.providedTracerSets = value.providedTracerSets || [];
                options.tabHostOptions = value.tabHostOptions || [];

                localStorage.setItem('aem-chrome-plugin.options', JSON.stringify(options));
            }, true);      

            $scope.addTabHostOptionTracerHost = function(tabHostOption) {
                if (!Array.isArray(tabHostOption.tracerHosts)) {
                    tabHostOption.tracerHosts = [];
                }
            
                tabHostOption.tracerHosts.push({origin: ''});
            };
        }]);