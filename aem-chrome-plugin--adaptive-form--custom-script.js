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

document.addEventListener("DOMContentLoaded", function () {
    window.afPlugin = window.afPlugin || {};
    /*
     * There are two cases for loading the plugin -
     *
     * 1) When devtools is already open and the form loads later
     *
     *   For this case, after cq-editor-loaded has fired, we dispatch an event af-editor-loaded on window. Content scripts
     *   listens to this event and sends a message to the background page which in turn forwards the message to the devtools panel.
     *
     * 2) When devtools is opened after the form has been loaded.
     *
     *   In this case, cq-editor-loaded would have already been triggered and there is no way to listen to that event.
     *   So, we set a flag (editorFrameLoaded) on window. In authorUtils, we evaluate this flag
     *   on the console and display the authoring frame.
     */
    try {
        if ($) {
            $(document).on("cq-editor-loaded", function () {
                window.editorFrameLoaded = true;
                window.dispatchEvent(new Event('af-editor-loaded.afPlugin'));
                addAuthoringUtils();
            });
        }
    } catch(err) {
        // Do not bother user with errors as this script can be injected in unexpected contexts (though we try not to).
    }
});

/*
 * Listen to bridgeInitializeStart event and register the custom functions required for runtime frame
 * of the plugin.
 */
window.addEventListener("bridgeInitializeStart", function () {
    window.afPlugin = window.afPlugin || {};
    loadRuntimeUtils();
    guideBridge.on("bridgeInitializeComplete", function () {
        addCustomCompileExpression();
    });
});

function addAuthoringUtils() {

    /*
     *  This API is used to get the timing map for all the components in the form.
     *  _getTimingMap is a private API. Please don't use this API for production purposes as it can change anytime.
     */
    window.afPlugin._getTimingMap = function () {
        var map = {};
        //findInspectables is a private API. Please don't use this API for production purposes as it can change anytime.
        _.each(Granite.author.developer.findInspectables(), function (value) {
            if (value.path.indexOf('/rootPanel') !== -1 && value.path.indexOf('no_resource') == -1) {
                if (map[value.path]) {
                    var totalTime = map[value.path].totalTime + value.config.totalTime;
                    var selfTime = map[value.path].selfTime + value.config.selfTime;
                    map[value.path] = {'totalTime': totalTime, 'selfTime': selfTime};
                } else {
                    map[value.path] = {'totalTime': value.config.totalTime, 'selfTime': value.config.selfTime};
                }
            }
        });
        return map;
    };

    /*
     *  This function is used to set the focus on the component at the given path in authoring mode.
     *  _setAuthFocus is a private API. Please don't use this API for production purposes as it can change anytime.
     */
    window.afPlugin._setAuthFocus = function (path) {

        //_getEditable is a private API. Please don't use this API for production purposes as it can change anytime.
        var editable = window.guidelib.author.editConfigListeners._getEditable(path);

        //getHtmlId is a private API. Please don't use this API for production purposes as it can change anytime.
        var somid = window.guidelib.author.AuthorUtils.getHtmlId(path);

        //setFocusInsideAFWindow is a private API. Please don't use this API for production purposes as it can change anytime.
        window.guidelib.touchlib.utils.setFocusInsideAFWindow(somid);

        //onOverlayClick is a private API. Please don't use this API for production purposes as it can change anytime.
        window.guidelib.touchlib.editLayer.Interactions.onOverlayClick({
            editable: editable
        });
    };

    /*
     * _getJson is a private API. Please don't use this API for production purposes as it can change anytime.
     */
    window.afPlugin._getJson = function (path) {
        var result = $.ajax({
            url: path,
            async: false,
            type: "GET",
            success: function (data) {
                return data;
            }
        }).responseText;

        return JSON.parse(result);
    };

}

/*
 * This overrides the original compileExpression function so that a debugger string can now be attached to the script.
 */
