/* library imports */
import { QueryEngine } from '@comunica/query-sparql';

/* util imports */
import {inSession} from '../utils/solidUtils';
import {sprql_patch} from "../utils/queryUtils.js";

class UserSolidService {

    async getName(sessionContext, webId) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!webId) {
            return { error: "invalid webId", errorMsg: "The webId is invalid." }
        }
        try {
            const queryEngine = new QueryEngine();
            const resultStream = await queryEngine.queryBindings(`
                PREFIX foaf: <http://xmlns.com/foaf/0.1/>
                SELECT ?name
                WHERE {
                    <${webId}> foaf:name ?name .
                }`, {
                    sources: [webId],
                    fetch: sessionContext.fetch
                });
            const resultBindings = await resultStream.toArray();
            if (resultBindings.length === 0) {
                console.error("No name found for the given webId.");
                return { error: "no name found", errorMsg: "No name found for the given webId." }
            }
            return resultBindings[0].get('name').value;
        } catch (error) {
            console.error(error);
            return { error: error }
        }
    }

    async changeName(sessionContext, webId, name) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!webId) {
            return { error: "invalid webId", errorMsg: "The webId is invalid." }
        } else if (!name) {
            return { error: "invalid message box", errorMsg: "The name is invalid" };
        }

        const deleteQuery = `
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            DELETE {
              ?subject foaf:name ?oldName .
            }
            WHERE {
              ?subject foaf:name ?oldName .
            }`;
        try {
            const result = await sprql_patch(sessionContext, webId, deleteQuery);
            if (result.status < 200 || result.status >= 300) {
                console.error(result)
                return;
            }
        } catch (error) {
            console.error(error)
            return;
        }

        const insertQuery = `
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            INSERT DATA {
              <${webId}> foaf:name "${name}" .
            }`;
        try {
            const result = await sprql_patch(sessionContext, webId, insertQuery);
            if (result.status < 200 || result.status >= 300) {
                console.error(result)
            }
        } catch (error) {
            console.error(error)
        }
    }
}

export default new UserSolidService();






