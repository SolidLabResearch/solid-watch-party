import {
  LoginButton,
  Text,
  useSession,
  CombinedDataProvider,
} from "@inrupt/solid-ui-react";



function HomePage() {
	const { session } = useSession();
	console.log(session.info)
	return (
		<>
			<p>This is the homepage! 🎉</p>
			{session.info.isLoggedIn ? (
					<div>
						<p> You are logged in succesfully :)</p>
				    <CombinedDataProvider
							datasetUrl={session.info.webId}
							thingUrl={session.info.webId}
						>
				    <Text properties={[
                "http://www.w3.org/2006/vcard/ns#fn",
                "http://xmlns.com/foaf/0.1/name",
              ]} />
						        </CombinedDataProvider>
					</div>
			) : (
					<p> Something went wrong :(</p>
			)}
		</>
	);
}

export default HomePage;
