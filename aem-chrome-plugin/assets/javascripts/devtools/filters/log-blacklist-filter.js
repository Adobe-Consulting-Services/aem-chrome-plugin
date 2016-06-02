angular.module('aem-chrome-plugin-app')
/** Filter: logBlacklistFilter **/
.filter('logBlacklist', function() {
  return function(logs) {
    var BLACKLIST = [
      {
        logger: 'org.apache.jackrabbit.oak.query.QueryEngineImpl',
        message: 'No alternatives found. Query: select [nt:base].[jcr:primaryType] as [nt:base.jcr:primaryType] from [nt:base] as [nt:base] where property([nt:base].[rep:members], \'weakreference\') = $uuid'
      },
      {
        logger: 'org.apache.jackrabbit.oak.query.QueryEngineImpl',
        message: 'No alternatives found. Query: select [nt:base].[jcr:primaryType] as [nt:base.jcr:primaryType] from [nt:base] as [nt:base] where [nt:base].[jcr:uuid] = $id'
      },
      {
        logger: 'org.apache.jackrabbit.oak.query.QueryEngineImpl',
        message: 'No alternatives found. Query: select [rep:Authorizable].[rep:authorizableId] as [rep:Authorizable.rep:authorizableId], [rep:Authorizable].[rep:principalName] as [rep:Authorizable.rep:principalName], [rep:Authorizable].[jcr:uuid] as [rep:Authorizable.jcr:uuid], [rep:Authorizable].[jcr:primaryType] as [rep:Authorizable.jcr:primaryType], [rep:Authorizable].[jcr:createdBy] as [rep:Authorizable.jcr:createdBy], [rep:Authorizable].[jcr:created] as [rep:Authorizable.jcr:created] from [rep:Authorizable] as [rep:Authorizable] where [rep:Authorizable].[rep:principalName] = $principalName'
      }      
    ],
    result = [];

    if (logs) {
      $.each(logs, function(index, log) {
        var blacklisted = false;

        $.each(BLACKLIST, function(index, blacklistEntry) {
            if (log.logger.trim().indexOf(blacklistEntry.logger) === 0 &&
                log.message.trim().indexOf(blacklistEntry.message) === 0) {
                blacklisted = true;
                return false;
            }
        });

        if (!blacklisted) {
          result.push(log);
        }
      });
    }

    return result;
  };
});
