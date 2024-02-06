import React, { useEffect, useRef } from 'react';
import dashjs from 'dashjs';


// TODO(Elias): In the future support also LIVE streams
export default function SWVideoPlayer({src, startDate, className, title, controls=true}) {
  const videoRef = useRef(null);

  useEffect(() => {
    let player = null;
    if (videoRef.current) {
      player = dashjs.MediaPlayer().create();
      player.initialize(videoRef.current, src, true);
      if (src) {
        const now = new Date();
        player.on(dashjs.MediaPlayer.events.CAN_PLAY, () => {
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
