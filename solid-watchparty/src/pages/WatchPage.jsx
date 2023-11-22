/* NOTE(Elias): Library Imports */
import {
  LoginButton,
  Text,
  useSession,
  CombinedDataProvider,
} from "@inrupt/solid-ui-react";
import { useSearchParams } from 'react-router-dom';

/* NOTE(Elias): Component Imports */
import SWPageWrapper from '../components/SWPageWrapper'


function MessageComponent({me, msg}) {
	return (
			<div className="pb-2 flex">
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

function WatchPage() {
	const { session } = useSession();

	/* TODO(Elias): Add error handling, what if there is no parameter */
	const [searchParams] = useSearchParams();
	const roomUrl = decodeURIComponent(searchParams.get('room'));

	/* TODO(Elias): Prevent spam */
	const submitMessage = (e) => {
		e.preventDefault();

		const message = e.target.msgInput.value;
		if (message === ' ') {
			return;
		}

		console.log(roomUrl, message);

		e.target.msgInput.value = '';
	}

	return (
		<SWPageWrapper>
			<div className="w-full flex h-[512px] px-8">
				<div className="w-full rgb-bg-2 sw-border h-full p-3 flex flex-col justify-between mb-2">
					<div className="overflow-auto">
						{[].map((msg) => <MessageComponent msg={myName, msg}/>)}
					</div>
					<form className="flex flex-between items-center" onSubmit={submitMessage}>
						<input id="msgInput" className="px-2 h-10 rgb-bg-1 sw-border w-full"></input>
						<button className="sw-btn hidden"> P </button>
					</form>
				</div>
			</div>
		</SWPageWrapper>
	);
}

export default WatchPage;
