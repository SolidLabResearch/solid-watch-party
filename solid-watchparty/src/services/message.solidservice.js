/* library imports */
import {
    getSolidDataset,
    saveSolidDatasetAt,
    createSolidDataset,
    setThing,
    getThingAll,
    getStringNoLocale,
    getThing,
    createThing,
    buildThing,
    asUrl,
    getUrlAll,
    getUrl,
} from '@inrupt/solid-client';
import { RDF } from "@inrupt/vocab-common-rdf";
import { QueryEngine } from '@incremunica/query-sparql-incremental';

/* util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';
import { getPodUrl, urlify } from '../utils/urlUtils';
import { inSession } from '../utils/solidUtils';

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
        try {
            const file = `${getPodUrl(sessionContext.session.info.webId)}/${MESSAGES_ROOT}/MSG${urlify(roomUrl)}`
            const id = `outbox`;
            const query = `
                PREFIX schema: <${SCHEMA_ORG}>
                INSERT DATA {
                    <${file}#${id}> a schema:CreativeWorkSeries .
                    <${file}#${id}> schema:about <${roomUrl}> .
                    <${file}#${id}> schema:creator <${sessionContext.session.info.webId}> .
                }`;
            const result = await sessionContext.fetch(file, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/sparql-update',
                },
                body: query,
            });
            console.log(result)
            return { result: result, messageboxUrl: `${file}#${id}` };
        } catch (error) {
            console.error(error)
            return { error: error, errorMsg: 'failed to create messageBox'};
        }
    }

    async createMessage(sessionContext, messageLiteral, roomUrl)
    {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again" };
        }

        const messageUrl = `${getPodUrl(sessionContext.session.info.webId)}/${MESSAGES_ROOT}/MSG${urlify(roomUrl)}`;
        const now = new Date();

        try {
            let messagesDataset = await getSolidDataset(messageUrl, { fetch: sessionContext.fetch });
            const messageThings = getThingAll(messagesDataset);

            let outbox = null;
            for (let thing in messageThings) {
                const type = getUrlAll(messageThings[thing], "http://www.w3.org/1999/02/22-rdf-syntax-ns#type")[0];
                if (type === SCHEMA_ORG + 'CreativeWorkSeries') {
                    outbox = messageThings[thing];
                    break;
                }
            }
            if (!outbox) {
                throw { error: "no outbox present" }
            }

            let message = buildThing(createThing())
                .addUrl(RDF.type, SCHEMA_ORG + 'Message')
                .addUrl(SCHEMA_ORG + 'sender', sessionContext.session.info.webId)
                .addUrl(SCHEMA_ORG + 'isPartOf', asUrl(outbox, messageUrl))
                .addDatetime(SCHEMA_ORG + 'dateSent', now)
                .addStringNoLocale(SCHEMA_ORG + 'text', messageLiteral)
                .build();
            messagesDataset = setThing(messagesDataset, message);

            outbox = buildThing(outbox)
                .addUrl(SCHEMA_ORG + 'hasPart', asUrl(message, messageUrl))
                .build();
            messagesDataset = setThing(messagesDataset, outbox);

            const savedDataset = await saveSolidDatasetAt(messageUrl, messagesDataset, { fetch: sessionContext.fetch })
            return savedDataset
        } catch (error) {
            console.error('Error: creating message failed', error)
            return { error: error, errorMsg: 'Failed to send the message'};
        }
    }

    async getMessageSeriesStream(sessionContext, roomUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again" };
        }

        const queryEngine = new QueryEngine();
        const resultStream = await queryEngine.queryBindings(`
        PREFIX schema: <${SCHEMA_ORG}>
        SELECT ?messageSeries
        WHERE {
          ?eventSeries a schema:EventSeries .
          ?eventSeries schema:subjectOf ?messageSeries .
        }`, {
            sources: [roomUrl],
            fetch: sessionContext.fetch
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
        const queryEngine = new QueryEngine();

        const resultStream = await queryEngine.queryBindings(`
            PREFIX schema: <${SCHEMA_ORG}>
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            SELECT ?message ?dateSent ?text ?sender
            WHERE {
              ?message a schema:Message .
              ?outbox schema:hasPart ?message .
              ?message schema:dateSent ?dateSent .
              ?message schema:text ?text .
              ?message schema:sender ?sender .
            }`, {
                sources: [messageBoxUrl],
                fetch: sessionContext.fetch
            });

        resultStream.on("error", (e) => {
            console.error(e);
        });
        return resultStream;
    }

    async getMessageSeriesCreatorName(sessionContext, messageSeriesUrl) {
        try {
            let messagesDataset = await getSolidDataset(messageSeriesUrl, { fetch: sessionContext.fetch });
            const outboxThings = getThingAll(messagesDataset).filter(t =>
                                                                     getUrlAll(t, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type")
                                                                     .includes(SCHEMA_ORG + 'CreativeWorkSeries')
            );
            if (outboxThings.length < 1) {
                throw { error: "no outbox present" }
            }
            const outbox = outboxThings[0];
            const creatorUrl = getUrl(outbox, "http://schema.org/creator");
            let profileDataset = await getSolidDataset(creatorUrl, { fetch: sessionContext.fetch });
            let profileThing = getThing(profileDataset, creatorUrl);
            const name = getStringNoLocale(profileThing, "http://xmlns.com/foaf/0.1/name");
            if (!name) {
                throw { error: "Name not found" };
            }
            return name;
        } catch (error) {
            console.error(error)
            return {error: error}
        }
    }

}

export default new MessageSolidService();
