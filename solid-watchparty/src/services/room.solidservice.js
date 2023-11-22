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


class
RoomSolidService
{

	async createNewRoom(session, name)
	{
		if (!session || !session.info || !session.info.isLoggedIn) {
			console.log("Interrupt: invalid user session");
			return { interrupt: "invalid session", userMsg: "The session has ended, log in again" };
		}

		const now = new Date();

		const newRoom = buildThing(buildThing({name: name}))
			.addStringNoLocale(SCHEMA_ORG + 'name', name)
			.addDatetime(SCHEMA_ORG + 'dateCreated', now)
      .addUrl(SCHEMA_ORG + 'creator', session.info.webId)
      .addUrl(SCHEMA_ORG + 'participant', session.info.webId)
			.build();
		const dataset = setThing(createSolidDataset(), newRoom);

		/* TODO(Elias): Abstract this to a config file or something and think about a better url than rooms/ */
		const datasetUrl = `${getPodUrl(session.info.webId)}/rooms/${urlify(name + now.toISOString())}`

		try {
			const savedDataset = await saveSolidDatasetAt(datasetUrl, dataset)
			console.log('created new room at: ' + datasetUrl)
			return savedDataset
		} catch (error) {
			console.error('Error creating new room: ', error)
			return { error: error, errormsg: 'error creating new room'};
		}
	}

	async joinRoom(session, roomUrl)
	{
		if (!session || !session.info || !session.info.isLoggedIn) {
			console.log("Interrupt: invalid user session");
			return { interrupt: "invalid session", userMsg: "The session has ended, log in again" };
		}

		try {
				const dataset = await getSolidDataset(roomUrl);
				const things = getThingAll(dataset);

				if (things.length < 1) {
					console.log("Interrupt: invalid resource");
					return { interrupt: "invalid resource", userMsg: "The given room does not exist"};
				}

				// TODO(Elias): Possibly do some validations instead of assuming that we have a correct room resource
				const updatedRoom = buildThing(things[0])
					.addUrl(SCHEMA_ORG + 'participant', session.info.webId)
					.build();

				await saveSolidDatasetAt(roomUrl, setThing(dataset, updatedRoom));
				console.log('joined room: ', roomUrl);
		} catch (error) {
			console.error('Error joining room: ', error)
			return { error: error, errormsg: 'error joining room'};
		}
	}

}

export default new RoomSolidService();
