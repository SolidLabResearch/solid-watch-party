/* library imports */
import { useState, useEffect, useRef } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import PropTypes from 'prop-types';
import dashjs from 'dashjs';

/* service imports */
import EventsSolidService from '../services/events.solidservice.js';

// TODO(Elias): In the future support also LIVE streams
// TODO(Elias): In the future support also mp4's

function SWVideoPlayer({className, roomUrl}) {
  const [player, setPlayer] = useState(null);
  const [watchingEvent, setWatchingEvent] = useState(null);
  const {session, sessionRequestInProgress} = useSession();
  const videoRef = useRef(null);

  useEffect(() => {
    let watchingEventStream = null;
    const fetch = async () => {
      watchingEventStream = await EventsSolidService.getWatchingEventStream(session, roomUrl);
      // if (watchingEventStream.error) {
      //   console.error(watchingEventStream.error);
      //   watchingEventStream = null;
      //   return;
      // }
      // let currentWatchingEvent = null;
      // watchingEventStream.on('data', (data) => {
      //   const receivedWatchingEvent = {
      //     eventURL: data.get('watchingEvent').value,
      //     videoURL: data.get('dashLink').value,
      //     startDate: new Date(data.get('startDate').value)
      //   };
      //   if (!currentWatchingEvent || receivedWatchingEvent.startDate >= currentWatchingEvent.startDate) {
      //     currentWatchingEvent = receivedWatchingEvent;
      //     setWatchingEvent(currentWatchingEvent);
      //   }
      //});
    }
    fetch();
    return (() => {
      watchingEventStream?.close();
    });
  }, [session, sessionRequestInProgress, roomUrl]);


  // useEffect(() => {
  //   if (!watchingEvent) {
  //     return;
  //   }
  //   let controlActionStream = null;
  //   const fetch = async () => {
  //     controlActionStream = await EventsSolidService.getControlActionStream(session, watchingEvent?.eventURL);
  //     controlActionStream.on('data', (data) => {
  //       const datetime = new Date(data.get('datetime').value);
  //       let lastControlDatetime = null;
  //       if (!lastControlDatetime || datetime >= lastControlDatetime) {
  //         lastControlDatetime = datetime;
  //         const actionType = data.get('actionType').value;
  //         if (actionType === `${SCHEMA_ORG}ResumeAction`) {
  //           player.play();
  //         } else if (actionType === `${SCHEMA_ORG}SuspendAction`) {
  //           player.pause();
  //         }
  //       }
  //     })
  //   }
  //   fetch();
  //   return (() => {
  //     if (controlActionStream) {
  //       controlActionStream.close();
  //     }
  //   });
  // }, [player, watchingEvent]);

  useEffect(() => {
    if (watchingEvent && videoRef.current) {
      const p = (player) ? player : dashjs.MediaPlayer().create();
      p.initialize(videoRef.current, watchingEvent?.videoURL, true);
      p.on(dashjs.MediaPlayer.events.PLAYBACK_STARTED, () => {
        EventsSolidService.saveControlAction(session, watchingEvent?.eventURL, true)
      });
      p.on(dashjs.MediaPlayer.events.PLAYBACK_PAUSED, () => {
        EventsSolidService.saveControlAction(session, watchingEvent?.eventURL, false)
      });
      setPlayer(player);
    }
    return () => {
      player?.reset();
    };
  }, [watchingEvent, player]);


  return (
    <div className={className + " relative"}>
      <video ref={videoRef} className="w-full h-full bg-blue" controls={true}></video>
    </div>
  );
}

SWVideoPlayer.propTypes = {
    roomUrl:      PropTypes.string,
    className:    PropTypes.string,
};

export default SWVideoPlayer;