function addCustomCompileExpression() {
    // _compileExpression is a private API. Please don't use this API for production purposes as it can change anytime.
    guidelib.model.Scriptable.prototype._originalCompileExpression = guidelib.model.Scriptable.prototype._compileExpression;

    // _compileExpression is a private API. Please don't use this API for production purposes as it can change anytime.
    guidelib.model.Scriptable.prototype._compileExpression = function (expression, affectedProp) {
        if (_.contains(window.afPlugin.debugMap, this.name)) {
            var debugStr = "debugger;\\n",
                evalInd = expression.indexOf("eval("),
                debuggerInd = expression.indexOf("debugger");
            if (evalInd > -1 && debuggerInd < 0) {
                expression = expression.substring(0, evalInd + 6) + debugStr + expression.substring(evalInd + 6);
            } else if (evalInd === -1) {
                debugStr = "debugger;\n";
                expression = debugStr + expression;
            }
        }
        return guidelib.model.Scriptable.prototype._originalCompileExpression.call(this, expression, affectedProp);
    };
}

function loadRuntimeUtils() {

    /*
     *  _addRemoveDebuggerFromRules is a private API. Please don't use this API for production purposes as it can change anytime.
     */
    window.afPlugin._addRemoveDebuggerFromRules = function (id, flag) {
        // _resolveId is a private API. Please don't use this API for production purposes as it can change anytime.
        var model = guideBridge._resolveId(id),
            som = model.somExpression;
        guideBridge.setFocus(som);
        window.afPlugin.debugMap = window.afPlugin.debugMap || [];
        if (!_.contains(window.afPlugin.debugMap, model.name)) {
            window.afPlugin.debugMap.push(model.name);
        } else if (!flag) {
            var index = window.afPlugin.debugMap.indexOf(model.name);
            window.afPlugin.debugMap.splice(index, 1);
        }

        // _collectExpressions is a private API. Please don't use this API for production purposes as it can change anytime.
        model._collectExpressions();

        // _collectScriptNames is a private API. Please don't use this API for production purposes as it can change anytime.
        return window.afPlugin._collectScriptNames(model);
    };

    /*
     * This function is used to collect the all the compiled scripts/expressions for a component
     * _collectScriptNames is a private API. Please don't use this API for production purposes as it can change anytime.
     */
    window.afPlugin._collectScriptNames = function (model) {
        var keys = [];
        // _compiledExpressions is a private property. Please don't use this property for production purposes as it can change anytime.
        _.each(model._compiledExpressions, function (value, key) {
            keys.push(key);
        });
        // _compiledScripts is a private property. Please don't use this property for production purposes as it can change anytime.
        _.each(model._compiledScripts, function (value, key) {
            keys.push(key);
        });
        return keys;
    };


    /*
     * This function is used to run the guideBridge commands.
     * _executeFunction is a private API. Please don't use this API for production purposes as it can change anytime.
     */
    window.afPlugin._executeFunction = function (cmd, parameters) {
        var result,
            list = ["getDataXML", "getGuideState", "getFileAttachmentsInfo"],
            returnValue,
            options = {success: function (data) {
                returnValue = data;
            }};

        // for API's included in the list, we override the parameters passed.
        if (list.indexOf(cmd) > -1) {
            parameters = [options];
        }
        if (parameters && parameters.length > 0) {
            result = guideBridge[cmd].apply(guideBridge, parameters);
        } else {
            result = guideBridge[cmd]();
        }
        if (returnValue) {
            return {value: JSON.stringify(returnValue), 'type': 'object'};
        } else {
            return {value: JSON.stringify(result), 'type': 'string'};
        }
    };

    /*
     * This is used to execute the script/expression for a component.
     * _executeScript is a private API. Please don't use this API for production purposes as it can change anytime.
     */
    window.afPlugin._executeScript = function (compId, scriptName) {
        // _resolveId is a private API. Please don't use this API for production purposes as it can change anytime.
        var model = guideBridge._resolveId(compId);
        // _setExpressionContext is a private API. Please don't use this API for production purposes as it can change anytime.
        model._setExpressionContext(model, model.index);
        // _expressionHandler is a private API. Please don't use this API for production purposes as it can change anytime.
        model.executeExpression(scriptName);
    };

}
