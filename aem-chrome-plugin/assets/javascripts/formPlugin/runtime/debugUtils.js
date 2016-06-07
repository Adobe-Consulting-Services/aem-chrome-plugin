/**
 * Created by gahuja on 5/10/2016.
 */

(function (window,afPlugin) {

    var debugObj = window.afPlugin.runtime.debugObj = {};

    $(document).on( "loadRuntimeFrame.afPlugin", function(){
        //empty the already existing data
        $("#bridgeApiResultValue,#debugList,.runtimeComponentTree").empty();
        $("#debugTabPanelHeader").off("click.afPlugin").one("click.afPlugin",window.afPlugin.runtime.debugUtils.focusDebugTab);
        // clear the debug map in guidelib
        chrome.devtools.inspectedWindow.eval("guidelib.runtime.debugMap = []");
        debugObj = {};
    });

    var afPluginRuntime = afPlugin.runtime.debugUtils = {

        focusDebugTab: function () {
            chrome.devtools.inspectedWindow.eval("guidelib.runtime.guide.rootPanel.jsonModel", function (result) {
                var $list = $("<ul/>").addClass('af-tree-ul');
                afPluginRuntime.buildTreeItem(result, $list);
                $(".runtimeComponentTree").append($list);
            });
        },

        buildTreeItem: function (obj, list) {
            var $item = $("<li/>"),
                $heading = $("<h3/>"),
                $debugButton = $("<button/>").addClass("debugButton")
                                             .attr("data-id", obj.templateId)
                                             .attr("data-name", obj.name)
                                             .click(afPluginRuntime.debugThisField);
            $heading.append($("<span/>").text(obj.label || obj.name));
            $heading.append($debugButton);
            $item.append($heading);
            afPluginRuntime.buildTree(obj, $item);
            list.append($item);
        },

        buildTree: function (obj, $parent) {
            _.each(obj.items, function (value, key) {
                var list = $("<ul/>").addClass('af-tree-ul');
                afPluginRuntime.buildTreeItem(value, list);
                $parent.append(list);
            });
        },

        debugThisField: function (event) {
            var target= $(event.currentTarget),
                id = $(event.currentTarget).data("id"),
                name = $(event.currentTarget).data("name");
            id = JSON.stringify(id);
            if (!debugObj[name]) {
                chrome.devtools.inspectedWindow.eval("guideBridge._addRemoveDebuggerFromRules(" + id + ")", function (result) {
                    target.css("background-color","#E80C0C");
                    debugObj[name] = result;
                    afPluginRuntime.updateDebugListView(name,id,true);
                });
            } else {
                chrome.devtools.inspectedWindow.eval("guideBridge._addRemoveDebuggerFromRules(" + id + ",false)", function (result) {
                    target.css("background-color","grey");
                    delete debugObj[name];
                    afPluginRuntime.updateDebugListView(name,id,false);
                });
            }
        },

        updateDebugListView: function (name, id, add) {
            var $list = $("#debugList");
            if(add){
                var $componentName = $("<h3/>").append($("<span/>").text(name)),
                    $li = $("<li/>").attr("data-name", name).attr("data-id", id).append($componentName),
                    value = debugObj[name],
                    $scriptList = $("<ul/>").addClass('af-tree-ul').appendTo($li);
                if( value && value.length > 0){
                    for (var i = 0; i < value.length; i++) {
                        var $playButton = $("<div/>").css("display","inline-block").append(($("<img/>").attr("src","assets/images/playIcon.png").css("height","20px").css({'opacity': '0.6','margin-left': '6px','vertical-align':'middle'}).attr("data-name", name).attr("data-id", id))).click(afPluginRuntime.executeScript),
                            $item = $("<li/>"),
                            $scriptName = $("<h3/>").append($("<span/>").text(value[i])).append($playButton);
                        $item.append($scriptName);
                        $scriptList.append($item);
                    }
                    $li.appendTo($list);
                }
            } else {
                $list.find("li[data-name='" + name + "']").remove();
            }
        },

        executeScript: function (event) {
            var compId = $(event.target).data("id"),
                scriptName = JSON.stringify(event.currentTarget.parentElement.textContent);
            chrome.devtools.inspectedWindow.eval("guideBridge.executeScript(" + compId + "," + scriptName + ")", function (result, isException) {
            });
        }
    }

})(window,window.afPlugin);
