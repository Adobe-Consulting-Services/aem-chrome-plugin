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
    'removeHostFilter',
    'CommunicationsService',
    'TracerStatusService',
    function( $scope,
              $filter,
              $timeout,
              removeHostFilter,
              communications,
              tracerStatus) {

  var MAX_REQUESTS = 25;

  // Data
  $scope.controls = {
    urlFilter: '.html',
    searchFilter: '',
    maxRequests: MAX_REQUESTS
  };

  $scope.activeKey = null;
  $scope.activeRequest = {};
  $scope.activeTracerData  = {};
  $scope.requestKeys = [];
  $scope.requests = {};
  $scope.osgi = {};
  $scope.showMiniOptions = false;

  $scope.$watch('controls.urlFilter', function(value) {
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'updateURLFilter', urlFilter: value }, function(response) {});
    }
	});

  $scope.init = function() {
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'updateURLFilter', urlFilter: $scope.controls.urlFilter }, function(response) {});
      chrome.runtime.sendMessage({ action: 'getTracerConfig' }, function(data) { $scope.osgi = tracerStatus.setStatus(data); $timeout(0); });
    }

    // Start listening for Requests
    communications.listen($scope);
  };

  $scope.requests = function() {
    return $scope.requestKeys.map(function(key) {
      return $scope.requests[key];
    });
  };

  $scope.clear = function() {
    var key;
    while ($scope.requestKeys.length > 0) {
        key = $scope.requestKeys.pop();
        delete $scope.requests[key];
    }
  };

  $scope.setActive = function(requestId) {
    $scope.activeKey = requestId;
    $scope.activeRequest = $scope.activeKey ? $scope.requests[$scope.activeKey] : null;
    $scope.activeTracerData = $scope.activeRequest.tracerData || null;
  };

  $scope.notEmpty = function(col) {
    if (!col) {
      return false;
    } else {
      return col.length > 0;
    }
  };

  $scope.getMaxRequests = function() {
      if (!$scope.controls.maxRequests || $scope.controls.maxRequests < 0) {
        return MAX_REQUESTS;
      } else {
        return $scope.controls.maxRequests;
      }
  };

  $scope.getClass = function(requestId) {
    return (requestId === $scope.activeKey) ? 'selected' : '';
  };

  $scope.processRequest = function(request, data) {
    request.tracerData = data;

    debugger
    request.tracerData.logs = $filter('logBlacklist')(request.tracerData.logs);
    debugger
    request.tracerData.queries = $filter('queryBlacklist')(request.tracerData.queries);

    $scope.requestKeys.push(request.key);
    $scope.requests[request.key] = request;

    $scope.removeRequests($scope.getMaxRequests());

    $timeout(0);
  };

  $scope.removeRequests = function(max) {
    var key;
    while ($scope.requestKeys.length > max) {
        // Remove from front of array
        key = $scope.requestKeys.shift();
        delete $scope.requests[key];
    }
  };

  $scope.reload = function() {
    chrome.devtools.inspectedWindow.reload({
      ignoreCache: true,
    });
  };
}]);
