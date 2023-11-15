/* NOTE(Elias): libary imports */
import { useState } from 'react';
import {
	LoginButton,
	useSession,
} from '@inrupt/solid-ui-react';

/* NOTE(Elias): component imports */
import SWLoginButton from '../components/SWLoginButton'

const authOptions = {
	clientName:	"solid-watchparty",
};

function LoginPage()
{
	const { session } = useSession();
	console.log('logged in?: ' + session.info.isLoggedIn);

	const [oidcIssuer, setOidcIssuer] = useState(
			"https://broker.pod.inrupt.com/");

	return (
		<>
				<div className="h-full w-full flex justify-center items-center">
						<form className="w-1/2">
							<h1 className="sw-fs-2 font-bold mb-5">Login</h1>
							<input className="sw-input w-full rgb-1" type="text" name="oidcIssuerField"
									   value={oidcIssuer} type="url" placeholder="oidcIssuer"
										 onChange={(e) => setOidcIssuer(e.target.value)}/>
							<SWLoginButton className="my-4"
														 authOptions={authOptions}
														 oidcIssuer={oidcIssuer}
														 redirectUrl={window.location.protocol + '//' + window.location.host + '/home'}
														 onError={console.error}/>
						</form>
				</div>
    </>
  )
}


export default LoginPage;
