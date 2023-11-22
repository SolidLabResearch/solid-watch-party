import {
  LoginButton,
  Text,
  useSession,
  CombinedDataProvider,
} from "@inrupt/solid-ui-react";

function SWNavbar()
{
	const { session } = useSession();

	if (session.info.isLoggedIn) {
		return (
			<div className="w-full flex justify-between p-8 grow-0">
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
				<label className="font-bold">solid-watchparty</label>
			</div>
		);
	} else {
		/* TODO(Elias): make an alternative header for the not logged in pages */
		return (<></>);
	}

	return <></>
}

export default SWNavbar;
