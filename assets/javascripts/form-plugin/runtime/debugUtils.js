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

(function (window,afPlugin) {

    var debugObj = window.afPlugin.runtime.debugObj = {};

    $(document).on( "loadRuntimeFrame.afPlugin", function(){
        //empty the already existing data
        $("#bridgeApiResultValue,#debugList,.runtimeComponentTree").empty();
        $("#debugTabPanelHeader").off("click.afPlugin").one("click.afPlugin",window.afPlugin.runtime.debugUtils.focusDebugTab);
        // clear the debug map in guidelib
        chrome.devtools.inspectedWindow.eval("window.afPlugin.debugMap = []");
        debugObj = {};
    });

    var afPluginRuntime = afPlugin.runtime.debugUtils = {

        /*
         *  This function gets the jsonModel of the form and then build the tree for runtime.
         */
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
                                             .attr("data-title",obj['jcr:title'] || obj.name)
                                             .click(afPluginRuntime.debugThisField);
            $heading.append($("<span/>").text(obj['jcr:title'] || obj.name));
            $heading.append($debugButton);
            $item.append($heading);
            afPluginRuntime.buildTree(obj, $item);
            list.append($item);
        },

        buildTree: function (obj, $parent) {
            var listOfChildren = obj.items;
            if(obj.hasOwnProperty("toolbar")){
                listOfChildren['toolbar'] = obj.toolbar
            }
            _.each(listOfChildren, function (value, key) {
                var list = $("<ul/>").addClass('af-tree-ul');
                afPluginRuntime.buildTreeItem(value, list);
                $parent.append(list);
            });
        },

        /*
         * This function adds/removes the debugger from a rule
         */
        debugThisField: function (event) {
            var target= $(event.currentTarget),
                id = $(event.currentTarget).data("id"),
                title = $(event.currentTarget).data("title");
            id = JSON.stringify(id);
            if (!debugObj[title]) {
                chrome.devtools.inspectedWindow.eval("window.afPlugin._addRemoveDebuggerFromRules(" + id + ")", function (result) {
                    target.css("background-color","#E80C0C");
                    debugObj[title] = result;
                    afPluginRuntime.updateDebugListView(title,id,true);
                });
            } else {
                chrome.devtools.inspectedWindow.eval("window.afPlugin._addRemoveDebuggerFromRules(" + id + ",false)", function (result) {
                    target.css("background-color","grey");
                    delete debugObj[title];
                    afPluginRuntime.updateDebugListView(title,id,false);
                });
            }
        },

        /*
         * This function updates the list of the scripts that can be debugged.
         */
        updateDebugListView: function (name, id, add) {
            var $list = $("#debugList");
            if(add){
                var $componentName = $("<h3/>").append($("<span/>").text(name)),
                    $li = $("<li/>").attr("data-name", name).attr("data-id", id).append($componentName),
                    value = debugObj[name],
                    $scriptList = $("<ul/>").addClass('af-tree-ul').appendTo($li);
                if( value && value.length > 0){
                    for (var i = 0; i < value.length; i++) {
                        var $playIcon = $("<img/>").attr("src","assets/images/playIcon.png")
                            .addClass('af-script-play-button')
                            .attr("data-name", name)
                            .attr("data-id", id);

                        var $playButtonDiv = $("<div/>").css("display","inline-block")
                                                     .append($playIcon)
                                                     .click(afPluginRuntime.executeScript),
                            $item = $("<li/>"),
                            $scriptName = $("<h3/>").append($("<span/>").text(value[i])).append($playButtonDiv);
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
            chrome.devtools.inspectedWindow.eval("window.afPlugin._executeScript(" + compId + "," + scriptName + ")", function (result, isException) {
            });
        }
    }

})(window,window.afPlugin);
