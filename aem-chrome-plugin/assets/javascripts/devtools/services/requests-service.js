angular.module('aem-chrome-plugin-app')

.factory('RequestsService', [function() {
  return {

    create: function(chromeRequest) {
      var request, requestId;

      requestId = chromeRequest.response.headers.find(function(header) {
        if (header.name.toLowerCase() === 'sling-tracer-request-id' && header.value) {
          return true;
        }
      });

      if (requestId) {
        requestId = requestId.value;
      }

      if (requestId) {
        // initialize the request w the Chrome Request/Response object
        request = chromeRequest;
        request.key = requestId;
        request.tracerData = {
          time: 0,
          timestamp: 0,
          chromeRequestProgress: [],
          logs: [],
          queries: []
        };
        return request;
      } else {
        return null;
      }
    }
  };

}]);
