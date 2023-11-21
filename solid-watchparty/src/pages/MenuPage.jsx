/* NOTE(Elias): libary imports */
import {
	useSession,
} from '@inrupt/solid-ui-react';

/* NOTE(Elias): component imports */

const authOptions = {
	clientName:	"solid-watchparty",
};

function MenuPage()
{
	const { session } = useSession();
	console.log('logged in?: ' + session.info.isLoggedIn);

	return (
		<>
			<div className="h-full w-full flex justify-center items-center">
				<div className="w-1/2">
					<h1 className="sw-fs-2 font-bold mb-5">Menu</h1>
					<div>
						<h1 className="sw-fs-2 font-bold mb-5">Menu</h1>
						<button className="sw-btn">Create room</button>
					</div>
					<form>
						<h1 className="sw-fs-2 font-bold mb-5">Menu</h1>
						<button className="sw-btn">Create room</button>
					</form>
				</div>
			</div>
    </>
  )
}


export default MenuPage;
