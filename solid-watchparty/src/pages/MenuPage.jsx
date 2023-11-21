/* NOTE(Elias): libary imports */
import {
	useSession,
} from '@inrupt/solid-ui-react';

/* NOTE(Elias): component imports */
import SWNavbar from '../components/SWNavbar';

/* NOTE(Elias): service imports */
import RoomSolidService from '../services/room.solidservice.js';

const authOptions = {
	clientName:	"solid-watchparty",
};

function MenuPage()
{
	const { session } = useSession();
	console.log('logged in?: ' + session.info.isLoggedIn);

	return (
		<div className="h-2/3">
			<SWNavbar/>
			<div className="h-full w-full flex justify-center items-center">
				<div className="w-1/2">
					<h1 className="sw-fs-2 font-bold mb-5">Rooms</h1>
					<form className="flex">
						<input className="sw-input w-full"></input>
						<button className="sw-btn w-32 ml-3">Join room</button>
					</form>
					<div className="my-8">
						<p className="sw-fs-4">Or create a new room </p>
						<button className="sw-btn w-32 my-2" onClick={() => RoomSolidService.createNewRoom(session, "new room")}>Create room</button>
					</div>
				</div>
			</div>
    </div>
  )
}


export default MenuPage;
