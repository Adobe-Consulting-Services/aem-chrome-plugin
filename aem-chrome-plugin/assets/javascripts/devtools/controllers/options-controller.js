angular.module('aem-chrome-plugin-app')
/** Options Controller **/
.controller('OptionsCtrl', ['$scope', function($scope) {
  $scope.options = JSON.parse(localStorage.getItem('aem-chrome-plugin.options'));

  $scope.$watch('options', function(value) {
    localStorage.setItem('aem-chrome-plugin.options', JSON.stringify(value));
	}, true);
}]);
