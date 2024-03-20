/* library imports */
import { useEffect, useState, useRef } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import { useSearchParams } from 'react-router-dom';
import dashjs from 'dashjs';

/* component imports */
import SWPageWrapper from '../components/SWPageWrapper'
import SWChatComponent from '../components/SWChatComponent';
import SWModal from '../components/SWModal';
import SWVideoPlayer from '../components/SWVideoPlayer';
import SWLoadingIcon from '../components/SWLoadingIcon';
import StartWatchingEventModal from '../components/StartWatchingEventModal';

/* service imports */
import RoomSolidService from '../services/room.solidservice.js';
import EventsSolidService from '../services/events.solidservice.js';

/* util imports */
import { inSession } from '../utils/solidUtils';
import { SCHEMA_ORG } from '../utils/schemaUtils';


function WatchPage() {
    const iframeRef = useRef(null);
    const [modalIsShown, setModalIsShown] = useState(false);
    const [parentHeight, setParentHeight] = useState('auto');
    const [joinedRoom, setJoinedRoom] = useState(false);
    const {session, sessionRequestInProgress} = useSession();

    /* TODO(Elias): Add error handling, what if there is no parameter */
    const [searchParams] = useSearchParams();
    const roomUrl = decodeURIComponent(searchParams.get('room'));

    useEffect(() => {
        const joinRoom = async () => {
            const joiningRoomResult = await RoomSolidService.joinRoom(session, roomUrl)
            if (joiningRoomResult.error) {
                console.error(joiningRoomResult.error);
                return;
            }
            setJoinedRoom(true);
        }
        if (inSession && !sessionRequestInProgress) {
            joinRoom();
        }
    }, [session, roomUrl, sessionRequestInProgress])


    useEffect(() => {
        const updateChatHeight = () => {
            if (iframeRef.current) {
                setParentHeight(`${iframeRef.current.clientHeight}px`);
            }
        }
        updateChatHeight();
        window.addEventListener("resize", updateChatHeight, false);
    }, [joinedRoom]);


    return (
        <SWPageWrapper className="h-full" mustBeAuthenticated={true}>
            { (joinedRoom) ? (
                <>
                    <div className="px-8 py-4 rgb-2">
                        <p>{roomUrl}</p>
                    </div>
                    <div className="w-full flex px-8 gap-4" style={{height: parentHeight}}>
                        <div className="w-2/3 h-fit flex rgb-bg-2 sw-border" ref={iframeRef}>
                            <SWVideoPlayer roomUrl={roomUrl}/>
                        </div>
                        <SWChatComponent roomUrl={roomUrl}/>
                    </div>
                    <div className="px-8 py-4 rgb-2">
                        <button className={`sw-btn flex-grow h-6 flex justify-center`} onClick={() => setModalIsShown(true)}>
                            Start new movie/clip
                        </button>
                    </div>
                    { modalIsShown && <StartWatchingEventModal setModalIsShown={setModalIsShown} roomUrl={roomUrl}/> }
                </>
            ) : (
                <div className="flex w-full h-full items-center justify-center gap-3">
                    <SWLoadingIcon className="w-8 h-8"/>
                    <p className="sw-fw-1">Joining Room...</p>
                </div>
            )}
        </SWPageWrapper>
    );
}

export default WatchPage;
