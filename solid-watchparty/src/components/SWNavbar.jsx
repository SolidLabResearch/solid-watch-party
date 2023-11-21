import {
  LoginButton,
  Text,
  useSession,
  CombinedDataProvider,
} from "@inrupt/solid-ui-react";

function SWNavbar()
{
	const { session } = useSession();

	return (
		<div className="w-full flex justify-between mb-10 p-8">
			{session.info.isLoggedIn ? (
					<div>
						<label className="">User: </label>
						<CombinedDataProvider
							datasetUrl={session.info.webId}
							thingUrl={session.info.webId}
						>
							<Text className="rgb-fg-solid font-bold" properties={[
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
}

export default SWNavbar;
