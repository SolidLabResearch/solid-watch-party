/* library imports */
import { useState, useEffect, useContext } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import PropTypes from 'prop-types';

/* component imports */
import SWMessageComponent from '../components/SWMessageComponent'
import SWAutoScrollDiv from '../components/SWAutoScrollDiv';
import SWLoadingIcon from '../components/SWLoadingIcon';

/* context imports */
import { MessageBoxContext } from '../contexts';

/* service imports */
import MessageSolidService from '../services/message.solidservice.js'
import UserSolidService from '../services/user.solidservice.js'

/* util imports */
import { parseMessage } from '../utils/messageParser.js';


function SWChatComponent({roomUrl, joined}) {
    const [state, setState] = useState({isLoading: true, hasAccess: false});
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const sessionContext = useSession();
    const [messageBox,] = useContext(MessageBoxContext);
    const [userNames, setUserNames] = useState({});

    useEffect(() => {
        const fetch = async () => {
            const messageSeriesStreams = await MessageSolidService.getMessageSeriesStream(sessionContext, roomUrl);
            if (messageSeriesStreams.error) {
                console.error(messageSeriesStreams.error)
                messageSeriesStreams = null;
                setState({isLoading: false, hasAccess: false});
                return;
            }
            messageSeriesStreams.on('data', async (data) => {
                const messageSeries = data.get('messageSeries').value;

                let senderName = "Unknown";
                let creatorUrlStream = await MessageSolidService.getMessageSeriesCreatorStream(sessionContext, messageSeries);
                creatorUrlStream.on('data', (data) => {
                    const creatorUrl = data?.get('creator')?.value;
                    UserSolidService.getName(sessionContext, creatorUrl).then((name) => {
                        if (!name.error) {
                            setUserNames((userNames) => {
                                userNames[messageSeries] = name;
                                return userNames;
                            });
                        }
                    });
                });

                // TODO(Elias): Switch out restart of stream when Incremunica has internal handling for this
                let messageStreamAuthCheck = await MessageSolidService.getMessageStream(sessionContext, messageSeries);
                messageStreamAuthCheck.on('data', async (data) => {
                    messageStreamAuthCheck.close();
                });

                let messageStream = await MessageSolidService.getMessageStream(sessionContext, messageSeries);
                if (!messageStream || messageStream.error) {
                    messageStream = null;
                    return;
                }
                messageStream.on('data', async (data) => {
                    const message = {
                        text:           data.get('text').value,
                        messageBoxUrl:  messageSeries,
                        date:           new Date(data.get('dateSent').value),
                        key:            (name + data.get('dateSent').value),
                    };
                    // TODO: Make this more efficient
                    setMessages(messages => (
                        [...messages, message]
                        .sort((m1, m2) => (m1.date > m2.date) ? 1 : ((m1.date < m2.date) ? -1 :  0))
                        .filter((m, i, self) => i === self.findIndex((t) => (t.key === m.key)))
                    ));

                })
            })
            setState({isLoading: false, hasAccess: true});
        }
        fetch();
    }, [sessionContext.session, sessionContext.sessionRequestInProgress, roomUrl, joined])


    const submitMessage = (e) => {
        e.preventDefault();
        if (input.length === 0) {
            return;
        }
        MessageSolidService.createMessage(sessionContext, input, roomUrl, messageBox).then((r) => {
            if (r.error) {
                console.error(r.error);
            }
        })
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
                        {messages.map((message) => {
                            const sender = userNames[message.messageBoxUrl];
                            return (
                                <SWMessageComponent message={{...message, sender}} key={message.key}/>
                            );
                        })}
                    </SWAutoScrollDiv>
                    <form autoComplete="off" className="grow-0 flex flex-between items-center" onSubmit={submitMessage}>
                        <input id="msgInput" className="px-2 h-10 rgb-bg-1 sw-border w-full border-solid"
                            onChange={(e) => setInput(parseMessage(e.target.value))}
                            value={input} type='text'/>
                        <button className="sw-btn hidden"></button>
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
    joined:   PropTypes.bool,
}

export default SWChatComponent;
