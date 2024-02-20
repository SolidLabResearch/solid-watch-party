import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import dashjs from 'dashjs';


// TODO(Elias): In the future support also LIVE streams
// TODO(Elias): In the future support also mp4's
function SWVideoPlayer({src, startDate, className, controls=true}) {
  const videoRef = useRef(null);

  useEffect(() => {
    let player = null;
    if (videoRef.current) {
      player = dashjs.MediaPlayer().create();
      player.initialize(videoRef.current, src, true);
      if (src) {
        player.on(dashjs.MediaPlayer.events.PLAYBACK_STARTED, () => {
          const now = new Date();
          player.seek((now - startDate)/1000);
        });
      }
    }
    return () => {
      if (player) {
        player.reset();
      }
    };
  }, [src, startDate]);

  return (
    <div className={className + " relative"}>
      <video ref={videoRef} className="w-full h-full" controls={controls}></video>
    </div>
  );
}

SWVideoPlayer.propTypes = {
    className:    PropTypes.string,
    controls:     PropTypes.bool,
    startDate:    PropTypes.date,
    src:          PropTypes.object
};

export default SWVideoPlayer;
