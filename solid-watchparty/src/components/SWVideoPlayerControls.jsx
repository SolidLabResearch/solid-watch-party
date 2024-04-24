/* library imports */
import { useSession, } from "@inrupt/solid-ui-react";
import { FaPlay, FaPause, FaExpandAlt } from "react-icons/fa";
import { FiMinimize2 } from "react-icons/fi";
import PropTypes from 'prop-types';

/* service imports */
import EventsSolidService from '../services/events.solidservice.js';


function SWVideoPlayerControls({watchingEvent, videoRef, isPlaying, fullscreenHandle}) {
    const sessionContext = useSession();

    const onPause = () => {
        EventsSolidService.saveControlAction(sessionContext, watchingEvent?.eventUrl,
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
        <div className="h-9 m-3 bg-[#000A] rounded flex px-5 z-20 justify-between drop-shadow-xl">
            <button className="sw-btn-player my-1" onClick={onPause}>
                {isPlaying ? <FaPause/> : <FaPlay className="rgb-2"/> }
            </button>
            <button className="sw-btn-player my-1" onClick={onFullscreen}>
                {fullscreenHandle.active ? <FiMinimize2/> : <FaExpandAlt className="rgb-2"/> }
            </button>
        </div>
  );
}
SWVideoPlayerControls.propTypes = {
    watchingEvent:              PropTypes.object,
    videoRef:                   PropTypes.object,
    isPlaying:                  PropTypes.bool,
    fullscreenHandle:           PropTypes.object,
}

export default SWVideoPlayerControls;
