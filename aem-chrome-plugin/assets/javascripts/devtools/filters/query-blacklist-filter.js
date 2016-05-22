angular.module('aem-chrome-plugin-app')
/** Filter: removeHostFilter **/
.filter('queryBlacklist', function() {
  return function(input) {
    var BLACKLIST = [
      'select [nt:base].[jcr:primaryType] as [nt:base.jcr:primaryType] from [nt:base] as [nt:base] where [nt:base].[jcr:uuid] = $id',
    ];
    if (input) {
      input  = input.trim();
      return !BLACKLIST.indexOf(input);
    } else {
      return false;
    }
  };
});
