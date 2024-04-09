/* library imports */
import { useState, } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import PropTypes from 'prop-types';

/* component imports */
import SWModal from '../components/SWModal';

/* service imports */
import EventsSolidService from '../services/events.solidservice.js';

/* util imports */

function Tab1({className, roomUrl, setModalIsShown}) {
    const [videoSourceUrl, setVideoSourceUrl] = useState("");
    const [videoMetaUrl, setVideoMetaUrl] = useState("");
    const sessionContext = useSession();
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
                    EventsSolidService.newWatchingEventFromSrc(sessionContext, roomUrl, videoSourceUrl, videoMetaUrl)
                    setVideoSourceUrl(null);
                    setVideoMetaUrl(null);
                    setModalIsShown(false);
                }}>
                Start
            </button>
        </div>
    );
}
Tab1.propTypes = {
    className:          PropTypes.string,
    roomUrl:            PropTypes.string,
    setModalIsShown:    PropTypes.func,
}

function
Tab2({className, roomUrl, setModalIsShown}) {
    const [videoObjectUrl, setVideoObjectUrl] = useState("");
    const sessionContext = useSession();
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
                    EventsSolidService.newWatchingEventFromVideoObject(sessionContext, roomUrl, videoObjectUrl)
                    setVideoObjectUrl(null);
                    setModalIsShown(false);
                }}>
                Start
            </button>
        </div>
    );
}
Tab2.propTypes = {
    className:          PropTypes.string,
    roomUrl:            PropTypes.string,
    setModalIsShown:    PropTypes.func,
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
StartWatchingEventModal.propTypes = {
    setModalIsShown:    PropTypes.func,
    roomUrl:            PropTypes.string,
}

export default StartWatchingEventModal;
