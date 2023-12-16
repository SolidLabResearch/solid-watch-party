/* NOTE(Elias): Library Imports */
import {
  useState,
  useEffect,
} from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import { useSearchParams } from 'react-router-dom';

/* NOTE(Elias): Component Imports */
import SWPageWrapper from '../components/SWPageWrapper'
import MessageComponent from '../components/SWMessageComponent'
import SWLoadingIcon from '../components/SWLoadingIcon';

/* NOTE(Elias): Service Imports */
import RoomSolidService from '../services/room.solidservice.js';
import MessageSolidService from '../services/message.solidservice.js'

/* NOTE(Elias): Util Imports */
import { parseMessage } from '../utils/messageParser.js';

function
WatchPage()
{
  const [ state, setState ] = useState({isLoading: false, hasAccess: false, messageSeriesStreams: null});
  const [ input, setInput ] = useState('');
  const [ messages, setMessages ] = useState([]);
  const { session } = useSession();

  /* TODO(Elias): Add error handling, what if there is no parameter */
  const [searchParams] = useSearchParams();
  const roomUrl = decodeURIComponent(searchParams.get('room'));

  useEffect(() => {
    const fetch = async () => {
      setState({isLoading: true, hasAccess: false, messageSeriesStreams: null});
      const result = await RoomSolidService.joinRoom(session, roomUrl)
      if (result.error || result.interrupt) {
        setState({isLoading: false, hasAccess: false, messageSeriesStreams: null});
        return;
      }
      const messageSeriesStreams = await MessageSolidService.getMessageSeriesStream(session, roomUrl);
      if (result.error || result.interrupt) {
        setState({isLoading: false, hasAccess: false, messageSeriesStreams: null});
        return;
      }
      messageSeriesStreams.on('data', async (data) => {
        const messageSeriesUrl = data.get('messageSeries').value
        const messageStream = await MessageSolidService.getMessageStream(session, messageSeriesUrl);
        if (result.error || result.interrupt) {
          return;
        }
        messageStream.on('data', (data) => {
          const message = {
            text:    data.get('text').value,
            sender:  data.get('sender').value,
            date:    new Date(data.get('dateSent').value),
            key:     (data.get('sender') + data.get('dateSent').value),
          };
          setMessages(messages => [...messages, message].sort(
                (m1, m2) => (m1.date > m2.date) ? 1 : ((m1.date < m2.date) ? -1 :  0)));
        })
      })
      setState({isLoading: false, hasAccess: true, messageSeriesStreams: messageSeriesStreams});
    }
    fetch();
  }, [session, roomUrl])

  const submitMessage = (e) => {
    e.preventDefault();
    if (input.length === 0) {
      return;
    }
    MessageSolidService.createMessage(session, input, roomUrl);
    setInput('');
  }

  let pageContent = (<div/>);
  if (state.isLoading) {
    pageContent = (
      <div className="w-full h-full flex justify-center items-center">
          <div className="flex flex-col items-center">
            <SWLoadingIcon className="w-6 h-6 mb-3"/>
            <p className="sw-fw-1">Loading Room...</p>
          </div>
      </div>
    );
  } else if (!state.hasAccess) {
    pageContent = (
      <div className="w-full h-full flex justify-center items-center">
        <p className="rgb-alert sw-fw-1 sw-fs-2">
          You do not have access to this room! <span className="sw-emoji">😢</span>
        </p>
      </div>
    );
  } else {
    pageContent = (
      <div>
        <div className="px-8 py-4 rgb-2">
          <p>{roomUrl}</p>
        </div>
        <div className="w-full flex h-[512px] px-8">
          <div className="w-full rgb-bg-2 sw-border h-full p-3 flex flex-col justify-between mb-2">
            <div className="overflow-auto">
              {messages.map((message) => <MessageComponent message={message} key={message.key}/>)}
            </div>
            <form className="flex flex-between items-center" onSubmit={submitMessage}>
              <input id="msgInput" className="px-2 h-10 rgb-bg-1 sw-border w-full"
                     onChange={(e) => setInput(parseMessage(e.target.value))}
                     value={input}/>
              <button className="sw-btn hidden"> P </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
  return (
    <SWPageWrapper className="h-full" mustBeAuthenticated={true}>
      {pageContent}
    </SWPageWrapper>
  );
}

export default WatchPage;
