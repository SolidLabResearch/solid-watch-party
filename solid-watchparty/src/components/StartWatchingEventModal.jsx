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

/* service imports */
import RoomSolidService from '../services/room.solidservice.js';
import EventsSolidService from '../services/events.solidservice.js';

/* util imports */
import { inSession } from '../utils/solidUtils';
import { SCHEMA_ORG } from '../utils/schemaUtils';

function Tab1({className, roomUrl, setModalIsShown}) {
    const [videoSourceUrl, setVideoSourceUrl] = useState(
        'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd'
    );
    const [videoMetaUrl, setVideoMetaUrl] = useState(
        'http://localhost:3000/P2/watchparties/myRooms/hello-world2024-03-13t133842652z#87e6d37e-1820-4660-8c1f-8518134192e8'
    );
    const {session, sessionRequestInProgress} = useSession();
    return (
        <div className={className + " flex flex-col justify-between"}>
            <div>
                <div className="my-4">
                    <p className="sw-fs-4 sw-fw-1 my-2">Video Source URL*</p>
                    <div className="my-2">
                        <input value={videoSourceUrl} type="url" name="locator" className="sw-input w-full"
                            onChange={(e) => setVideoSourceUrl(e.target.value)} />
                    </div>
                </div>
                <div className="my-4">
                    <p className="sw-fs-4 sw-fw-1 my-2">Video object URL for metadata</p>
                    <div className="my-2">
                        <input value={videoMetaUrl} type="url" name="locator" className="sw-input w-full"
                            onChange={(e) => setVideoMetaUrl(e.target.value)} />
                    </div>
                </div>
            </div>
            <button className={`sw-btn flex-grow h-6 mt-6 flex justify-center`}
                onClick={() => {
                    EventsSolidService.newWatchingEventFromSrc(session, roomUrl, videoSourceUrl, videoMetaUrl)
                    setVideoSourceUrl(null);
                    setVideoMetaUrl(null);
                    setModalIsShown(false);
                }}>
                Start
            </button>
        </div>
    );
}

function
Tab2({className, roomUrl, setModalIsShown}) {
    const [videoObjectUrl, setVideoObjectUrl] = useState(
        'http://localhost:3000/P2/watchparties/myRooms/asdf2024-03-12t140446746z#eabd702f-9690-4ade-8290-cf56d304a176'
    );
    const {session, sessionRequestInProgress} = useSession();
    return (
        <div className={className + " flex flex-col justify-between"}>
            <div>
                <div className="my-4">
                    <p className="sw-fs-4 sw-fw-1 my-2">Video object URL*</p>
                    <div className="my-2">
                        <input value={videoObjectUrl} type="url" name="locator" className="sw-input w-full"
                            onChange={(e) => setVideoObjectUrl(e.target.value)} />
                    </div>
                </div>
            </div>
            <button className={`sw-btn h-6 mt-6 flex justify-center`}
                onClick={() => {
                    EventsSolidService.newWatchingEventFromVideoObject(session, roomUrl, videoObjectUrl)
                    setVideoObjectUrl(null);
                    setModalIsShown(false);
                }}>
                Start
            </button>
        </div>
    );
}

function StartWatchingEventModal({setModalIsShown, roomUrl}) {
    return (
        <SWModal className="rgb-bg-2 p-12 sw-border z-10 w-1/2" setIsShown={setModalIsShown}>
            <p className="sw-fs-2 sw-fw-1 my-4">Start new movie/clip</p>
            <div className="flex w-full gap-3">
                <Tab2 className="w-full rgb-bg-1 p-4 sw-border" setModalIsShown={setModalIsShown} roomUrl={roomUrl}/>
                <Tab1 className="w-full rgb-bg-1 p-4 sw-border" setModalIsShown={setModalIsShown} roomUrl={roomUrl}/>
            </div>
        </SWModal>
    );
}


export default StartWatchingEventModal;
