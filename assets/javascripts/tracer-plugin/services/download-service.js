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

/**
 *  Approach and code borrowed from:
 *   - http://www.declancook.com/save-json-file-from-chrome-developer-tools/
 **/
angular.module('aem-chrome-plugin-app')
.factory('DownloadService', [function() {
  function jsonToText(values) {
    var text = '';

    angular.forEach(values, function(value) {
      text += value + '\n';
    }, text);

    return text;
  }

  return {
    download: function(data, filename, url, type) {
      var blob, e, a, extension;
      type = type || 'text/json';

      if (typeof data === 'object' && type === 'text/plain') {
        // if data is a JS object, but requesting as text (requestProgressLogs)
        // turn into text
        data = jsonToText(data);
      }

      // If data is still a JSON object, then print as such
      if (typeof data === 'object'){
        data = {
          url: url,
          logs: data
        };

        data = JSON.stringify(data, undefined, 4);
        extension = '.json';
      } else {
        // Print as normal text
        data = url + "\n\n" + data;
        extension = '.log';
      }

      // Name the file to download
      filename = filename ? 'aem-chrome-plugin-' + filename + extension : 'aem-chrome-plugin' + extension;

      blob = new Blob([data], {type: type});
      e = document.createEvent('MouseEvents');
      a = document.createElement('a');

      a.download = filename;
      a.href = window.URL.createObjectURL(blob);
      a.dataset.downloadurl =  [type, a.download, a.href].join(':');
      e.initMouseEvent('click', true, false,
                       window, 0, 0, 0, 0, 0,
                       false, false, false, false, 0, null);
      a.dispatchEvent(e);
    }
  };
}]);
