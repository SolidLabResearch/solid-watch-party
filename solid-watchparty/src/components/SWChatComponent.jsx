/* library imports */
import { useState, useEffect, useContext, useRef } from 'react';
import { useSession } from "../hooks/useSession";
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
import Aggregator from "../utils/aggregator.js";


function SWChatComponent({roomUrl, joined}) {
    const [state, setState] = useState({isLoading: true, hasAccess: false});
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const sessionContext = useSession();
    const [messageBox,] = useContext(MessageBoxContext);
    const [userNames, setUserNames] = useState({});
    const aggregator = useRef(new Aggregator());
    const pollRef = useRef(null);
    const readinessRef = useRef(null);
    const chainInitRef = useRef(false);
    const resolvedSendersRef = useRef(new Set());

    // Track all active streams so we can always cancel them
    const streamsRef = useRef({
        series: null,                // stream of message series for the room
        creators: new Map(),         // per-series creator lookup streams
        authChecks: new Map(),       // per-series temporary auth check streams
        messages: new Map(),         // per-series message streams
    });
    const destroyStream = (s) => {
        try { s?.destroy?.(); } catch {}
        try { s?.close?.(); } catch {}
        try { s?.removeAllListeners?.(); } catch {}
    };
    const clearAllStreams = () => {
        destroyStream(streamsRef.current.series);
        streamsRef.current.series = null;
        for (const s of streamsRef.current.creators.values()) destroyStream(s);
        streamsRef.current.creators.clear();
        for (const s of streamsRef.current.authChecks.values()) destroyStream(s);
        streamsRef.current.authChecks.clear();
        for (const s of streamsRef.current.messages.values()) destroyStream(s);
        streamsRef.current.messages.clear();
    };

    useEffect(() => {
        // Clean up any existing streams/intervals before starting new ones
        clearAllStreams();
        if (pollRef.current) { try { clearInterval(pollRef.current); } catch {} pollRef.current = null; }
        if (readinessRef.current) { try { clearInterval(readinessRef.current); } catch {} readinessRef.current = null; }
        chainInitRef.current = false;
        resolvedSendersRef.current.clear();
        setMessages([]);

        const fetch = async () => {
            if (sessionContext.aggregatorEnabled) {
                // Ensure any legacy query-engine streams are terminated before starting polling
                clearAllStreams();

                const pollOnce = async () => {
                    try {
                        const res = await aggregator.current.getMessageService(sessionContext, roomUrl);
                        const rows = res?.results?.bindings || [];
                        if (!rows.length) return;

                        const polledMessages = rows.map(r => {
                            const messageBoxUrl = r?.messageBoxUrl?.value || '';
                            const dateSent = r?.dateSent?.value || '';
                            const sender = r?.sender?.value || '';
                            const text = r?.text?.value || '';
                            return {
                                text,
                                messageBoxUrl,
                                date: new Date(dateSent),
                                key: `${sender}${dateSent}`,
                                senderWebId: sender,
                            };
                        }).filter(m => m.messageBoxUrl && m.date instanceof Date && !isNaN(m.date));

                        if (!polledMessages.length) return;

                        setMessages(prev => (
                            [...prev, ...polledMessages]
                                .sort((m1, m2) => (m1.date > m2.date) ? 1 : ((m1.date < m2.date) ? -1 :  0))
                                .filter((m, i, self) => i === self.findIndex((t) => (t.key === m.key)))
                        ));

                        // Resolve sender names (by WebID) from aggregator results, avoiding duplicate lookups
                        const senders = Array.from(new Set(polledMessages.map(m => m.senderWebId).filter(Boolean)));
                        for (const senderWebId of senders) {
                            if (!resolvedSendersRef.current.has(senderWebId)) {
                                resolvedSendersRef.current.add(senderWebId);
                                UserSolidService.getName(sessionContext, senderWebId).then((name) => {
                                    if (!name?.error) {
                                        setUserNames((prev) => ({ ...prev, [senderWebId]: name }));
                                    }
                                });
                            }
                        }

                        setState({ isLoading: false, hasAccess: true });
                    } catch (e) {
                        // If a transient error happens during polling, just skip this tick
                    }
                };

                const startPolling = async () => {
                    await pollOnce();
                    if (pollRef.current) { try { clearInterval(pollRef.current); } catch {} }
                    pollRef.current = setInterval(pollOnce, 1000);
                };

                // Only start polling once the aggregator chain is ready
                try {
                    const ready = await aggregator.current.isMessageServiceReady(sessionContext, roomUrl);
                    if (ready) {
                        await startPolling();
                        return;
                    }
                    // Not ready yet; ensure the chain creation is kicked off only once
                    if (!chainInitRef.current) {
                        chainInitRef.current = true;
                        aggregator.current.createMessageChainInBackground(sessionContext, roomUrl);
                    }
                    // Check readiness every second; when ready, begin polling
                    if (readinessRef.current) { try { clearInterval(readinessRef.current); } catch {} }
                    readinessRef.current = setInterval(async () => {
                        const r = await aggregator.current.isMessageServiceReady(sessionContext, roomUrl);
                        if (r) {
                            try { clearInterval(readinessRef.current); } catch {}
                            readinessRef.current = null;
                            await startPolling();
                        }
                    }, 1000);
                } catch (e) {
                    // If readiness check fails, try again next effect tick
                }

                // Skip streams when using aggregator polling
                return; // skip legacy streaming path entirely
            }

            // Streaming fallback
            let messageSeriesStreams = await MessageSolidService.getMessageSeriesStream(sessionContext, roomUrl);
            if (messageSeriesStreams?.error) {
                console.error(messageSeriesStreams.error)
                messageSeriesStreams = null;
                setState({isLoading: false, hasAccess: false});
                return;
            }
            streamsRef.current.series = messageSeriesStreams;

            messageSeriesStreams.on('data', async (data) => {
                const messageSeries = data.get('messageSeries').value;

                // Creator name stream per series
                let creatorUrlStream = await MessageSolidService.getMessageSeriesCreatorStream(sessionContext, messageSeries);
                if (creatorUrlStream && !creatorUrlStream.error) {
                    streamsRef.current.creators.set(messageSeries, creatorUrlStream);
                    creatorUrlStream.on('data', (data) => {
                        const creatorUrl = data?.get('creator')?.value;
                        UserSolidService.getName(sessionContext, creatorUrl).then((name) => {
                            if (!name?.error) {
                                setUserNames((userNames) => ({ ...userNames, [messageSeries]: name }));
                            }
                        });
                    });
                }

                // Temporary auth check stream (closed on first data)
                let messageStreamAuthCheck = await MessageSolidService.getMessageStream(sessionContext, messageSeries);
                if (messageStreamAuthCheck && !messageStreamAuthCheck.error) {
                    streamsRef.current.authChecks.set(messageSeries, messageStreamAuthCheck);
                    messageStreamAuthCheck.on('data', async () => {
                        try { messageStreamAuthCheck.close?.(); } catch {}
                        try { messageStreamAuthCheck.destroy?.(); } catch {}
                        streamsRef.current.authChecks.delete(messageSeries);
                    });
                }

                // Main message stream per series
                let messageStream = await MessageSolidService.getMessageStream(sessionContext, messageSeries);
                if (!messageStream || messageStream.error) {
                    return;
                }
                streamsRef.current.messages.set(messageSeries, messageStream);
                messageStream.on('data', async (data) => {
                    const senderWebIdVal = data.get('sender')?.value || '';
                    const message = {
                        text:           data.get('text').value,
                        messageBoxUrl:  messageSeries,
                        date:           new Date(data.get('dateSent').value),
                        key:            senderWebIdVal + data.get('dateSent').value,
                        senderWebId:    senderWebIdVal,
                    };
                    setMessages(messages => (
                        [...messages, message]
                        .sort((m1, m2) => (m1.date > m2.date) ? 1 : ((m1.date < m2.date) ? -1 :  0))
                        .filter((m, i, self) => i === self.findIndex((t) => (t.key === m.key)))
                    ));

                    // Resolve sender name on-the-fly for streaming path as well
                    if (senderWebIdVal && !resolvedSendersRef.current.has(senderWebIdVal)) {
                        resolvedSendersRef.current.add(senderWebIdVal);
                        UserSolidService.getName(sessionContext, senderWebIdVal).then((name) => {
                            if (!name?.error) {
                                setUserNames((prev) => ({ ...prev, [senderWebIdVal]: name }));
                            }
                        });
                    }
                });
            });
            setState({isLoading: false, hasAccess: true});
        }
        fetch();

        return () => {
            clearAllStreams();
            if (pollRef.current) { try { clearInterval(pollRef.current); } catch {} pollRef.current = null; }
            if (readinessRef.current) { try { clearInterval(readinessRef.current); } catch {} readinessRef.current = null; }
        };
    }, [sessionContext.session, sessionContext.sessionRequestInProgress, sessionContext.aggregatorEnabled, roomUrl, joined])


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

    let pageContent = <div></div>
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
                <SWAutoScrollDiv className="flex-1 min-h-0 overflow-y-auto overflow-x-auto mb-2">
                    {messages.map((message) => {
                        const sender = userNames[message.senderWebId] ?? userNames[message.messageBoxUrl];
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
        <>
            {pageContent}
        </>
    );
}

SWChatComponent.propTypes = {
    roomUrl:  PropTypes.string,
    joined:   PropTypes.bool,
}

export default SWChatComponent;
