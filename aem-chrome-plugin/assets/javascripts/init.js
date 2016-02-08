$(function() {

  // Initializes UI
  //
  var uiInit = function () {
    $('#tabs').tabs();
    $('.stupidtable').stupidtable();
    dividers.init();
  };

  // Checks if the panel is in the standalone (mock data) mode
  //
  var isStandaloneMode = false;
  /*
  function() {
    return typeof chrome.devtools == 'undefined';
  };
  */

  var scope = angular.element('.aem-panel-transactions-controller').scope();
  uiInit();
  key('⌘+k, ctrl+l', function(){ panel.clearData(scope) });

  //new TransactionsCtrl(scope);   // wire angular controller
  //scope.init();
  // listen for requests
  requests.bindListener(scope);

});
