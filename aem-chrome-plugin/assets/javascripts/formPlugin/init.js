/*
 * #%L
 * AEM Chrome Plug-in
 * %%
 * Copyright (C) 2016 Adobe
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */

// Listen to DOMContentLoaded when devtools opened after the form has been loaded.
document.addEventListener('DOMContentLoaded', function () {

    chrome.devtools.inspectedWindow.eval("window.location.href", function (result) {
        window.afPlugin.url = result;
        loadFrame(result);
    });

    chrome.devtools.network.onNavigated.addListener(function (data) {
        window.afPlugin.url = data;
        loadFrame(data);
    });

});

//load authoring/runtime frame dependent on the url
function loadFrame(url) {
    if (url && url.indexOf("/editor.html/") > -1) {
        // hide the runtime frame and display the authoring frame.
        $("#authoring").removeClass("inactive").addClass("active");
        $("#runtime").removeClass("active").addClass("inactive");
        $(document).trigger("loadAuthoringFrame.afPlugin");
    } else {
        // hide the authoring frame and display the runtime frame.
        $("#runtime").removeClass("inactive").addClass("active");
        $("#authoring").removeClass("active").addClass("inactive");
        $(document).trigger("loadRuntimeFrame.afPlugin");
    }
}
