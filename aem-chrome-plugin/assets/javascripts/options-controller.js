angular.module('aem-panel-app')
/** Controller **/
.controller('OptionsCtrl', ['$scope', function($scope) {
  $scope.options = JSON.parse(localStorage.getItem('aempanel.options'));

  $scope.$watch('options', function(value) {
    console.log(value);
    localStorage.setItem('aempanel.options', JSON.stringify(value));
	}, true);
}]);
