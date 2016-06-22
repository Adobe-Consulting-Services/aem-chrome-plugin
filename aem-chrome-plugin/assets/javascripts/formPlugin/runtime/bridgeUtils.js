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

(function (window, afPlugin) {

    $(document).on("loadRuntimeFrame.afPlugin", function () {
        $("#selected-api-info,#parameterInputList").removeClass("active").addClass("inactive");
        $("#bridgeTabPanelHeader").off("click.afPlugin").one("click.afPlugin", afPlugin.runtime.guideBridgeUtils.focusBridgeApiTab);
    });

    var guideBridgeUtils = afPlugin.runtime.guideBridgeUtils = {

        blackListComponentList : ["restoreGuideState","resolveNode","getGuideState","getFileAttachmentsInfo","getDataXML","validate"],

        focusBridgeApiTab: function () {

            var apiNames = _.keys(guideBridgeUtils.listing),
                $select = $('#apiListDropdown'),
                $runButton = $(".run-button");

            $runButton.click(guideBridgeUtils.executeGuideBridgeScript);
            $select.empty();
            $select.append($("<option/>").text("-- select an option -- ").attr("selected", "selected"));
            _.each(apiNames, function (value) {
                $select.append($('<option />').attr('value', value).html(value));
            });
            $("#parameterExample").hide();

            // On change of a value in the dropdown -
            // 1) hide the result div.
            // 2) show the parameter detail div.
            // 3) show the parameter input div if the component is not blacklisted.
            $select.change(function (event) {

                var apiObject = afPlugin.runtime.guideBridgeUtils.listing[event.target.value],
                    description = apiObject.description,
                    returnType = apiObject.returnType,
                    parameters = apiObject.parameters,
                    example = apiObject.example,
                    $parameterInputDiv = $(".parameterInput"),
                    $parameterListInputDiv = $("#parameterInputList"),
                    $parameterDescriptionDiv = $("#parameterDescription"),
                    $apiExampleDiv = $("#parameterExample");

                $(".apiResult").removeClass("active").addClass('inactive');
                $("#selected-api-info").addClass('active');
                $parameterListInputDiv.show();

                if (guideBridgeUtils.blackListComponentList.indexOf(event.target.value) !== -1) {
                    $parameterListInputDiv.hide();
                }

                if (parameters) {
                    $('#api-parameters').show();
                    $parameterInputDiv.empty();
                    $parameterDescriptionDiv.empty();

                    var $parameterList = $("<ul/>").addClass('af-tree-ul').appendTo($parameterDescriptionDiv);

                    _.each(parameters, function (value, key) {

                        var $li = $("<li/>").addClass('parameterListItem'),
                            $parameterDetailDiv = $("<div/>");
                        $("<div/>").addClass("parameterName").text("NAME : " + key).appendTo($parameterDetailDiv);
                        $("<div/>").addClass("parameterType").text("TYPE : " + value.type).appendTo($parameterDetailDiv);
                        if (value.type === 'object') {
                            var $code = $("<code/>").text(value.signature),
                                $pre = $("<pre/>").append($code);
                            $("<div/>").addClass("parameterSignature").text("DESCRIPTION : The signature of the object is \n").append($pre).append($code).appendTo($parameterDetailDiv);
                        } else {
                            $("<div/>").addClass("parameterSignature").text("DESCRIPTION : The signature of the object is \n" + value.signature).appendTo($parameterDetailDiv);
                        }

                        $li.append($parameterDetailDiv);
                        $parameterList.append($li);

                        if (guideBridgeUtils.blackListComponentList.indexOf(event.target.value) === -1) {
                            var $inputDiv = $("<input/>").attr('type', 'text'),
                                $div = $("<div/>").text(key).append($inputDiv);
                            $parameterInputDiv.append($div).append($("<br>"));
                        }
                    });

                } else {
                    $parameterListInputDiv.hide();
                    $('#api-parameters').hide();
                }

                // add Example for the API
                if (example) {
                    $apiExampleDiv.find("code").empty().text(example);
                    $apiExampleDiv.show();
                } else {
                    $apiExampleDiv.hide();
                }

                // add API description
                $("#apiDetail").text(description);
                if (returnType) {
                    //add info about return type
                    $("#api-return-type").show();
                    $("#returnTypeDetail").text("Type : " + returnType);
                } else {
                    $("#api-return-type").hide();
                }
            });
        },

        // This function runs the guideBridge expression that is selected in the dropdown
        executeGuideBridgeScript: function (event) {
            var value = $('#apiListDropdown').val(),
                parameters = [],
                str = JSON.stringify(value),
                parameterInputDivs = $('.parameterInput').find("input");

            _.each(parameterInputDivs, function (value) {
                if (value.value) {
                    parameters.push(value.value);
                }
            });

            chrome.devtools.inspectedWindow.eval("window.afPlugin._executeFunction(" + str + "," + JSON.stringify(parameters) + ")", function (result) {
                if (result.value) {
                    var $resultDiv = $("#bridgeApiResultValue");
                    $resultDiv.empty();
                    if (result.type === "string") {
                        $resultDiv.text(result.value);
                    } else {
                        result.value = result.value.replace(/</g, '&lt;');
                        var data = JSON.parse(result.value),
                            $pre = $("<pre/>").attr("id", "jsonResult");
                        $resultDiv.append($pre);
                        document.getElementById("jsonResult").innerHTML = JSON.stringify(data, undefined, 2);
                    }
                    $(".apiResult").removeClass('inactive').addClass('active');
                }
            });
        }
    }

})(window, afPlugin);
