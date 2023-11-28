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
} from '@inrupt/solid-client';
import {
	LDP,
	RDF
} from "@inrupt/vocab-common-rdf";

/* NOTE(Elias): Util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';
import { getPodUrl, urlify } from '../utils/urlUtils';

/* NOTE(Elias): Config imports */
import { ROOMS_ROOT, MESSAGES_ROOT } from '../config.js'


class
RoomSolidService
{

	async createNewRoom(session, name)
	{
		if (!session || !session.info || !session.info.isLoggedIn) {
			console.log("Interrupt: invalid user session");
			return { interrupt: "invalid session", interruptMsg: "The session has ended, log in again" };
		}

		const now = new Date();

		const newRoom = buildThing(buildThing())
			.addUrl(RDF.type, SCHEMA_ORG + 'EventSeries')
			.addStringNoLocale(SCHEMA_ORG + 'description', "Solid Watchparty")
			.addStringNoLocale(SCHEMA_ORG + 'name', name)
      .addUrl(SCHEMA_ORG + 'attendee', session.info.webId)
      .addUrl(SCHEMA_ORG + 'organizer', session.info.webId)
			.addDatetime(SCHEMA_ORG + 'startDate', now)
			.build();
		const dataset = setThing(createSolidDataset(), newRoom);

		/* TODO(Elias): Possibly give the user the ability to give a path, what would be cool is some kind of finder that
		 * would open */
		const datasetUrl = `${getPodUrl(session.info.webId)}/${ROOMS_ROOT}/${urlify(name + now.toISOString())}`

		try {
			const savedDataset = await saveSolidDatasetAt(datasetUrl, dataset)
			console.log('created new room at: ' + datasetUrl)
			return savedDataset
		} catch (error) {
			console.error('Error creating new room: ', error)
			return { error: error, errorMsg: 'error creating new room'};
		}
	}

	async joinRoom(session, roomUrl)
	{
		if (!session || !session.info || !session.info.isLoggedIn) {
			console.log("Interrupt: invalid user session");
			return { interrupt: "invalid session", interruptMsg: "The session has ended, log in again" };
		}

		try {
				const dataset = await getSolidDataset(roomUrl);
				const things = getThingAll(dataset);

				if (things.length < 1) {
					console.log("Interrupt: invalid resource");
					return { interrupt: "invalid resource", interruptMsg: "The given room does not exist"};
				}

				/* TODO(Elias): Possibly do some validations instead of assuming that we have a correct room resource */
				const updatedRoom = buildThing(things[0])
					.addUrl(SCHEMA_ORG + 'attendee', session.info.webId)
					.build();

				const savedDataset = await saveSolidDatasetAt(roomUrl, setThing(dataset, updatedRoom));
				console.log('joined room: ', roomUrl);
				return savedDataset;
		} catch (error) {
			console.error('Error joining room: ', error)
			return { error: error, errorMsg: 'Failed to join the room, make sure you have the correct url'};
		}
	}

	async createMessage(session, message, roomUrl)
	{
		if (!session || !session.info || !session.info.isLoggedIn) {
			console.log("Interrupt: invalid user session");
			return { interrupt: "invalid session", interruptMsg: "The session has ended, log in again" };
		}

		const now = new Date();

		/* TODO(Elias): Add a type, so agents know what this is */
		const newMessage = buildThing(createThing())
			.addUrl(RDF.type, SCHEMA_ORG + 'Message')
			.addUrl(SCHEMA_ORG + 'about', roomUrl)
			.addDatetime(SCHEMA_ORG + 'dateSent', now)
			.addUrl(SCHEMA_ORG + 'sender', session.info.webId)
			.addStringNoLocale(SCHEMA_ORG + 'text', message)
			.build();

		/* TODO(Elias): Possibly give the user the ability to give a path, what would be cool is some kind of finder that
		 * would open */
		const datasetUrl = `${getPodUrl(session.info.webId)}/${MESSAGES_ROOT}/messages_${urlify(roomUrl)}`

		try {
			/* NOTE(Elias): Save message to messages file */
			let dataset;
			try {
					dataset = await getSolidDataset(datasetUrl);
			} catch (error) {
					dataset = createSolidDataset();
			}

			dataset = setThing(dataset, newMessage);
			const savedDataset = await saveSolidDatasetAt(datasetUrl, dataset)
			console.log('saved new message at: ' + datasetUrl)

			const newMessageUrl = asUrl(newMessage, datasetUrl);

			/* NOTE(Elias): Update room to contain a reference to the message */
			const roomDataset = await getSolidDataset(roomUrl);
			const roomThings = getThingAll(roomDataset);

			if (roomThings.length < 1) {
				console.log("Interrupt: invalid resource");
				return { interrupt: "invalid resource", interruptMsg: "The given room does not exist"};
			}

			/* TODO(Elias): Possibly do some validations instead of assuming that we have a correct room resource */
			const updatedRoom = buildThing(roomThings[0])
				.addUrl(SCHEMA_ORG + 'subjectOf', newMessageUrl)
				.build();

			const savedRoomDataset = await saveSolidDatasetAt(roomUrl, setThing(roomDataset, updatedRoom));

			return savedDataset
		} catch (error) {
			console.error('Error: creating message failed', error)
			return { error: error, errorMsg: 'Failed to send the message'};
		}
	}

}

export default new RoomSolidService();
