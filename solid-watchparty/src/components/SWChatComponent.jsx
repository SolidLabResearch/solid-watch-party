/* library imports */
import { useState, useEffect, } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import PropTypes from 'prop-types';

/* component imports */
import SWMessageComponent from '../components/SWMessageComponent'
import SWAutoScrollDiv from '../components/SWAutoScrollDiv';
import SWLoadingIcon from '../components/SWLoadingIcon';

/* service imports */
import MessageSolidService from '../services/message.solidservice.js'

/* util imports */
import { parseMessage } from '../utils/messageParser.js';


function SWChatComponent({roomUrl, joined}) {
  const [state, setState] = useState({isLoading: true, hasAccess: false});
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const {session, sessionRequestInProgress} = useSession();

  useEffect(() => {
    let messageSeriesStreams = null;
    let messageStreams = [];
    const fetch = async () => {
      messageSeriesStreams = await MessageSolidService.getMessageSeriesStream(session, roomUrl);
      if (messageSeriesStreams.error) {
        console.error(messageSeriesStreams.error)
        messageSeriesStreams = null;
        setState({isLoading: false, hasAccess: false});
        return;
      }
      console.log('NOW LISTENING FOR MESSAGE STREAMS')
      messageSeriesStreams.on('data', async (data) => {
        console.log('NEW MESSAGESTREAM ACQUIRED')
        const messageSeriesUrl = data.get('messageSeries').value;

        let name = await MessageSolidService.getMessageSeriesCreatorName(session, messageSeriesUrl);
        if (name.error) {
          name = "anonymous";
        }

        let messageStream = await MessageSolidService.getMessageStream(session, data.get('messageSeries').value);
        messageStreams.push(messageStream);
        if (messageStream.error) {
          messageStream = null;
          return;
        }
        messageStream.on('data', (data) => {
          const message = {
            text:    data.get('text').value,
            sender:  name,
            date:    new Date(data.get('dateSent').value),
            key:     (data.get('sender') + data.get('dateSent').value),
          };
          setMessages(messages => [...messages, message].sort(
              (m1, m2) => (m1.date > m2.date) ? 1 : ((m1.date < m2.date) ? -1 :  0)));
        })
      })
      setState({isLoading: false, hasAccess: true});
    }
    fetch();

    return (() => {
      // console.log('closing down use effect')
      // console.log('closing stream: ', messageSeriesStreams)
      if (messageSeriesStreams) {
        messageSeriesStreams.close();
      }
      for (let i = 0; i < messageStreams.length; i++) {
        if (messageStreams[i]) {
          messageStreams[i].close()
        }
      }
      setMessages([]);
    });
  }, [session, sessionRequestInProgress, roomUrl, joined])


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
          <p className="rgb-2 sw-fs-2">
          Failed to load chat <span className="sw-emoji">😢</span>
          </p>
          </div>
      );
    } else {
      pageContent = (
          <>
            <SWAutoScrollDiv className="overflow-y-auto overflow-x-auto mb-2 shrink">
              {messages.map((message) => <SWMessageComponent message={message} key={message.key}/>)}
            </SWAutoScrollDiv>
            <form autoComplete="off" className="grow-0 flex flex-between items-center" onSubmit={submitMessage}>
              <input id="msgInput" className="px-2 h-10 rgb-bg-1 sw-border w-full"
                onChange={(e) => setInput(parseMessage(e.target.value))}
                value={input} type='text'/>
              <button className="sw-btn hidden"> P </button>
            </form>
          </>
      );
    }

  return (
      <div className="w-1/3 rgb-bg-2 sw-border p-3 flex flex-col justify-between">
        {pageContent}
      </div>
  );
}

SWChatComponent.propTypes = {
  roomUrl:  PropTypes.string,
}

export default SWChatComponent;
