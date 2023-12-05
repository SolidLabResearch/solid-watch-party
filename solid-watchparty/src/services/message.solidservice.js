/* NOTE(Elias): Library imports */
import {
	createSolidDataset,
	getSolidDataset,
  saveSolidDatasetAt,
  addStringNoLocale,
  setThing,
  getThingAll,
  createThing,
  buildThing,
	asUrl,
	getUrlAll
} from '@inrupt/solid-client';
import {
	LDP,
	RDF
} from "@inrupt/vocab-common-rdf";
import { QueryEngine } from '@incremunica/query-sparql-incremental';

/* NOTE(Elias): Util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';
import { getPodUrl, urlify } from '../utils/urlUtils';
import { doesResourceExist, inSession } from '../utils/solidUtils';

/* NOTE(Elias): Config imports */
import { ROOMS_ROOT, MESSAGES_ROOT } from '../config.js'


class
MessageSolidService
{

	async createMessage(session, messageLiteral, roomUrl)
	{
		if (!inSession(session)) {
			return { interrupt: "invalid session", interruptMsg: "The session has ended, log in again" };
		}

		/* TODO(Elias): Possibly give the user the ability to give a path, what would be cool is some kind of finder that
		 * would open */
		const messageUrl = `${getPodUrl(session.info.webId)}/${MESSAGES_ROOT}/MSG${urlify(roomUrl)}`;
		const now = new Date();

		const doesExist = await doesResourceExist(messageUrl);
		if (!doesExist) {
			return { error: "outbox does not exist", errorMsg: "You are not registered with this watchparty" };
		}

		try {
			let	messagesDataset = await getSolidDataset(messageUrl);
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

	async getMessageStream(session, roomUrl) {
		if (!inSession(session)) {
			return { interrupt: "invalid session", interruptMsg: "The session has ended, log in again" };
		}

		console.log('asdf')
		const messageUrl = `${getPodUrl(session.info.webId)}/${MESSAGES_ROOT}/MSG${urlify(roomUrl)}`;
		let	messagesDataset = await getSolidDataset(messageUrl);
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

		const sparqlQuery = `
PREFIX schema: <${SCHEMA_ORG}>
SELECT ?message ?dateSent ?text WHERE {
	?message a schema:Message;
	schema:isPartOf <${asUrl(outbox, messageUrl)}>;
	schema:dateSent ?dateSent;
	schema:text ?text.
}
`;

		console.log(sparqlQuery)
		console.log(messageUrl)
		const queryEngine = new QueryEngine();
    const resultStream = await queryEngine.queryBindings(sparqlQuery, { sources: [messageUrl] });
		return;
		console.log('test')

    resultStream.on('data', (data) => {
        console.log('New message:', data);
    });
    resultStream.on('error', (error) => {
        console.error('Error in message stream:', error);
				console.log('ending stream')
				stream.close();
    });
    resultStream.on('end', () => {
        console.log('Message stream ended');
				stream.close();
    });
	}

}

export default new MessageSolidService();
