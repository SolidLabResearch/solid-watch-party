/* NOTE(Elias): libary imports */
import {
	useSession,
} from '@inrupt/solid-ui-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* NOTE(Elias): component imports */
import SWPageWrapper from '../components/SWPageWrapper';

/* NOTE(Elias): service imports */
import RoomSolidService from '../services/room.solidservice.js';

function
RoomCardComponent({room})
{
	return (
		<div className="mx-1 flex-grow">
			<div className="sw-card-pressable rgb-bg-2 py-2 px-3 my-1">
				<button className="flex w-full justify-between">
					<p className="text-left sw-fw-1 pr-3">{room.name}</p>
					<p className="sw-fw-3 rgb-2">{room.date}</p>
				</button>
				<p className="text-left rgb-2 mt-2">3 Members</p>
			</div>
		</div>
	);
}

function
MenuPage()
{
	const { session } = useSession();
	const navigateTo = useNavigate();

	const [roomUrl, setRoomUrl] = useState("");

	const joinRoomClicked = async (e) => {
		/* TODO(Elias): Add the ability to give a name to the room instead of "new room" */
		/* TODO(Elias): Add a loading icon */
		const result = await RoomSolidService.joinRoom(session, roomUrl)

		/* TODO(Elias): Abstract an error/interrupt handler */
		/* TODO(Elias): Add an error component */
		if (result.error || result.interrupt) {
			return;
		}
		navigateTo('/watch?room=' + encodeURIComponent(roomUrl));
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

	const pastRooms = [
	];

	return (
		<SWPageWrapper className="flex justify-center ">
			<div className="w-1/2 mt-28">
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
				<div className="mt-12">
					<hr className="sw-hr"/>
					<h1 className="sw-fs-2 sw-fw-1 mb-5">Past Rooms</h1>
					<div className="flex flex-wrap">
						{ pastRooms.map((r) => <RoomCardComponent room={r}/>) }
					</div>
				</div>
			</div>
		</SWPageWrapper>
  )
}


export default MenuPage;
