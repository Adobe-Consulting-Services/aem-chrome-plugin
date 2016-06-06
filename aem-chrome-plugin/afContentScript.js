var s = document.createElement('script');
s.src = chrome.extension.getURL('afCustomScript.js');
(document.head || document.documentElement).appendChild(s);

window.addEventListener('af-editor-loaded', function (e) {
    chrome.runtime.sendMessage({url: window.location.href , action: "af-editor-loaded"}, function(response) {
        console.log(response);
    });
});
