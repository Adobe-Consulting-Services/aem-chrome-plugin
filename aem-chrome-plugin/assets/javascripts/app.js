angular.module('aem-panel-app', [])
/** Directives ngHtml **/
.directive('ngHtml', function() {
  return function(scope, element, attrs) {
    scope.$watch(attrs.ngHtml, function(value) {
      element[0].innerHTML = value;
    });
  };
})
/** Filter: removeHostFilter **/
.filter('removeHost', function() {
  return function(input) {
    if (input) {
      return input.replace(/^[\w]+:\/\/[\w:]+/, "");
    } else {
      return input;
    }
  };
});
