/* NOTE(Elias): libary imports */
import { useState } from 'react';
import {
	LoginButton,
} from '@inrupt/solid-ui-react';

/* NOTE(Elias): component imports */
import SWLoginButton from '../components/SWLoginButton'

const authOptions = {
	clientName:	"solid-watchparty",
};

function LoginPage()
{
	const [oidcIssuer, setOidcIssuer] = useState(
			"http://localhost:3000/");

	return (
		<>
				<div className="h-full w-full flex justify-center items-center">
						<form className="w-1/2">
							<h1 className="sw-fs-2 font-bold mb-5">Login</h1>
							<input className="sw-input w-full" type="url" name="oidcIssuerField"
									   value={oidcIssuer} placeholder="oidcIssuer"
										 onChange={(e) => setOidcIssuer(e.target.value)}/>
							<SWLoginButton className="my-4 w-fit"
														 authOptions={authOptions}
														 oidcIssuer={oidcIssuer}
														 redirectUrl={window.location.protocol + '//' + window.location.host + '/menu'}
														 onError={console.error}/>
						</form>
				</div>
    </>
  )
}


export default LoginPage;
