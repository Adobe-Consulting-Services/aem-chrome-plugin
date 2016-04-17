angular.module('aem-chrome-plugin-app')
/** Options Controller **/
.controller('OptionsCtrl', [
    '$scope',
    '$timeout',
    'TracerStatusService',
    function($scope,
             $timeout,
             tracerStatus) {

  $scope.options = JSON.parse(localStorage.getItem('aem-chrome-plugin.options'));
  $scope.osgi = {};

  $scope.$watch('options', function(value) {
    localStorage.setItem('aem-chrome-plugin.options', JSON.stringify(value));
    $timeout(function() { init(); }, 100);
	}, true);

  function init() {
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({
          action: 'getTracerConfig'
        },
        function(data) {
          $scope.osgi = tracerStatus.setStatus(data);
          $timeout(0);
        });
    }
  };

  init();
}]);
