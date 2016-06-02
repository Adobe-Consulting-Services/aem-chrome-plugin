angular.module('aem-chrome-plugin-app')
/** Filter: queryBlacklistFilter **/
.filter('queryBlacklist', function() {
  return function(queries) {
    var BLACKLIST = [
      'select [nt:base].[jcr:primaryType] as [nt:base.jcr:primaryType] from [nt:base] as [nt:base] where [nt:base].[jcr:uuid] = $id',
    ],
    result = [];

    if (queries) {
      $.each(queries, function(index, query) {
        var blacklisted = false;

        $.each(BLACKLIST, function(index, blacklistEntry) {
            if (query.query.indexOf(blacklistEntry) === 0) {
                blacklisted = true;
                return false;
            }
        });

        if (!blacklisted) {
          result.push(query);
        }
      });
    }

    return result;
  };
});
