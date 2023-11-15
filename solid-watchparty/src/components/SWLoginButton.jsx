/* NOTE(Elias): libary imports */
import { LoginButton } from '@inrupt/solid-ui-react';

function SWLoginButton(props)
{
	return (
		<div className={"sw-btn rgb-bg-3 rgb-3" + ' ' + props.className}>
			<LoginButton authOptions={props.authOptions}
									 oidcIssuer={props.oidcIssuer}
									 redirectUrl={props.redirectUrl}
									 onError={console.error}/>
		</div>
	);
}

export default SWLoginButton;
