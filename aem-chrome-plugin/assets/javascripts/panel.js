var panel = {
  clearData: function(scope) {
    scope.$apply(function() {
      scope.clear();
    });
  },

  addData: function(transaction, data, scope) {
    scope.processTransaction(transaction, data);
  }
};
