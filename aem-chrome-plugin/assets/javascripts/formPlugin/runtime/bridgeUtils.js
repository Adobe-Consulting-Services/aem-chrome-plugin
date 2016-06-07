/**
 * Created by gahuja on 5/17/2016.
 */

(function (window, afPlugin) {

    $(document).on( "loadRuntimeFrame.afPlugin", function(){
        $("#selected-api-info,#parameterInputList").removeClass("active").addClass("inactive");
        $("#bridgeTabPanelHeader").off("click.afPlugin").one("click.afPlugin",afPlugin.runtime.guideBridgeUtils.focusBridgeApiTab);
    });

    var guideBridgeUtils = afPlugin.runtime.guideBridgeUtils = {

        listing : {
            'reset':{
                'description': 'This would reset the Adaptive Form state to initial state.',
                'example' : 'guideBridge.reset();'
            },
            'getBridgeVersion': {
                'description': 'returns the version of library',
                'returnType': 'string',
                'example': 'guideBridge.getBridgeVersion();'
            },
            'getDataXML':{
                'description':'Used to retrieve the Form data as XML. The API is an asynchronous API which calls the success/error handlers passed in the arguments upon completion',
                'parameters':{
                    'options':{
                        'type':'object',
                        'signature':'{ success: function(guideResultObject) {}, error:function(guideResultObject) {},context: obj}'
                    }
                },
                'example':'guideBridge.getDataXml({ success:function(data){console.log(data)}, error: function(data){console.log(data)} })'
            },
            'getFileAttachmentsInfo':{
                'description':'The API provides a list containing File Names and File URLS for the Files Attached by the user using the File Attachment component.' +
                    'The API is a asynchronous API and takes success handler which is called with the list of File Names and URLs.',
                'parameters': {
                    'options': {
                        'type': 'object',
                        'signature': '{ success: function(list) {} }'
                    }
                },
                'example': ' window.guideBridge.getFileAttachmentsInfo({ success:function(list) {for(var i = 0; i< list.length; i++) {console.log(list[i].name + " "+ list[i].path);}}});'
            },
            'getFocus':{
                'description':'Returns the current in Focus adaptive forms component or navigable parents SOM.',
                'example': 'guideBridge.getFocus();',
                'returnType': 'Panel | Field'
            },
            'getGuideState': {
                'description': 'used to retrieve the current state of Adaptive Forms as json string. The JSON contains the state of all the AF components, their values, visiblity, enable property etc. The API is a asynchronous call which calls the success and error handlers with the data.',
                'parameters': {
                    'options': {
                        'type': 'object',
                        'signature': '{fileUploadPath: string , success: function(guideResultObject) {} , error: function(guideResultObject) {}, context: object}'
                    }
                },
                'example' : 'guideBridge.getGuideState( { success:function(data){console.log(data)}, error: function(data){console.log(data)} } )'
            },
            'isConnected':{
                'description':'Checks whether the Adaptive Forms has been initialized and ready for interaction with external/wrapper html',
                'returnType': 'Boolean',
                'example': 'guideBridge.isConnected();'
            },
            'registerConfig':{
                'description':'Registers user/portal specific configurations to GuideBridge and returns the old configuration against the same key.Currently supported configurations are: postExternalMessageConfig , widgetConfig',
                'parameters': {
                    'key': {
                        'type': 'string',
                        'signature': ' configuration name (one of postExternalMessageConfig or widgetConfig)'
                    },
                    'config':{
                        'type': 'object',
                        'signature': 'configuration object.'
                    }
                },
                'example': 'guideBridge.registerConfig("key","value");',
                'returnType': 'GuideResultObject'
            },
            'resolveNode':{
                'description': 'Given a somExpression, returns the Adaptive Form component having the same somExpression.',
                'parameters': {
                    'somExpression': {
                        'type': 'string',
                        'signature': 'somExpression of the Adaptive Form component'
                    }
                },
                'example' : 'guideBridge.resolveNode("guide[0].guide1[0].guideRootPanel[0].panel1[0].radiobutton[0]")',
                'returnType':'object'
            },
            'restoreGuideState':{
                'description': 'Restores the Adaptive Forms fill state from the passed in json data. The JSON data must be the one that is returned from the GuideBridge#getGuideState API',
                'parameters': {
                    'options': {
                        'type': 'object',
                        'signature': ' {data: { },success: function(guideResultObject) { },error: function(guideResultObject( { },context: object}'
                    }
                }
            },
            'setFocus':{
                'description': 'Sets focus to the given Adaptive Forms Panel or Field as specified by the somExpression If that field is in a tab (for tabbed navigation) that is not currently open, then that tab would be opened and focus would be set to that field. In case, set focus is called for a Panel, focus would be set to first focussable field of that Panel. After the focus is set, runs applicable completeExp.',
                'parameters': {
                    'somExpression': {
                        'type': 'string',
                        'signature': 'somExpression of the Adaptive Form component'
                    },
                    'focusOption': {
                        'type': 'string',
                        'signature': 'one of the value nextItem,prevItem,lastItem,firstItem,nextItemDeep,prevItemDeep'
                    },
                    'runCompletionScript': {
                        'type': 'boolean',
                        'signature': 'indicating whether to execute the completion expression or not.'
                    }
                },
                'example': 'guideBridge.setFocus("guide[0].guide1[0].guideRootPanel[0].panel1[0].radiobutton[0]");',
                'returnType':'boolean'
            },
            'setProperty':{
                'description': 'Sets the values for the list of SOMs for the mentioned property. Property can only be "value", "access", or "presence".',
                'parameters': {
                    'somList': {
                        'type': 'array',
                        'signature': 'should be an array having someExpression for the fields'
                    },
                    'propertyName': {
                        'type': 'string',
                        'signature': 'is the property for the fields to be set'
                    },
                    'valueList': {
                        'type': 'array',
                        'signature': 'should be an array containing values for the property for that field.'
                    }
                }
            },
            'validate':{
                'description': 'Validates the Adaptive Forms or its specific panel and return validation status. Also, moves focus to first invalid element.',
                'parameters': {
                    'errorList': {
                        'type': 'array',
                        'signature': 'list of Adaptive Form Components that failed validation. '
                    },
                    'somExpression': {
                        'type': 'string',
                        'signature': 'SOM Expression of the Guide Node for which validation should be triggered. If not provided, it would validate the entire Adaptive Form'
                    }
                }
            }
        },

        blackListComponentList : ["restoreGuideState","resolveNode","getGuideState","getFileAttachmentsInfo","getDataXML","validate"],

        focusBridgeApiTab: function () {

            var apiNames = _.keys(guideBridgeUtils.listing),
                $select = $('#apiListDropdown'),
                $runButton = $(".runButton");

            $runButton.click(guideBridgeUtils.executeGuideBridgeScript);
            $select.empty();
            $select.append($("<option/>").text("-- select an option -- ").attr("selected","selected"));
            _.each(apiNames,function(value) {
                $select.append($('<option />').attr('value', value).html(value));
            });
            $("#parameterExample").hide();

            $select.change(function(event) {

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

                if(guideBridgeUtils.blackListComponentList.indexOf(event.target.value) !== -1) {
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
                        if(value.type === 'object'){
                            var $code = $("<code/>").text(value.signature),
                                $pre = $("<pre/>").append($code);
                            $("<div/>").addClass("parameterSignature").text("DESCRIPTION : The signature of the object is \n").append($pre).append($code).appendTo($parameterDetailDiv);
                        } else {
                            $("<div/>").addClass("parameterSignature").text("DESCRIPTION : The signature of the object is \n" + value.signature).appendTo($parameterDetailDiv);
                        }

                        $li.append($parameterDetailDiv);
                        $parameterList.append($li);

                        if(guideBridgeUtils.blackListComponentList.indexOf(event.target.value) === -1){
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
                if(example){
                    $apiExampleDiv.find("code").empty().text(example);
                    $apiExampleDiv.show();
                } else {
                    $apiExampleDiv.hide();
                }

                // add API description
                $("#apiDetail").text(description);
                if(returnType){
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
                parameterInputDivs =  $('.parameterInput').find("input");

            _.each(parameterInputDivs,function(value){
                if(value.value){
                    parameters.push(value.value);
                }
            });

            chrome.devtools.inspectedWindow.eval("window.guideBridge.executeFunction(" + str + "," + JSON.stringify(parameters) + ")", function (result) {
                if(result.value){
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
