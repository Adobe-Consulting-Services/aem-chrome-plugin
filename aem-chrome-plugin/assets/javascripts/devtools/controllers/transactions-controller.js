angular.module('aem-chrome-plugin-app')
/** Transactions Controller **/
.controller('TransactionsCtrl', [
    '$scope',
    'removeHostFilter',
    'CommunicationsService',
    function( $scope,
              removeHostFilter,
              communications) {

  var MAX_TRANSACTIONS = 25;

  // Data
  $scope.controls = {
    urlFilter: '.html',
    searchFilter: '',
    maxTransactions: MAX_TRANSACTIONS
  };

  $scope.transactionKeys = [];
  $scope.transactions = {};

  $scope.$watch('controls.urlFilter', function(value) {
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'updateURLFilter', urlFilter: value }, function(response) {});
    }
	});

  $scope.init = function() {
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'updateURLFilter', urlFilter: $scope.controls.urlFilter }, function(response) {});
    }

    // Start listening for Requests
    communications.listen($scope);
  };

  $scope.transactions = function() {
    return $scope.transactionKeys.map(function(key) {
      return $scope.transactions[key];
    });
  };

  $scope.activeKey = null;

  $scope.clear = function() {
    $scope.transactionKeys = [];
    $scope.transactions = {};
  };

  $scope.activeRequest = function() {
    return $scope.activeKey ? $scope.transactions[$scope.activeKey] : null;
  };

  $scope.activeTracerData = function() {
    var transaction = $scope.activeRequest();
    if (transaction) {
        return transaction.tracerData;
    } else {
      return null;
    }
  };

  $scope.setActive = function(transactionId) {
    $scope.activeKey = transactionId;
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

    $scope.$apply(function() {
      $scope.removeTransactions($scope.getMaxTransactions());
    });
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
