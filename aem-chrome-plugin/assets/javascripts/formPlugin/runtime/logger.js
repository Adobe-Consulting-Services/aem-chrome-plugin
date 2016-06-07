/**
 * Created by gahuja on 5/25/2016.
 */

/**
 * Created by gahuja on 5/10/2016.
 */

(function (window,afPlugin) {

    $(document).on("loadRuntimeFrame.afPlugin", function () {
        var currentUrl = afPlugin.url,
            logIndex = currentUrl.indexOf("logConfig"),
            $enableLogCheckBox = $("#enableLog"),
            $xfaCheckbox = $("#logCategory-xfa"),
            $xfaViewCheckbox = $("#logCategory-xfaView"),
            $xfaPerfCheckbox = $("#logCategory-xfaPerf"),
            $aFCheckbox = $("#logCategory-aF");

        if (logIndex > -1) {
            var substring = currentUrl.substring(logIndex),
                valOfa = substring.charAt(substring.indexOf("a") + 1),
                valOfb = substring.charAt(substring.indexOf("b") + 1),
                valOfc = substring.charAt(substring.indexOf("c") + 1),
                valOfd = substring.charAt(substring.indexOf("d") + 1);
            $xfaCheckbox.val(valOfa);
            $xfaViewCheckbox.val(valOfb);
            $xfaPerfCheckbox.val(valOfc);
            $aFCheckbox.val(valOfd);
            $enableLogCheckBox.prop('checked', true);
        } else {
            $xfaCheckbox.val("5");
            $xfaViewCheckbox.val("5");
            $xfaPerfCheckbox.val("5");
            $aFCheckbox.val("5");
            $enableLogCheckBox.prop('checked', false);
        }
        $xfaCheckbox.on("change",afPlugin.runtime.loggerUtils.levelValueChanged);
        $xfaViewCheckbox.on("change",afPlugin.runtime.loggerUtils.levelValueChanged);
        $xfaPerfCheckbox.on("change",afPlugin.runtime.loggerUtils.levelValueChanged);
        $aFCheckbox.on("change",afPlugin.runtime.loggerUtils.levelValueChanged);
        $enableLogCheckBox.off("change").change(afPluginRuntimeLoggerUtils.enableLogToggled);
    });

    var afPluginRuntimeLoggerUtils = afPlugin.runtime.loggerUtils = {

        levelValueChanged : function () {
            $("#enableLog").prop("checked",false);
        },

        enableLogToggled : function (data) {

            var url = afPlugin.url,
                a = $("#logCategory-xfa").val() || 7,
                b = $("#logCategory-xfaView").val() || 7,
                c = $("#logCategory-xfaPerf").val() || 7,
                d = $("#logCategory-aF").val() || 7,
                str = "logConfig=a" + a + "-b" + b + "-c" + c + "-d" + d,
                value = data.target.checked;

            if (value) {
                if (url.indexOf('logConfig') > -1) {
                    var index = url.indexOf("logConfig");
                    url = url.substring(0, index) + str + url.substring(index + 21);
                } else if (url.indexOf('?') !== -1) {
                    url = url + '&' + str;
                } else {
                    url = url + '?' + str;
                }
            }
            else {
                url = url.substring(0, url.indexOf("logConfig") - 1);
            }

            chrome.devtools.inspectedWindow.eval("window.location.href=" + JSON.stringify(url) + "");
        }

    }

})(window,window.afPlugin);
