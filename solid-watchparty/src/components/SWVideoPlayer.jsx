import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import dashjs from 'dashjs';


// TODO(Elias): In the future support also LIVE streams
// TODO(Elias): In the future support also mp4's

function SWVideoPlayer({className, videoURL, startDate, playButtonPressed}) {
  const videoRef = useRef(null);





  useEffect(() => {
    let player = null;

    if (videoRef.current) {
      player = dashjs.MediaPlayer().create();
      player.initialize(videoRef.current, videoURL, true);
      if (videoURL) {
        player.on(dashjs.MediaPlayer.events.PLAYBACK_STARTED, () => {
          playButtonPressed(true)
        });
        player.on(dashjs.MediaPlayer.events.PLAYBACK_PAUSED, () => {
          playButtonPressed(false)
        })
      }
    }

    return () => {
      if (player) {
        player.reset();
      }
    };
  }, [videoURL, startDate, playButtonPressed]);

  return (
    <div className={className + " relative"}>
      <video ref={videoRef} className="w-full h-full" controls={true}></video>
    </div>
  );
}

SWVideoPlayer.propTypes = {
    className:    PropTypes.string,
    startDate:    PropTypes.instanceOf(Date),
    videoURL:     PropTypes.string
};

export default SWVideoPlayer;
