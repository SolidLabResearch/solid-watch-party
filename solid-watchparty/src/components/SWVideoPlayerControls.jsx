/* library imports */
import { useState, useEffect } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import { FaPlay, FaPause, FaExpandAlt } from "react-icons/fa";
import { FiMinimize2 } from "react-icons/fi";
import PropTypes from 'prop-types';

/* service imports */
import EventsSolidService from '../services/events.solidservice.js';


function SWVideoPlayerControls(
    {isPlaying, fullscreenHandle, duration, progress, updatePauseState, updateVideoLocation}
) {
    const onFullscreen = () => {
        if (fullscreenHandle.active) {
            fullscreenHandle.exit();
        } else {
            fullscreenHandle.enter();
        }
    }

    const [moving, setMoving] = useState(false);
    const [at, setAt] = useState(0);

    useEffect(() => {
        if (!moving) {
            setAt(progress);
        }
    }, [progress]);

    const onStartMove = (e) => {
        setMoving(true);
        setAt(e.target.value);
    }

    const handleSliderRelease = () => {
        updateVideoLocation(at).then(() => {
            setMoving(false);
        });
    };

    return (
        <div className="h-9 m-3 bg-[#000A] rounded flex px-5 z-20 justify-between drop-shadow-xl">
            <button className="sw-btn-player my-1" onClick={() => updatePauseState(!isPlaying)}>
                {isPlaying ? <FaPause/> : <FaPlay className="rgb-2"/> }
            </button>
            <input type="range" className="slider cursor-pointer my-1 w-full mx-4 bg-[#2229] rounded-max px-2"
                    min="0" max={duration} step="0.1" value={at} onChange={onStartMove}
                    onMouseUp={handleSliderRelease}/>
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
