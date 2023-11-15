/* NOTE(Elias): libary imports */
import { useState } from 'react';
import {
	LoginButton,
	useSession,
} from '@inrupt/solid-ui-react';


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
      <div>
      	<h1 className="sw-fs-1">solid-watchparty</h1>
				<form>
					<input type="text" name="oidcIssuerField" value={oidcIssuer}
								 onChange={(e) => setOidcIssuer(e.target.value)}/>
					<LoginButton authOptions={authOptions}
											 oidcIssuer={oidcIssuer}
											 redirectUrl={window.location.protocol + '//' + window.location.host + '/home'}
											 onError={console.error}/>
				</form>
      </div>
    </>
  )
}


export default LoginPage;
