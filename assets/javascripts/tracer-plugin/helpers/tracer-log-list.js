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
$(function () {
    $('body').on('click', '.tracer-log-list .tracer-log-list--entry--caller-button', function () {
        var $a = $(this),
            $logEntry = $a.closest('li.tracer-log-list--entry'),
            $caller = $logEntry.find('ul.tracer-log-list--entry--caller');

        if ($caller.is(":visible")) {
            $caller.hide();
            $a.text('Show Caller');
        } else {
            $caller.show();
            $a.text('Hide Caller');
        }
    });
});