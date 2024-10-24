/* library imports */
import { useEffect, useState, useRef, useContext } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { FaUserFriends } from "react-icons/fa";
import { useInterval } from 'usehooks-ts'
import { FaChevronLeft } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";

/* component imports */
import SWPageWrapper from '../components/SWPageWrapper'
import SWChatComponent from '../components/SWChatComponent';
import SWVideoPlayer from '../components/SWVideoPlayer';
import SWLoadingIcon from '../components/SWLoadingIcon';
import StartWatchingEventModal from '../components/StartWatchingEventModal';
import PeopleMenuModal from '../components/PeopleMenuModal';
import SettingsModal from '../components/SettingsModal';

/* service imports */
import RoomSolidService from '../services/room.solidservice.js';
import MessageSolidService from '../services/message.solidservice.js';

/* context imports */
import { MessageBoxContext } from '../contexts';
import { RoomContext } from '../contexts';

/* util imports */
import { inSession } from '../utils/solidUtils';

/* config imports */
import config from '../../config';


async function requestAccess(sessionContext, roomUrl) {
    const messageBoxResult = await MessageSolidService.createMyMessageBox(sessionContext, roomUrl);
    if (!messageBoxResult || messageBoxResult.error) {
        return { error: "create message box error", errorMsg: "Could not create message box!" };
    }
    const registerResult = await RoomSolidService.register(sessionContext, messageBoxResult.messageBoxUrl, roomUrl);
    if (!registerResult || registerResult.error) {
        return { error: "register error", errorMsg: "Could not register to room!" };
    }
    return { success: true };
}

function WatchPage() {
    const iframeRef = useRef(null);

    const [joinState, setJoinState] = useState('loading');

    const [peopleModalIsShown, setPeopleModalIsShown] = useState(false);
    const [settingsModalIsShown, setSettingsModalIsShown] = useState(false);
    const [modalIsShown, setModalIsShown] = useState(false);

    const sessionContext = useSession();
    const [,setMessageBox] = useContext(MessageBoxContext);
    const [room, setRoom] = useState({});

    /* TODO(Elias): Add error handling, what if there is no parameter, or a wrong parameter */
    const [searchParams] = useSearchParams();
    const roomUrl = decodeURIComponent(searchParams.get('roomUrl'));

    const navigateTo = useNavigate();

    useEffect(() => {
        if (joinState !== 'success') {
            return;
        }
        RoomSolidService.getRoomInfo(sessionContext, roomUrl).then((room) => {
            if (room.error) {
                setJoinState('error');
                return;
            };
            setRoom(room);
        });
    }, [roomUrl, sessionContext.session.requestInProgress, sessionContext.session, joinState]);


    useInterval(async () => {
        const result = await RoomSolidService.amIRegistered(sessionContext, roomUrl);
        if (result && !result.error) {
            setJoinState('success');
        }
    }, ((joinState === 'success') ? null : 2 * 1000));

    useEffect(() => {
        if (!inSession(sessionContext) || sessionContext.sessionRequestInProgress || (joinState === 'success')) {
            return;
        }
        RoomSolidService.amIRegistered(sessionContext, roomUrl).then((result) => {
            if (result && !result.error) {
                setJoinState('success');
                return;
            }
            requestAccess(sessionContext, roomUrl).then((access) => {
                setJoinState((access && !access.error) ? 'requested' : 'error');
            });
        });
    }, [sessionContext.sessionRequestInProgress, sessionContext.session, roomUrl, setMessageBox, joinState]);

    useEffect(() => {
        if (!inSession(sessionContext) || sessionContext.sessionRequestInProgress || (joinState !== 'success')) {
            setMessageBox(null);
        }
        MessageSolidService.getMessageBox(sessionContext, roomUrl).then((result) => {
            setMessageBox(result);
        });
    }, [joinState, roomUrl, sessionContext.session, sessionContext.sessionRequestInProgress, setMessageBox]);

    let body = <></>;
    if (joinState != 'success') {
        body = (
            <div className="flex w-full h-full items-center justify-center gap-3">
                {joinState === 'error' && (
                    <p className="sw-fw-1">Joining Room failed... Try again by reloading the page.</p>
                )}
                {joinState === 'loading' && (
                    <div>
                        <div className="flex my-6 gap-3 justify-center items-center">
                            <SWLoadingIcon className="w-8 h-8"/>
                        </div>
                        <p className="sw-fw-1">Requesting access too Room...</p>
                    </div>
                )}
                {joinState === 'requested' && (
                    <p>A join request was sent to the party owner.</p>
                )}
            </div>
        );
    } else {
        body = (<>
            <div className="fixed top-0 left-0 w-full h-full -z-10">
                <img src={room.thumbnailUrl} className="w-full h-full object-cover"/>
                <div className="fixed top-0 left-0 w-full h-full bg-black opacity-50"/>
            </div>
            <div className=" flex justify-between px-8 py-4 gap-6 items-center flex-mobile">
                <div className="flex gap-3">
                    <button className="flex items-center rgb-1 hover:rgb-2 hover:cursor-pointer"
                            onClick={() => navigateTo(`${config.baseDir}/menu`)}>
                        <FaChevronLeft className="w-4 h-4"/>
                        <p className="sw-fw-1 text-center-mobile">Back to menu</p>
                    </button>
                </div>
                <div className="flex gap-3">
                    <p className="sw-fw-1 sw-fs-3 rgb-1">{room.name}</p>
                </div>
                <div className="flex gap-3 justify-end">
                <div className="rgb-2">
                        <button className={`sw-btn sw-btn-1 flex-grow h-6 flex justify-center`}
                                onClick={() => setModalIsShown(true)}>
                            Start new video
                        </button>
                    </div>
                    <button onClick={() => setPeopleModalIsShown(!peopleModalIsShown)}
                            className="sw-btn sw-btn-2 border">
                        <FaUserFriends className="w-6 h-6"/>
                    </button>
                    <button onClick={() => setSettingsModalIsShown(!settingsModalIsShown)}
                            className="sw-btn sw-btn-2 border">
                        <FaGear className="w-6 h-6"/>
                    </button>
                </div>
            </div>
            <div className="w-full flex px-8 gap-4 flex-mobile">
                <div className={`w-2/3 h-fit flex bg-black sw-border width-mobile`} ref={iframeRef}>
                    <SWVideoPlayer roomUrl={roomUrl}/>
                </div>
                <SWChatComponent roomUrl={roomUrl}/>
            </div>
            { settingsModalIsShown && (
                <SettingsModal setModalIsShown={setSettingsModalIsShown} roomUrl={roomUrl}/>
            )}
            { peopleModalIsShown && (
                <PeopleMenuModal setModalIsShown={setPeopleModalIsShown} roomUrl={roomUrl}/>
            )}
            { modalIsShown && (
                <StartWatchingEventModal setModalIsShown={setModalIsShown} roomUrl={roomUrl}/>
            )}
        </>
        )
    }

    return (
        <SWPageWrapper className="h-full" mustBeAuthenticated={true}>
            <RoomContext.Provider value={[room, setRoom]}>
                {body}
            </RoomContext.Provider>
        </SWPageWrapper>
    );
}

export default WatchPage;
