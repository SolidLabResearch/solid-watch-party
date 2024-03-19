/* library imports */
import { useState, useEffect, useRef } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import { FaPlay, FaPause, FaExpandAlt } from "react-icons/fa";
import { FiMinimize2 } from "react-icons/fi";

/* service imports */
import EventsSolidService from '../services/events.solidservice.js';


function SWVideoPlayerControls({watchingEvent, videoRef, isPlaying, fullscreenHandle}) {
    const {session, sessionRequestInProgress} = useSession();

    const onPause = () => {
        console.log("ON PAUSE CLICKED");
        EventsSolidService.saveControlAction(session, watchingEvent?.eventUrl,
                                             !isPlaying, videoRef.current.getCurrentTime())
    }

    const onFullscreen = () => {
        if (fullscreenHandle.active) {
            fullscreenHandle.exit();
        } else {
            fullscreenHandle.enter();
        }
    }

    return (
        <div className="h-8 m-3 bg-[#000A] rounded flex px-5 z-20 justify-between drop-shadow-xl">
            <button className="sw-btn-player my-2" onClick={onPause}>
                {isPlaying ? <FaPause className="rgb-2"/> : <FaPlay className="rgb-2"/> }
            </button>
            <button className="sw-btn-player my-2" onClick={onFullscreen}>
                {fullscreenHandle.active ? <FiMinimize2 className="rgb-2"/> : <FaExpandAlt className="rgb-2"/> }
            </button>
        </div>
  );
}

export default SWVideoPlayerControls;
