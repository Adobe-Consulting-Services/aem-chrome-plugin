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
    'TracerStatusService',
    function($scope,
             $timeout,
             tracerStatus) {

  $scope.options = JSON.parse(localStorage.getItem('aem-chrome-plugin.options')) || {
      user: 'admin',
      password: 'admin',
      tracerIds: 'oak-query,oak-writes',
      tracerSets: [],
      host: 'http://localhost:4502',
      maxHistory: 200
  };

  $scope.osgi = {};

  $scope.$watch('options', function(value) {
    localStorage.setItem('aem-chrome-plugin.options', JSON.stringify(value));
    $timeout(function() { init(); }, 250);
	}, true);

  function init() {
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({
          action: 'getTracerConfig'
        },
        function(data) {
          $timeout(function() {
            $scope.osgi = tracerStatus.setStatus(data);
            $scope.initialized = true;
          }, 250);
        });
    }
  }
}]);
