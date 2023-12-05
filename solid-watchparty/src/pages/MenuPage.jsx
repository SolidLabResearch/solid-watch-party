/* NOTE(Elias): libary imports */
import {
	useSession,
} from '@inrupt/solid-ui-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* NOTE(Elias): component imports */
import SWPageWrapper from '../components/SWPageWrapper';

/* NOTE(Elias): service imports */
import RoomSolidService from '../services/room.solidservice';

/* NOTE(Elias): util imports */
import { doesResourceExist } from '../utils/solidUtils';


/* TODO(Elias): Add isLive functionality */
function
RoomCardComponent({room})
{
	return (
		<div className="mx-1 flex-grow mt-2">
			<div className="sw-card-pressable rgb-bg-2 py-2 px-3 my-1">
				<button className="flex w-full justify-between">
					<p className="text-left sw-fw-1 pr-3">{room.name}</p>
					<p className="sw-fw-3 rgb-2">{room.date.toLocaleString()}</p>
				</button>
				<p className="text-left rgb-2 mt-2">{room.members} Members</p>
			</div>
		</div>
	);
}

function
MenuPage()
{
	const [roomUrl, setRoomUrl] = useState("");

	const { session } = useSession();
	const navigateTo = useNavigate();

	const joinRoomClicked = async (e) => {
		const result = await doesResourceExist(roomUrl);
		if (result.exists) {
			navigateTo('/watch?room=' + encodeURIComponent(roomUrl));
		}
		/* TODO(Elias): Add error handling */
	};

	const createRoomClicked = async (e) => {
		/* TODO(Elias): Add the ability to give a name to the room instead of "new room" */
		/* TODO(Elias): Add a loading icon */
		const result = await RoomSolidService.createNewRoom(session, "new room")

		/* TODO(Elias): Abstract an error/interrupt handler */
		/* TODO(Elias): Add an error component */
		if (result.error || result.interrupt) {
			return;
		}
		navigateTo('/watch?room=' + encodeURIComponent(result.roomUrl));
	};

	/////////////////////////////////////////////////////////////////////////////////////////////
	//// TODO(Elias): This is placeholder data, implement the backend connection

	const pastRooms = [
			{ name: "Action Movie Night",				date: new Date("2023-01-01T19:00:00"), members: 3 },
			{ name: "Romantic Comedy Evening",	date: new Date("2023-02-15T20:30:00"), members: 124 },
			{ name: "Sci-Fi Series Marathon",		date: new Date("2023-03-10T18:00:00"), members: 12 },
			{ name: "Horror Film Fest",					date: new Date("2023-04-05T21:00:00"), members: 1058 },
			{ name: "Documentary Discussions",	date: new Date("2023-05-20T17:45:00"), members: 1 },
	];

	/////////////////////////////////////////////////////////////////////////////////////////////

	/* TODO(Elias): Add pastRooms */
	return (
		<SWPageWrapper className="flex justify-center items-center">
			<div className="w-1/2">
				<h1 className="sw-fs-1 sw-fw-1 mb-5">Rooms</h1>
				<div className="flex">
					<input type="url" name="roomUrlField" className="sw-input w-full" onChange={(e) => setRoomUrl(e.target.value)}
								 placeholder="http://example.com/pod/rooms/new-room2023-11-21t153957921z"/>
					<button className="sw-btn w-32 ml-3" onClick={joinRoomClicked}>Join room</button>
				</div>
				<div className="my-8">
					<p className="sw-fs-4">Or create a new room</p>
					<button className="sw-btn w-32 my-2" onClick={createRoomClicked}>Create room</button>
				</div>
			</div>
		</SWPageWrapper>
  )
}


export default MenuPage;
