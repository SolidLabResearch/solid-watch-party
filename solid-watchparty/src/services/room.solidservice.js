/* NOTE(Elias): Library imports */
import {
	createSolidDataset,
  saveSolidDatasetAt,
  addStringNoLocale,
  setThing,
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
			console.log("Interrupt creating new room: invalid session");
			return { interrupt: "invalid session", userMsg: "The session has ended, log in again" };
		}

		const now = new Date();

		const newRoom = buildThing(buildThing({name: name}))
			.addStringNoLocale(SCHEMA_ORG + 'name', name)
			.addDatetime(SCHEMA_ORG + 'dateCreated', now)
      .addUrl('http://schema.org/creator', session.info.webId)
			.build();
		const dataset = setThing(createSolidDataset(), newRoom);
		const datasetUrl = `${getPodUrl(session.info.webId)}/rooms/${urlify(name + now.toISOString())}`

		try {
			const savedDataset = await saveSolidDatasetAt(datasetUrl, dataset)
			return savedDataset
		} catch (error) {
			console.error('Error creating new room: ', error)
			return { error: error, errorMsg: 'Error creating new room'};
		}
	}

}

export default new RoomSolidService();
