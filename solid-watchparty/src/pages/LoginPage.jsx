/* NOTE(Elias): libary imports */
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

	return (
		<>
      <div>
      	<h1 className="sw-fs-1">solid-watchparty</h1>
				<LoginButton authOptions={authOptions}
										 redirectUrl={'./home'}
										 ooidcIssuer="https://broker.pod.inrupt.com"
				/>
      </div>
    </>
  )
}


export default LoginPage;
