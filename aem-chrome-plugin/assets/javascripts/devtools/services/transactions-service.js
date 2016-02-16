angular.module('aem-chrome-plugin-app')

.factory('TransactionsService', [function() {
  return {

    create: function(request) {
      var httpTransaction, requestId;

      requestId = request.response.headers.find(function(header) {
        if (header.name.toLowerCase() === 'sling-tracer-request-id' && header.value) {
          return true;
        }
      });

      if (requestId) {
        requestId = requestId.value;
      }

      if (requestId) {
        // initialize the httpTransaction w the Chrome Request/Response object
        httpTransaction = request;
        httpTransaction.key = requestId;
        httpTransaction.tracerData = {
          time: 0,
          timestamp: 0,
          requestProgress: [],
          logs: [],
          queries: []
        };
        return httpTransaction;
      } else {
        return null;
      }
    }
  };

}]);
