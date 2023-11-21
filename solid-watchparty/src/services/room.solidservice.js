import {
} from '@inrupt/solid-client';

class
RoomSolidService
{

	async createNewRoom(props)
	{
		console.log('creating new room');

		let newRoomThing = createThing({name: "room"})
			.addStringNoLocale(SCHEMA_ORG + 'name');



	}

}

export default new RoomSolidService();
