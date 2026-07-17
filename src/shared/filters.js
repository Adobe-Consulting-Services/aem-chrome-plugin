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

const LOG_BLACKLIST = [
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
];

const QUERY_BLACKLIST = [
    'select [nt:base].[jcr:primaryType] as [nt:base.jcr:primaryType] from [nt:base] as [nt:base] where [nt:base].[jcr:uuid] = $id'
];

export function logBlacklist(logs) {
    if (!logs) {
        return [];
    }

    return logs.filter((log) => {
        return !LOG_BLACKLIST.some((entry) => {
            return log.logger.trim().indexOf(entry.logger) === 0 &&
                log.message.trim().indexOf(entry.message) === 0;
        });
    });
}

export function queryBlacklist(queries) {
    if (!queries) {
        return [];
    }

    return queries.filter((query) => {
        return !QUERY_BLACKLIST.some((entry) => query.query.indexOf(entry) === 0);
    });
}
