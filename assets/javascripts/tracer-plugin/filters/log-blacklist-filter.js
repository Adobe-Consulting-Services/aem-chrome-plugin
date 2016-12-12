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
/** Filter: logBlacklistFilter **/
    .filter('logBlacklist', function () {
        return function (logs) {
            var BLACKLIST = [
                    {
                        logger: 'org.apache.jackrabbit.oak.query.QueryEngineImpl',
                        message: 'No alternatives found. Query: select [nt:base].[jcr:primaryType] as [nt:base.jcr:primaryType] from [nt:base] as [nt:base] where property([nt:base].[rep:members], \'weakreference\') = $uuid'
                    },
                    {
                        logger: 'org.apache.jackrabbit.oak.query.QueryEngineImpl',
                        message: 'No alternatives found. Query: select [nt:base].[jcr:primaryType] as [nt:base.jcr:primaryType] from [nt:base] as [nt:base] where [nt:base].[jcr:uuid] = $id'
                    },
                    {
                        logger: 'org.apache.jackrabbit.oak.query.QueryEngineImpl',
                        message: 'No alternatives found. Query: select [rep:Authorizable].[rep:authorizableId] as [rep:Authorizable.rep:authorizableId], [rep:Authorizable].[rep:principalName] as [rep:Authorizable.rep:principalName], [rep:Authorizable].[jcr:uuid] as [rep:Authorizable.jcr:uuid], [rep:Authorizable].[jcr:primaryType] as [rep:Authorizable.jcr:primaryType], [rep:Authorizable].[jcr:createdBy] as [rep:Authorizable.jcr:createdBy], [rep:Authorizable].[jcr:created] as [rep:Authorizable.jcr:created] from [rep:Authorizable] as [rep:Authorizable] where [rep:Authorizable].[rep:principalName] = $principalName'
                    },
                    {
                        logger: 'org.apache.jackrabbit.oak.query.QueryEngineImpl',
                        message: 'No alternatives found. Query: select [rep:MemberReferences].[jcr:primaryType] as [rep:MemberReferences.jcr:primaryType] from [rep:MemberReferences] as [rep:MemberReferences] where property([rep:MemberReferences].[rep:members], \'weakreference\') = $uuid'
                    }
                ],
                result = [];

            if (logs) {
                $.each(logs, function (index, log) {
                    var blacklisted = false;

                    $.each(BLACKLIST, function (index, blacklistEntry) {
                        if (log.logger.trim().indexOf(blacklistEntry.logger) === 0 &&
                            log.message.trim().indexOf(blacklistEntry.message) === 0) {
                            blacklisted = true;
                            return false;
                        }
                    });

                    if (!blacklisted) {
                        result.push(log);
                    }
                });
            }

            return result;
        };
    });
