/* library imports */
import {
    getSolidDataset,
    saveSolidDatasetAt,
    setThing,
    getThingAll,
    getStringNoLocale,
    getThing,
    createThing,
    buildThing,
    asUrl,
    getUrlAll,
    getUrl,
    universalAccess,
} from '@inrupt/solid-client';
import { RDF } from "@inrupt/vocab-common-rdf";
import { QueryEngineBase } from '@comunica/actor-init-query';
import { QueryEngine as QueryEngineLTS } from '@comunica/query-sparql-link-traversal-solid';
import { QueryEngine } from '@comunica/query-sparql';

/* util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils.js';
import { getPodUrl, urlify } from '../utils/urlUtils.js';
import { sprql_patch } from '../utils/queryUtils.js';
import { inSession, removeIdentifier } from '../utils/solidUtils.js';

/* config imports */
import { MESSAGES_ROOT } from '../config.js'


class
MessageSolidService
{
    async createMyMessageBox(sessionContext, roomUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!roomUrl) {
            return { error: "invalid room url", errorMsg: "The room url is invalid." }
        }
        const file = `${getPodUrl(sessionContext.session.info.webId)}/${MESSAGES_ROOT}/MSG${urlify(roomUrl)}`
        const id = `outbox`;
        const query = `
            PREFIX schema: <${SCHEMA_ORG}>
            INSERT DATA {
                <${file}#${id}> a schema:CreativeWorkSeries .
                <${file}#${id}> schema:about <${roomUrl}> .
                <${file}#${id}> schema:creator <${sessionContext.session.info.webId}> .
            }`;
        try {
            const result = await sprql_patch(sessionContext, file, query);
            return { result: result, messageBoxUrl: `${file}#${id}` };
        } catch (error) {
            console.error(error)
            return { error: error, errorMsg: 'failed to create messageBox'};
        }
    }

    /* NOTE(Elias): Only use when CERTAIN the messageBox is present */
    async getMessageBox(sessionContext, roomUrl) {
        const file = `${getPodUrl(sessionContext.session.info.webId)}/${MESSAGES_ROOT}/MSG${urlify(roomUrl)}`
        const id = `outbox`;
        return `${file}#${id}`;
    }

    async createMessage(sessionContext, messageLiteral, roomUrl, messageBoxUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again" };
        } else if (!messageLiteral) {
            return { error: "invalid message", errorMsg: "The message is invalid" };
        } else if (!roomUrl) {
            return { error: "invalid room", errorMsg: "The room is invalid" };
        } else if (!messageBoxUrl) {
            return { error: "invalid message box", errorMsg: "The message box is invalid" };
        }

        const file = removeIdentifier(messageBoxUrl);
        const id = urlify(`${new Date().getTime()}${Math.random()}`);
        const query = `
            PREFIX schema: <${SCHEMA_ORG}>
            PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
            INSERT DATA {
                <${file}#${id}> a schema:Message .
                <${file}#${id}> schema:sender <${sessionContext.session.info.webId}> .
                <${file}#${id}> schema:isPartOf <${messageBoxUrl}> .
                <${file}#${id}> schema:dateSent "${new Date().toISOString()}"^^xsd:dateTime .
                <${file}#${id}> schema:text "${messageLiteral}" .
                <${messageBoxUrl}> schema:hasPart <${file}#${id}> .
            }`;
        try {
            const result = await sprql_patch(sessionContext, file, query);
            if (result.status < 200 || result.status >= 300) {
                console.error(result)
            }
            return { result: result, messageUrl: `${file}#${id}` };
        } catch (error) {
            console.error(error)
            return { error: error, errorMsg: 'failed to create message'};
        }
    }

    async getMessageSeriesStream(sessionContext, roomUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again" };
        }
        const queryEngine = new QueryEngineBase(await (await import('../../engine-config/engine.js')).default());
        const resultStream = await queryEngine.queryBindings(`
        PREFIX schema: <${SCHEMA_ORG}>
        SELECT ?messageSeries
        WHERE {
          ?eventSeries a schema:EventSeries .
          ?eventSeries schema:subjectOf ?messageSeries .
        }`, {
            sources: [roomUrl],
            fetch: sessionContext.fetch,
            lenient: true
        });
        resultStream.on("error", (e) => {
            console.error(e);
        });
        return resultStream;
    }

    async getMessageStream(sessionContext, messageBoxUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "The session has ended, log in again" };
        }
        const queryEngine = new QueryEngineBase(await (await import('../../engine-config/engine.js')).default());
        const resultStream = await queryEngine.queryBindings(`
            PREFIX schema: <${SCHEMA_ORG}>
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            SELECT ?message ?dateSent ?text ?sender
            WHERE {
              <${messageBoxUrl}> schema:hasPart ?message .
              ?message a schema:Message .
              ?message schema:dateSent ?dateSent .
              ?message schema:text ?text .
              ?message schema:sender ?sender .
            }`, {
                sources: [messageBoxUrl],
                fetch: sessionContext.fetch,
                lenient: true
            });
        resultStream.on("error", (e) => {
            console.error(e);
        });
        return resultStream;
    }

    async getMessageSeriesCreatorStream(sessionContext, messageSeriesUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "The session has ended, log in again" };
        } else if (!messageSeriesUrl) {
            return { error: "invalid message series", errorMsg: "The message series is invalid" };
        }
        const queryEngine = new QueryEngineBase(await (await import('../../engine-config/engine.js')).default());
        const resultStream = await queryEngine.queryBindings(`
            PREFIX schema: <${SCHEMA_ORG}>
            SELECT ?creator
            WHERE {
              <${messageSeriesUrl}> schema:creator ?creator .
            }`, {
                sources: [messageSeriesUrl],
                fetch: sessionContext.fetch,
                lenient: true
            });
        resultStream.on("error", (e) => {
            console.error(e);
        });
        return resultStream;
    }

    async checkAccess(sessionContext, messageBoxUrl, webId) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "The session has ended, log in again" };
        } else if (!messageBoxUrl) {
            return { error: "invalid message box", errorMsg: "The message box is invalid" };
        } else if (!webId) {
            return { error: "invalid webId", errorMsg: "The webId is invalid" };
        }
        try {
            const accessModes = await universalAccess.getAgentAccess(messageBoxUrl, webId,
                                                                     { fetch: sessionContext.fetch });
            return accessModes;
        } catch (error) {
            console.error(error);
            return { error: error, errorMsg: "Failed to check access" };
        }
    }

    async setAccess(sessionContext, messageBoxUrl, webId, accessModes) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "The session has ended, log in again" };
        } else if (!messageBoxUrl) {
            return { error: "invalid message box", errorMsg: "The message box is invalid" };
        } else if (!webId) {
            return { error: "invalid webId", errorMsg: "The webId is invalid" };
        } else if (!accessModes) {
            return { error: "invalid access modes", errorMsg: "The access modes are invalid" };
        }
        try {
            const result = await universalAccess.setAgentAccess(messageBoxUrl, webId, accessModes,
                                                                { fetch: sessionContext.fetch });
            return result;
        } catch (error) {
            console.error(error);
            return { error: error, errorMsg: "Failed to grant access" };
        }
    }

    async endMessageBox(sessionContext, boxUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" };
        } else if (!boxUrl) {
            return { error: "invalid box url", errorMsg: "The box url is invalid!" };
        }

        const file = boxUrl;
        const query = `
            PREFIX schema: <${SCHEMA_ORG}>
            PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
            INSERT DATA {
                <${boxUrl}> schema:endDate "${new Date().toISOString()}"^^xsd:dateTime .
            }
        `;
        try {
            const result = await sprql_patch(sessionContext, file, query);
            if (result.status < 200 || result.status >= 300) {
                console.error(result)
                return { error: result.statusText, errorMsg: 'failed to end room'};
            }
            return { success: true };
        } catch (error) {
            console.error(error);
            return { error: error, errorMsg: 'failed to delete room'};
        }
    }

    async getMessageBoxesStream(sessionContext) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        }
        const sourceDir = `${getPodUrl(sessionContext.session.info.webId)}/${MESSAGES_ROOT}/`;
        const queryEngine = new QueryEngineLTS();
        try {
            const messageBoxStream = await queryEngine.queryBindings(`
                PREFIX schema: <${SCHEMA_ORG}>
                SELECT ?roomUrl ?messageBox ?endDate
                WHERE {
                    ?messageBox a schema:CreativeWorkSeries .
                    ?messageBox schema:about ?roomUrl.
                    OPTIONAL { ?messageBox schema:endDate ?endDate . }
                }`, {
                    lenient: true,
                    sources: [sourceDir],
                    fetch: sessionContext.fetch,
                });
            return messageBoxStream;
        } catch (error) {
            console.error(error);
            return { error: error, errorMsg: 'failed to get message boxes stream'};
        }
    }

}

export default new MessageSolidService();
