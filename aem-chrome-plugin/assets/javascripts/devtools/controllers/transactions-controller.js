angular.module('aem-chrome-plugin-app')
/** Transactions Controller **/
.controller('TransactionsCtrl', [
    '$scope',
    '$timeout',
    'removeHostFilter',
    'CommunicationsService',
    'TracerStatusService',
    function( $scope,
              $timeout,
              removeHostFilter,
              communications,
              tracerStatus) {

  var MAX_TRANSACTIONS = 25;

  // Data
  $scope.controls = {
    urlFilter: '.html',
    searchFilter: '',
    maxTransactions: MAX_TRANSACTIONS
  };

  $scope.activeKey = null;
  $scope.activeRequest = {};
  $scope.activeTracerData  = {};
  $scope.transactionKeys = [];
  $scope.transactions = {};
  $scope.osgi = {};

  $scope.$watch('controls.urlFilter', function(value) {
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'updateURLFilter', urlFilter: value }, function(response) {});
    }
	});

  $scope.init = function() {
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'updateURLFilter', urlFilter: $scope.controls.urlFilter }, function(response) {});
      chrome.runtime.sendMessage({ action: 'getTracerConfig' }, function(data) { $scope.osgi = tracerStatus.setStatus(data); $timeout(0); });
    }

    // Start listening for Requests
    communications.listen($scope);
  };

  $scope.transactions = function() {
    return $scope.transactionKeys.map(function(key) {
      return $scope.transactions[key];
    });
  };


  $scope.clear = function() {
    var key;
    while ($scope.transactionKeys.length > 0) {
        key = $scope.transactionKeys.pop();
        delete $scope.transactions[key];
    }
  };

  $scope.setActive = function(transactionId) {
    $scope.activeKey = transactionId;
    $scope.activeRequest = $scope.activeKey ? $scope.transactions[$scope.activeKey] : null;
    $scope.activeTracerData = $scope.activeRequest.tracerData || null;
  };

  $scope.notEmpty = function(col) {
    if (!col) {
      return false;
    } else {
      return col.length > 0;
    }
  };

  $scope.getMaxTransactions = function() {
      if (!$scope.controls.maxTransactions || $scope.controls.maxTransactions < 0) {
        return MAX_TRANSACTIONS;
      } else {
        return $scope.controls.maxTransactions;
      }
  };

  $scope.getClass = function(transactionId) {
    return (transactionId === $scope.activeKey) ? 'selected' : '';
  };

  $scope.processTransaction = function(transaction, data) {
    transaction.tracerData = data;
    $scope.transactionKeys.push(transaction.key);
    $scope.transactions[transaction.key] = transaction;

    $scope.removeTransactions($scope.getMaxTransactions());

    $timeout(0);
  };

  $scope.removeTransactions = function(max) {
    var key;
    while ($scope.transactionKeys.length > max) {
        // Remove from front of array
        key = $scope.transactionKeys.shift();
        delete $scope.transactions[key];
    }
  };

  $scope.reload = function() {
    chrome.devtools.inspectedWindow.reload({
      ignoreCache: true,
    });
  };
}]);
