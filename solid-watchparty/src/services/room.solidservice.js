/* NOTE(Elias): Library imports */
import {
	createSolidDataset,
	getSolidDataset,
  saveSolidDatasetAt,
  addStringNoLocale,
  setThing,
  getThing,
  getThingAll,
  createThing,
  buildThing,
	asUrl,
} from '@inrupt/solid-client';
import {
	LDP,
	RDF
} from "@inrupt/vocab-common-rdf";

/* NOTE(Elias): Util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';
import { getPodUrl, urlify } from '../utils/urlUtils';
import { doesResourceExist, inSession } from '../utils/solidUtils';

/* NOTE(Elias): Config imports */
import { ROOMS_ROOT, MESSAGES_ROOT } from '../config.js'


class
RoomSolidService
{

	async createNewRoom(session, name)
	{
		if (!inSession(session)) {
			return { interrupt: "invalid session", interruptMsg: "The session has ended, log in again" };
		}

		const now = new Date();
		const newRoom = buildThing(buildThing())
			.addUrl(RDF.type, SCHEMA_ORG + 'EventSeries')
			.addStringNoLocale(SCHEMA_ORG + 'description', "Solid Watchparty")
			.addStringNoLocale(SCHEMA_ORG + 'name', name)
      .addUrl(SCHEMA_ORG + 'organizer', session.info.webId)
			.addDatetime(SCHEMA_ORG + 'startDate', now)
			.build();
		const dataset = setThing(createSolidDataset(), newRoom);
		const roomUrl = `${getPodUrl(session.info.webId)}/${ROOMS_ROOT}/${urlify(name + now.toISOString())}`;

		/* TODO(Elias): Possibly give the user the ability to give a path, what would be cool is some kind of finder that
		 * would open or a settings page */
		try {
			const savedDataset = await saveSolidDatasetAt(roomUrl, dataset);
			return { roomUrl: asUrl(newRoom, roomUrl) };
		} catch (error) {
			console.error('Error creating new room: ', error)
			return { error: error, errorMsg: 'error creating new room'};
		}
	}

	async joinRoom(session, roomUrl)
	{
		if (!inSession(session)) {
			return { interrupt: "invalid session", interruptMsg: "The session has ended, log in again" }
		} else if (!roomUrl) {
			return { interrupt: "no url", interruptMsg: "No url was provided" }
		}

		const outboxUrl = `${getPodUrl(session.info.webId)}/${MESSAGES_ROOT}/MSG${urlify(roomUrl)}`;
		const doesExist = await doesResourceExist(outboxUrl);
		if (doesExist.exists === true) {
			return {result: roomUrl};
		}

		const newOutbox = buildThing(createThing())
			.addUrl(RDF.type, SCHEMA_ORG + 'CreativeWorkSeries')
			.addUrl(SCHEMA_ORG + 'about', roomUrl)
			.addUrl(SCHEMA_ORG + 'creator', session.info.webId)
			.build()

		try {
			const savedOutbox = await saveSolidDatasetAt(outboxUrl, setThing(createSolidDataset(), newOutbox));
			/* TODO(Elias): Add validations */
			const roomDataset = await getSolidDataset(roomUrl);
			const room = buildThing(getThingAll(roomDataset)[0])
				.addUrl(SCHEMA_ORG + 'attendee', session.info.webId)
				.addUrl(SCHEMA_ORG + 'subjectOf', asUrl(newOutbox, outboxUrl))
				.build();
			await saveSolidDatasetAt(roomUrl, setThing(roomDataset, room));
			return { roomUrl: asUrl(room, roomUrl) };
		} catch (error) {
			console.error('Error joining room: ', error)
			return { error: error, errorMsg: 'Failed to join the room, make sure you have the correct url'};
		}
	}
}

export default new RoomSolidService();
