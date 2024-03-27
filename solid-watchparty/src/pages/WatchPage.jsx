/* library imports */
import { useEffect, useState, useRef } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import { useSearchParams } from 'react-router-dom';
import { FaUserFriends } from "react-icons/fa";
import dashjs from 'dashjs';
import { FaUserCircle } from "react-icons/fa";

/* component imports */
import SWPageWrapper from '../components/SWPageWrapper'
import SWChatComponent from '../components/SWChatComponent';
import SWModal from '../components/SWModal';
import SWVideoPlayer from '../components/SWVideoPlayer';
import SWLoadingIcon from '../components/SWLoadingIcon';
import StartWatchingEventModal from '../components/StartWatchingEventModal';
import PeopleMenuModal from '../components/PeopleMenuModal';

/* service imports */
import RoomSolidService from '../services/room.solidservice.js';
import EventsSolidService from '../services/events.solidservice.js';

/* util imports */
import { inSession } from '../utils/solidUtils';
import { SCHEMA_ORG } from '../utils/schemaUtils';


function WatchPage() {
    const iframeRef = useRef(null);
    const [menuModalIsShown, setMenuModalIsShown] = useState(false);
    const [modalIsShown, setModalIsShown] = useState(false);
    const [parentHeight, setParentHeight] = useState('auto');
    const [joinedRoom, setJoinedRoom] = useState(false);
    const sessionContext = useSession();

    /* TODO(Elias): Add error handling, what if there is no parameter */
    const [searchParams] = useSearchParams();
    const roomUrl = decodeURIComponent(searchParams.get('room'));

    useEffect(() => {
        const joinRoom = async () => {
            const joiningRoomResult = await RoomSolidService.joinRoom(sessionContext, roomUrl)
            if (joiningRoomResult.error) {
                console.error(joiningRoomResult.error);
                return;
            }
            setJoinedRoom(true);
        }
        if (inSession(sessionContext) && !sessionContext.sessionRequestInProgress) {
            joinRoom();
        }
    }, [sessionContext.sessionRequestInProgress, sessionContext.session, roomUrl]);


    useEffect(() => {
        const updateChatHeight = () => {
            if (iframeRef.current) {
                setParentHeight(`${iframeRef.current.clientHeight}px`);
            }
        }
        updateChatHeight();
        window.addEventListener("resize", updateChatHeight, false);
    }, [joinedRoom]);


    if (!joinedRoom) {
        return (
            <div className="flex w-full h-full items-center justify-center gap-3">
                <div>
                    <div className="flex my-6 gap-3 justify-center items-center">
                        <SWLoadingIcon className="w-8 h-8"/>
                    </div>
                    <p className="sw-fw-1">Joining Room...</p>
                    <p> A join request was sent to the party owner.</p>
                </div>
            </div>
        );
    }


    return (
        <SWPageWrapper className="h-full" mustBeAuthenticated={true}>
            <div className="flex justify-between px-8 py-4 rgb-2 gap-12 items-center">
                <p>{roomUrl}</p>
                <div className="flex gap-3">
                    <div className="rgb-2">
                        <button className={`sw-btn flex-grow h-6 flex justify-center`} onClick={() => setModalIsShown(true)}>
                            Start new video
                        </button>
                    </div>
                    <button onClick={() => setMenuModalIsShown(!menuModalIsShown)} className="sw-btn border">
                        <FaUserFriends className="sw-btn-player w-6 h-6"/>
                    </button>
                </div>
            </div>
            <div className="w-full flex px-8 gap-4" style={{height: parentHeight}}>
                <div className="w-2/3 h-fit flex rgb-bg-2 sw-border" ref={iframeRef}>
                    <SWVideoPlayer roomUrl={roomUrl}/>
                </div>
                <SWChatComponent roomUrl={roomUrl}/>
            </div>
            { menuModalIsShown && <PeopleMenuModal setModalIsShown={setMenuModalIsShown} roomUrl={roomUrl}/> }
            { modalIsShown && <StartWatchingEventModal setModalIsShown={setModalIsShown} roomUrl={roomUrl}/> }
        </SWPageWrapper>
    );
}

export default WatchPage;
