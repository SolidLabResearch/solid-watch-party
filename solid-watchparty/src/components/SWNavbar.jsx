import {
  LoginButton,
  Text,
  useSession,
  CombinedDataProvider,
} from "@inrupt/solid-ui-react";

import Logo from '../assets/watchparty.png'

function SWNavbar()
{
	const { session } = useSession();

	if (session.info.isLoggedIn) {
		/* TODO(Elias): Change <Text ... > to custom services after they have been written */
		return (
			<div className="w-full flex justify-between p-8 grow-0">
				<div className="basis-1/4">
					{session.info.isLoggedIn ? (
							<div>
								<label className="">User: </label>
								<CombinedDataProvider
									datasetUrl={session.info.webId}
									thingUrl={session.info.webId}
								>
									<Text className="sw-fw-1" properties={[
											"http://www.w3.org/2006/vcard/ns#fn",
											"http://xmlns.com/foaf/0.1/name",
										]} />
								</CombinedDataProvider>
						</div>
					) : (
							<p className="rgb-alert font-bold">Failed to authenticate!</p>
					)}
				</div>
				<div className="flex font-bold items-center">
					<img className="mr-2" src={Logo} width="36px"/>
					<p>Watchparty</p>
				</div>
				<label className="font-bold basis-1/4 text-right">solid-watchparty</label>
			</div>
		);
	} else {
		/* TODO(Elias): make an alternative header for the not logged in pages */
		return (
				<div className="w-full flex justify-center p-8">
					<div className="flex font-bold items-center">
						<img className="mr-2" src={Logo} width="36px"/>
						<p>Watchparty</p>
					</div>
				</div>
		);
	}

	return <></>
}

export default SWNavbar;
