import { useState, useEffect, useRef } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import { useSearchParams } from 'react-router-dom';

/* component Imports */
import SWMessageComponent from '../components/SWMessageComponent'
import SWAutoScrollDiv from '../components/SWAutoScrollDiv';
import SWLoadingIcon from '../components/SWLoadingIcon';

/* service Imports */
import RoomSolidService from '../services/room.solidservice.js';
import MessageSolidService from '../services/message.solidservice.js'

/* util Imports */
import { parseMessage } from '../utils/messageParser.js';

export default function SWChatComponent({roomUrl}) {
  const [state, setState] = useState({isLoading: false, hasAccess: false, messageSeriesStreams: null});
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const {session} = useSession();

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
    /* TODO(Elias): add return with cleanup of streams */
  }, [session, roomUrl])


  const submitMessage = (e) => {
    e.preventDefault();
    if (input.length === 0) {
      return;
    }
    MessageSolidService.createMessage(session, input, roomUrl);
    setInput('');
  }

  let pageContent = <div/>
  if (state.isLoading) {
    pageContent = (
      <div className="w-full h-full flex justify-center items-center">
          <div className="flex flex-col items-center">
            <SWLoadingIcon className="w-6 h-6 mb-3"/>
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
  }

  return (
    <div className="w-1/3 rgb-bg-2 sw-border p-3 flex flex-col justify-between">
      <SWAutoScrollDiv className="overflow-y-auto overflow-x-auto mb-2 shrink">
        {messages.map((message) => <SWMessageComponent message={message} key={message.key}/>)}
      </SWAutoScrollDiv>
      <form className="grow-0 flex flex-between items-center" onSubmit={submitMessage}>
        <input id="msgInput" className="px-2 h-10 rgb-bg-1 sw-border w-full"
               onChange={(e) => setInput(parseMessage(e.target.value))}
               value={input}/>
        <button className="sw-btn hidden"> P </button>
      </form>
    </div>
  );

}
