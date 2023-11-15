import {
  LoginButton,
  Text,
  useSession,
  CombinedDataProvider,
} from "@inrupt/solid-ui-react";

function MessageComponent({me, msg}) {
	return (
			<div className="pb-2 flex">
				<div className="w-8 h-8 mr-3 flex justify-center items-center">
				 SQ
				</div>
				<div className="pb-2">
					<div className="w-fit w-max flex items-baseline">
						<p className="font-bold rgb-1 mr-2">{msg.person}</p>
						<p className="rgb-2 text-sm">{msg.time}</p>
					</div>
					<div className="rgb-1 w-fit w-max">
						<p>{msg.message}</p>
					</div>
				</div>
			</div>
		);
}

function HomePage() {
	const { session } = useSession();
	console.log(session.info)

	////////////////////////////////////////////////////////////////////////////////////////////////
	/* NOTE(Elias): This is for testing purposes!! */
	const messages = [
		{ time: "15:30:45", person: "Bob bobber", message: "Hi!" },
		{ time: "15:30:45", person: "B.O.B.", message: "Hello!" },
		{ time: "15:30:45", person: "Bob bobber", message: "This is the final message!" },
		{ time: "15:30:45", person: "Bob bobber", message: "Hi!" },
		{ time: "15:30:45", person: "Bob bobber", message: "Hi!" },
		{ time: "15:30:45", person: "Bob bobber", message: "Hi!" },
		{ time: "15:30:45", person: "Bob bobber", message: "Hi!" },
		{ time: "15:30:45", person: "B.O.B.", message: "Hello!" },
		{ time: "15:30:45", person: "Bob bobber", message: "This is the final message!" },
		{ time: "15:30:45", person: "B.O.B.", message: "Hello!" },
		{ time: "15:30:45", person: "Bob bobber", message: "This is the final message!" },
		{ time: "15:30:45", person: "B.O.B.", message: "Hello!" },
		{ time: "15:30:45", person: "Bob bobber", message: "This is the final message!" },
		{ time: "15:30:45", person: "B.O.B.", message: "Hello!" },
		{ time: "15:30:45", person: "Bob bobber", message: "This is the final message!" },
		{ time: "15:30:45", person: "Bob bobber", message: "Hi!" },
		{ time: "15:30:45", person: "B.O.B.", message: "Hello!" },
		{ time: "15:30:45", person: "Bob bobber", message: "This is the final message!" },
	]
	const myName = "Bob bobber";
	////////////////////////////////////////////////////////////////////////////////////////////////

 // TODO(Elias): Change <Text ... > to custom services after they have been written

	return (
		<div className="w-full h-full p-8">
			<div className="w-full flex justify-between mb-10">
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
			<div className="flex h-3/4">
				<div className="w-2/3 sw-border mr-2 h-full rgb-bg-2 flex justify-center items-center">
					<p>The video player is not implemented at the moment. 😔</p>
				</div>
				<div className="w-1/3 rgb-bg-2 sw-border h-full p-3 flex flex-col justify-between mb-2">
					<div className="overflow-auto">
						{messages.map((msg) => <MessageComponent msg={myName, msg}/>)}
					</div>
					<div className="flex flex-between items-center">
						<input className="px-2 h-9 rgb-bg-1 sw-border w-full"></input>
						<button className="btn ml-1 rgb-bg-3 rgb-3 w-9 h-9 sw-border flex justify-center items-center font-bold">></button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default HomePage;
