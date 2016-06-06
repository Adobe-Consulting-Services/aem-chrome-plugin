/**
 * Created by gahuja on 5/13/2016.
 */

// Listen to DOMContentLoaded when devtools opened after the form has been loaded.
document.addEventListener('DOMContentLoaded',function(){

    chrome.devtools.inspectedWindow.eval("window.location.href", function (result) {
        window.afPlugin.url = result;
        loadFrame(result);
    });

    chrome.devtools.network.onNavigated.addListener(function(data){
        window.afPlugin.url = data;
        loadFrame(data);
    });

});

//load authoring/runtime frame dependent on the url
function loadFrame(url) {
    if (url && url.indexOf("/editor.html/") > -1) {
        $("#authoring").css("display", "");
        $("#runtime").css("display", "none");
        $(document).trigger("loadAuthoringFrame.afPlugin");
    } else {
        $("#runtime").css("display", "");
        $("#authoring").css("display", "none");
        $(document).trigger("loadRuntimeFrame.afPlugin");
        $("#logTabPanelHeader").click();
    }
}

$(function() {
});
