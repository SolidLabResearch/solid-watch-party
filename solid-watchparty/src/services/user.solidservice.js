/* library imports */
import { QueryEngine } from '@comunica/query-sparql';

/* util imports */
import { inSession } from '../utils/solidUtils';

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
                PREFIX schema: <http://xmlns.com/foaf/0.1/>
                SELECT ?name
                WHERE {
                    <${webId}> schema:name ?name .
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

}

export default new UserSolidService();






