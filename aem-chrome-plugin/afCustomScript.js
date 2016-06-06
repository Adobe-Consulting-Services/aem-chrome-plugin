/**
 * Created by gahuja on 5/16/2016.
 */

document.addEventListener("DOMContentLoaded", function () {
    $(document).on("cq-editor-loaded", function () {
        window.editorFrameLoaded = true;
        window.dispatchEvent( new Event('af-editor-loaded') );
        addAuthoringUtils();
    });
});

window.addEventListener("bridgeInitializeStart",function(){
    loadRuntimeUtils();
    guideBridge.on("bridgeInitializeComplete", function(){
        addCustomCompileExpression();
    });
});



//These are private API's. Please dont use these API's for production purpose.
function addAuthoringUtils(){
    guidelib.author.AuthorUtils._getTimingMap = function () {
        var map = {};
        _.each(Granite.author.developer.findInspectables(), function (value) {
            /*
            * TODO - add regex for this condition*/
            if (value.path.indexOf('/rootPanel') !== -1 && value.path.indexOf('no_resource') == -1) {
                //This is to add all the time from rootpanel
                if (map[value.path]) {
                    var totalTime = map[value.path].totalTime + value.config.totalTime;
                    var selfTime = map[value.path].selfTime + value.config.selfTime;
                    map[value.path] = {'totalTime': totalTime, 'selfTime': selfTime}
                } else {
                    map[value.path] = {'totalTime': value.config.totalTime, 'selfTime': value.config.selfTime}
                }
            }
        });
        return map;
    };

    guidelib.author.AuthorUtils._setAuthFocus = function (path) {

        var editable = window.guidelib.author.editConfigListeners._getEditable(path);
        var somid = window.guidelib.author.AuthorUtils.getHtmlId(path);
        window.guidelib.touchlib.utils.setFocusInsideAFWindow(somid);
        window.guidelib.touchlib.editLayer.Interactions.onOverlayClick({
            editable: editable
        });
    };

    guidelib.author.AuthorUtils._getJson = function (path) {
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

function addCustomCompileExpression() {
    guidelib.model.Scriptable.prototype._originalCompileExpression = guidelib.model.Scriptable.prototype._compileExpression;

    guidelib.model.Scriptable.prototype._compileExpression = function (expression, affectedProp) {
        if (_.contains(guidelib.runtime.debugMap, this.name)) {
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

    guideBridge._addRemoveDebuggerFromRules = function (id, flag) {
        var model = guideBridge._resolveId(id),
            som = model.somExpression;
        guideBridge.setFocus(som);
        guidelib.runtime.debugMap = guidelib.runtime.debugMap || [];
        if (!_.contains(guidelib.runtime.debugMap, model.name)) {
            guidelib.runtime.debugMap.push(model.name);
        } else if (!flag) {
            var index = guidelib.runtime.debugMap.indexOf(model.name);
            guidelib.runtime.debugMap.splice(index, 1);
        }
        model._collectExpressions();
        return guideBridge.collectScriptNames(model);
    };

    //This function is used to collect the all the compiled scripts/expressions for a component
    guideBridge.collectScriptNames = function (model) {
        var keys = [];
        _.each(model._compiledExpressions, function (value, key) {
            keys.push(key);
        });
        _.each(model._compiledScripts, function (value, key) {
            keys.push(key);
        });
        return keys;
    };


    guideBridge.executeFunction = function (cmd, parameters) {
        var result,
            list = ["getDataXML", "getGuideState","getFileAttachmentsInfo"],
            returnValue,
            options = {success: function (data) {
                returnValue = data
            }};

        // for API's included in the list, we override the parameters passed.
        if (list.indexOf(cmd) > -1) {
            parameters = [options];
        }
        if (parameters && parameters.length > 0) {
            result = guideBridge[cmd].apply(this, parameters);
        } else {
            result = guideBridge[cmd]();
        }
        if (returnValue) {
            return {value: JSON.stringify(returnValue), 'type': 'object'};
        } else {
            return {value: JSON.stringify(result), 'type': 'string'};
        }
    };

    // This is used to execute the script/expression for a component.
    guideBridge.executeScript = function (compId, scriptName) {
        var model = guideBridge._resolveId(compId);
        model._setExpressionContext(model, model.index);
        model._expressionHandler(scriptName);
    };

}
