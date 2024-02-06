import React, { useEffect, useRef } from 'react';
import dashjs from 'dashjs';


// TODO(Elias): In the future support also LIVE streams
export default function SWVideoPlayer({src, className, title, controls=true}) {
  const videoRef = useRef(null);

  useEffect(() => {
    let player = null;
    if (videoRef.current) {
      player = dashjs.MediaPlayer().create();
      player.initialize(videoRef.current, src, true);
    }
    return () => {
      if (player) {
        player.reset();
      }
    };
  }, [src]);

  return (
    <div className={className + " relative"}>
      <video ref={videoRef} className="w-full h-full" controls={controls}></video>
    </div>
  );
}
