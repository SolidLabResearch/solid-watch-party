/* library imports */
import {
  getSolidDataset,
  saveSolidDatasetAt,
  setThing,
  getThingAll,
  createThing,
  buildThing,
  asUrl,
  getUrlAll
} from '@inrupt/solid-client';
import { RDF } from "@inrupt/vocab-common-rdf";
import { QueryEngine } from '@incremunica/query-sparql-incremental';

/* util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';
import { getPodUrl, urlify } from '../utils/urlUtils';
import { doesResourceExist, inSession } from '../utils/solidUtils';

/* config imports */
import { MESSAGES_ROOT } from '../config.js'


class
MessageSolidService
{
  async createMessage(session, messageLiteral, roomUrl)
  {
    if (!inSession(session)) {
      return { error: "invalid session", errorMsg: "Your session is invalid, log in again" };
    }

    const messageUrl = `${getPodUrl(session.info.webId)}/${MESSAGES_ROOT}/MSG${urlify(roomUrl)}`;
    const now = new Date();

    const doesExist = await doesResourceExist(messageUrl);
    if (!doesExist) {
      return { error: "outbox does not exist", errorMsg: "You are not registered with this watchparty" };
    }

    try {
      let messagesDataset = await getSolidDataset(messageUrl);
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
        .addUrl(SCHEMA_ORG + 'sender', session.info.webId)
        .addUrl(SCHEMA_ORG + 'isPartOf', asUrl(outbox, messageUrl))
        .addDatetime(SCHEMA_ORG + 'dateSent', now)
        .addStringNoLocale(SCHEMA_ORG + 'text', messageLiteral)
        .build();
      messagesDataset = setThing(messagesDataset, message);

      outbox = buildThing(outbox)
        .addUrl(SCHEMA_ORG + 'hasPart', asUrl(message, messageUrl))
        .build();
      messagesDataset = setThing(messagesDataset, outbox);

      const savedDataset = await saveSolidDatasetAt(messageUrl, messagesDataset)
      return savedDataset
    } catch (error) {
      console.error('Error: creating message failed', error)
      return { error: error, errorMsg: 'Failed to send the message'};
    }
  }

  async getMessageSeriesStream(session, roomUrl) {
    if (!inSession(session)) {
      return { error: "invalid session", errorMsg: "Your session is invalid, log in again" };
    }

    const query =`
PREFIX schema: <${SCHEMA_ORG}>
SELECT ?messageSeries
WHERE {
  ?eventSeries a schema:EventSeries .
  ?eventSeries schema:subjectOf ?messageSeries .
}`;

    const queryEngine = new QueryEngine();
    const resultStream = await queryEngine.queryBindings(query, { sources: [roomUrl] });
    return resultStream;
  }

  async getMessageStream(session, messageBoxUrl) {
    if (!inSession(session)) {
      return { error: "invalid session", errorMsg: "The session has ended, log in again" };
    }

    const sparqlQuery = `
PREFIX schema: <${SCHEMA_ORG}>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
SELECT ?message ?dateSent ?text ?sender
WHERE {
  ?message a schema:Message .
  ?outbox schema:hasPart ?message .
  ?message schema:dateSent ?dateSent .
  ?message schema:text ?text .
  ?message schema:sender ?sender .
}
`;

    const queryEngine = new QueryEngine();
    const resultStream = await queryEngine.queryBindings(sparqlQuery, { sources: [messageBoxUrl] });
    return resultStream;
  }

}

export default new MessageSolidService();
