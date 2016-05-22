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
