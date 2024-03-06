/* library imports */
import { useState, useEffect, useRef } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import PropTypes from 'prop-types';
import ReactPlayer from 'react-player'

/* somponent imports */
import SWVideoPlayerControls from './SWVideoPlayerControls'

/* service imports */
import EventsSolidService from '../services/events.solidservice.js';

/* util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';


// TODO(Elias): In the future support also LIVE streams
// TODO(Elias): In the future support also mp4's



function SWVideoPlayer({className, roomUrl}) {
  const [isPlaying, setIsPlaying] = useState(true);
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
    let controlActionStream = null;

    const launchControlActionStream = async () => {
      controlActionStream = await EventsSolidService.getControlActionStream(session, watchingEvent?.eventURL);
      controlActionStream.on('data', (data) => {
        const datetime = new Date(data.get('datetime').value);
        let lastControlDatetime = null;
        if (!lastControlDatetime || datetime >= lastControlDatetime) {
          lastControlDatetime = datetime;
          const actionType = data.get('actionType').value;
          if (actionType === `${SCHEMA_ORG}ResumeAction`) {
            setIsPlaying(true)
          } else if (actionType === `${SCHEMA_ORG}SuspendAction`) {
            setIsPlaying(false)
          }
        }
      })
    }
    if (watchingEvent) {
      launchControlActionStream();
    }
    return () => {
      controlActionStream?.close();
    };
  }, [session, sessionRequestInProgress, watchingEvent]);


  const onPauseButton = (isPause) => {
    EventsSolidService.saveControlAction(session, watchingEvent?.eventURL, !isPause)
  }

  const playerConfig = {
    youtube: {
      playerVars: { rel: 0, disablekb: 1 }
    },
  }

  return (
    <div className="w-full relative aspect-video">
      <ReactPlayer url={watchingEvent?.videoURL}
                   width="100%" height="100%" controls={true} playing={isPlaying}
                   config={playerConfig}
                   onPlay={() => onPauseButton(false)}
                   onPause={() => onPauseButton(true)}
                  />
    </div>
  );
}

SWVideoPlayer.propTypes = {
    roomUrl:      PropTypes.string,
    className:    PropTypes.string,
};

export default SWVideoPlayer;
