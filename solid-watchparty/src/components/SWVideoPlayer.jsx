/* library imports */
import { useState, useEffect, useRef } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import PropTypes from 'prop-types';
import dashjs from 'dashjs';

/* service imports */
import EventsSolidService from '../services/events.solidservice.js';

/* util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';


// TODO(Elias): In the future support also LIVE streams
// TODO(Elias): In the future support also mp4's

function SWVideoPlayer({className, roomUrl}) {
  const [watchingEvent, setWatchingEvent] = useState(null);
  const {session, sessionRequestInProgress} = useSession();
  const videoRef = useRef(null);

  useEffect(() => {
    let watchingEventStream = null;
    const fetch = async () => {
      watchingEventStream = await EventsSolidService.getWatchingEventStream(session, roomUrl);
      if (watchingEventStream.error) {
        console.error(watchingEventStream.error);
        watchingEventStream = null;
        return;
      }
       let currEvent = null;
       watchingEventStream.on('data', (data) => {
         const recvEvent = {
           eventURL: data.get('watchingEvent').value,
           videoURL: data.get('dashLink').value,
           startDate: new Date(data.get('startDate').value)
         };
         if (!currEvent || recvEvent.startDate >= currEvent.startDate) {
           currEvent = recvEvent;
           setWatchingEvent(currEvent);
         }
      });
    }
    fetch();
    return (() => {
      watchingEventStream?.close();
    });
  }, [session, sessionRequestInProgress, roomUrl]);


  useEffect(() => {
    let player = null;
    let controlActionStream = null;

    if (watchingEvent && videoRef.current) {
      player = dashjs.MediaPlayer().create();
      player.initialize(videoRef.current, watchingEvent?.videoURL, true);
      player.on(dashjs.MediaPlayer.events.PLAYBACK_STARTED, () => {
        EventsSolidService.saveControlAction(session, watchingEvent?.eventURL, true)
      });
      player.on(dashjs.MediaPlayer.events.PLAYBACK_PAUSED, () => {
        EventsSolidService.saveControlAction(session, watchingEvent?.eventURL, false)
      });
    }

    const launchControlActionStream = async () => {
      controlActionStream = await EventsSolidService.getControlActionStream(session, watchingEvent?.eventURL);
      controlActionStream.on('data', (data) => {
        const datetime = new Date(data.get('datetime').value);
        let lastControlDatetime = null;
        if (!lastControlDatetime || datetime >= lastControlDatetime) {
          lastControlDatetime = datetime;
          const actionType = data.get('actionType').value;
          if (actionType === `${SCHEMA_ORG}ResumeAction`) {
            player.play();
          } else if (actionType === `${SCHEMA_ORG}SuspendAction`) {
            player.pause();
          }
        }
      })
    }
    if (watchingEvent && player) {
      launchControlActionStream();
    }

    return () => {
      player?.reset();
      controlActionStream?.close();
    };
  }, [session, sessionRequestInProgress, watchingEvent]);


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
