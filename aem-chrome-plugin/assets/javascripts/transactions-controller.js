angular.module('aem-panel-app')
/** Controller **/
.controller('TransactionsCtrl', ['$scope', 'removeHostFilter', function($scope, removeHostFilter) {
  var MAX_TRANSACTIONS = 25;

  // Data
  $scope.controls = {
    urlFilter: '.html',
    searchFilter: '',
    maxTransactions: MAX_TRANSACTIONS
  };

  $scope.transactionKeys = [];
  $scope.transactionMap = {};
  $scope.logMap = {};
  $scope.queryMap = {};

  $scope.$watch('controls.urlFilter', function(value) {
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'updateURLFilter', urlFilter: value }, function(response) {});
    }
	});

  $scope.init = function() {
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'updateURLFilter', urlFilter: $scope.controls.urlFilter }, function(response) {});
    }
  };

  $scope.transactions = function() {
    return $scope.transactionKeys.map(function(key) {
      return $scope.transactionMap[key];
    });
  };

  $scope.activeKey = null;

  $scope.clear = function() {
    $scope.transactionKeys = [];
    $scope.transactionMap = {};
    $scope.logMap = {};
    $scope.queryMap = {};
  };

  $scope.activeRequest = function() {
    return $scope.activeKey ? $scope.transactionMap[$scope.activeKey] : null;
  };

  $scope.activeQueries = function() {
    return $scope.queryMap[$scope.activeKey];
  };

  $scope.activeLog = function() {
    return $scope.logMap[$scope.activeKey];
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
    $scope.transactionKeys.unshift(transaction.key);
    $scope.transactionMap[transaction.key] = transaction;

    angular.forEach(data, function(value, dataType) {
      $scope.processTransactionData(transaction, dataType, value);
    });

    $scope.$apply(function() {
      $scope.removeTransactions($scope.getMaxTransactions());
    });
  };

  $scope.processTransactionData = function(transaction, dataType, data) {
    switch(dataType) {
      case "logs":

        $scope.pushToMap($scope.logMap, transaction.key, data);
        break;

      case "queries":
        $scope.pushToMap($scope.queryMap, transaction.key, data);
        break;

      default:
        console.log('Data-type not supported: ' + name);
    }
  };

  $scope.pushToMap = function(map, key, data) {
    var value = map[key];
    if (typeof value === 'undefined') {
      if (angular.isArray(data)) {
        map[key] = data;
      } else {
        map[key] = [data];
      }
    } else {
      value.push(data)
    }
  };

  $scope.removeTransactions = function(max) {
    var key;
    while ($scope.transactionKeys.length > max) {
        key = $scope.transactionKeys.pop();
        delete $scope.transactionMap[key];
        delete $scope.logMap[key];
        delete $scope.queryMap[key];
    }
  };

  $scope.reload = function() {
    chrome.devtools.inspectedWindow.reload({
      ignoreCache: true,
    });
  };

}]);
