angular.module('aem-chrome-plugin-app')
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
