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
} from '@inrupt/solid-client';

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

		/* TODO(Elias): Add a type, so agents know what this is */
		const newRoom = buildThing(buildThing())
			.addStringNoLocale(SCHEMA_ORG + 'name', name)
			.addDatetime(SCHEMA_ORG + 'dateCreated', now)
      .addUrl(SCHEMA_ORG + 'creator', session.info.webId)
      .addUrl(SCHEMA_ORG + 'participant', session.info.webId)
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
					.addUrl(SCHEMA_ORG + 'participant', session.info.webId)
					.build();

				const savedDataset = await saveSolidDatasetAt(roomUrl, setThing(dataset, updatedRoom));
				console.log('joined room: ', roomUrl);
				return savedDataset
		} catch (error) {
			console.error('Error joining room: ', error)
			return { error: error, errorMsg: 'Failed to join the room, make sure you have the correct url'};
		}
	}

	async sendMessage(session, message, roomUrl)
	{
		if (!session || !session.info || !session.info.isLoggedIn) {
			console.log("Interrupt: invalid user session");
			return { interrupt: "invalid session", interruptMsg: "The session has ended, log in again" };
		}

		const now = new Date();

		/* TODO(Elias): Add a type, so agents know what this is */
		const newMessage = buildThing(createThing())
			.addStringNoLocale(SCHEMA_ORG + 'name', name)
			.addurl(SCHEMA_ORG + 'isPartOf', roomurl)
			.addUrl(SCHEMA_ORG + 'sender', session.info.webId)
			.addUrl(SCHEMA_ORG + 'dateSent', now)
		const dataset = setThing(createSolidDataset(), newMessage);

		/* TODO(Elias): Possibly give the user the ability to give a path, what would be cool is some kind of finder that
		 * would open */
		// const datasetUrl = `${getPodUrl(session.info.webId)}/${MESSAGES_ROOT}/${urlify(name + now.toISOString())}`
	}

}

export default new RoomSolidService();
