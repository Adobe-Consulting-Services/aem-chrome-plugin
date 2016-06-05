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

angular.module('aem-chrome-plugin-app')
.directive('aemChromePluginLogList', function() {
    return {
      restrict: 'A',
      scope: {
       entries: '=',
       filter: '='
      },
      link: function link(scope, element, attrs) {
        var cache = [];
        /*
        scope.$watchGroup(['entries', 'filter'], function(newValues, oldValues, scope) {
          var html = '',
              entries = newValues[0],
              filter = newValues[1];

          if (entries && entries.length > 0) {
            angular.forEach(entries, function(entry) {
              var filter = scope.filter || '',
                  entryHTML = null;

              if (entry) {
                // Either no filter specified so include all
                // Or the filter is specified and matches
                entryHTML = buildEntry(attrs.format, entry, filter);

                if (entryHTML) {
                  html += entryHTML;
                }
              }
            });
          }

          if (html) {
            html = '<ul>' + html + '</ul>';
          }

          element.html(html);
        }); // End groupWatch
        */

        scope.$watchGroup(['entries'], function(newValues, oldValues, scope) {
          var html = '',
              entries = newValues[0];

          cache = [];
          if (entries && entries.length > 0) {
            angular.forEach(entries, function(entry) {
              var builtEntry = null;

              if (entry) {
                // Either no filter specified so include all
                // Or the filter is specified and matches
                builtEntry = buildEntry(attrs.format, entry);

                if (builtEntry.html) {
                  cache.push(builtEntry);

                  // Only filter HTML on initial list build
                  if (scope.filter && scope.filter.length > 0) {
                    if (builtEntry.haystack.indexOf(scope.filter) > -1) {
                      html += builtEntry.html;
                    }
                  } else {
                    html += builtEntry.html;                    
                  }
                }
              }
            });
          }

          render(html);
        }); // End groupWatch entries


        scope.$watchGroup(['filter'], function(newValues, oldValues, scope) {
          var html = '',
              filter = (newValues[0] || '').toLowerCase();

          if (filter && filter.length > 0) {
            angular.forEach(cache, function(entry) {
              if (entry.haystack.indexOf(filter) > -1) {
                html += entry.html;
              }
            });
          } else {
            angular.forEach(cache, function(entry) {
              html += entry.html;
            });
          }

          render(html);
        }); // End groupWatch filter


        function render(html) {
          if (html) {
            html = '<ul>' + html + '</ul>';
          }

          element.html(html);
        }

        function buildEntry(format, entry) {
          var result = {};

          if ('logs' === format) {
            result = logsTemplate(entry);
          } else if ('queries' === format) {
            result = queriesTemplate(entry);
          } else if ('requestProgress' === format) {
            result = requestProgressTemplate(entry);
          } else {
            result = genericTemplate(entry);
          }

          /*
          if (needle && needle.length > 0) {
            if (result.haystack.toLowerCase().indexOf(needle.toLowerCase()) > -1) {
              return result.html;
            }
          } else {
            return result.html;
          }
          */

          return result;
        }

        function genericTemplate(entry) {
          return {
              html: '<li>' + entry + '</li>',
              haystack: entry.toLowerCase()
          };
        }

        function requestProgressTemplate(entry) {
          return {
              html: '<li>' + entry.replace(/(^\d+\s[A-Z_]+)/m, '<strong>$1</strong> ') + '</li>',
              haystack: entry.toLowerCase()
          };
        }

        function queriesTemplate(entry) {
          var html = '',
              haystack = '';

          if (entry.caller) {
            html += '<p><strong>CALLER: ' + entry.caller + '</strong></p>';
            haystack += entry.caller + ' ';
          }

          html += '<p><strong>QUERY:</strong> ' + entry.query + '</p>';
          html += '<p><strong>PLAN:</strong> ' + entry.plan + '</p>';
          haystack += entry.query + ' ' + entry.plan;

          return {
              html: '<li>' + html + '</li>',
              haystack: haystack.toLowerCase()
          };
        }

        function logsTemplate(entry) {
          var i = 0,
              haystack = entry.level + ' ' + entry.logger + ' ' + entry.message,
              html = '<li><p><strong>';

          html += entry.level;
          html += ' ';
          html += entry.logger;
          html += '</strong></p>';
          html += '<p>' + entry.message + '</p>';

          if (entry.params && entry.params.length > 0) {
            html += '<ul class="params-list">';
            for (i = 0; i < entry.params.length; i++) {
              html += '<li>' + entry.params[i] + '</li>';
              haystack += ' ' + entry.params[i];
            }
            html += '</ul>';
          }

          html +='</li>';

          return {
            html: html,
            haystack: haystack.toLowerCase()
          };
        }
      }
  };
});
