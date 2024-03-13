/* library imports */
import { useState, useEffect, useRef } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import { getUrl } from "@inrupt/solid-client";
import PropTypes from 'prop-types';
import ReactPlayer from 'react-player'

/* imports imports */
import SWVideoPlayerControls from '../components/SWVideoPlayerControls';

/* service imports */
import EventsSolidService from '../services/events.solidservice.js';
import VideoSolidService from '../services/videos.solidservice.js';
/* util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';


// TODO(Elias): In the future support also LIVE streams
// TODO(Elias): In the future support also mp4's


function SWVideoPlayer({className, roomUrl}) {
    const [isPlaying, setIsPlaying] = useState(true);
    const [watchingEvent, setWatchingEvent] = useState(null);
    const {session, sessionRequestInProgress} = useSession();
    const videoRef = useRef(null);
    const fullscreenHandle = useFullScreenHandle();

    useEffect(() => {
        let watchingEventStream = null;
        const fetch = async () => {
            watchingEventStream = await EventsSolidService.getWatchingEventStream(session, roomUrl);
            console.log('ACQUIRED WATCHING EVENT STREAM');
            if (watchingEventStream.error) {
                console.error(watchingEventStream.error);
                watchingEventStream = null;
                return;
            }
            let currEvent = null;
            watchingEventStream.on('data', (data) => {
                console.log('RECEIVED NEW WATCHING EVENT');
                const fetch = async () => {
                    const videoObject = await VideoSolidService.getVideoObject(session, data.get('videoObject').value);
                    if (videoObject.error) {
                        return;
                    }
                    const date = new Date(data.get('startDate').value);
                    let recvEvent = {
                        eventUrl: data.get('watchingEvent').value,
                        videoUrl: getUrl(videoObject, SCHEMA_ORG + 'contentUrl'),
                        startDate: date,
                    };
                    if (!currEvent || recvEvent.startDate > currEvent.startDate) {
                        console.log('SWITCHING WATCHING EVENT');

                        const pauseTimeContext = await EventsSolidService.getPauseTimeContext(session, recvEvent);
                        if (!pauseTimeContext.error) {
                            const now = new Date();
                            currEvent = {
                                ...recvEvent,
                                joinedAt: ((now - recvEvent.startDate) - pauseTimeContext.aggregatedPauseTime) / 1000.0,
                                lastPauseAt: pauseTimeContext.lastPauseAt,
                                isPlaying: pauseTimeContext.isPlaying,
                            };
                        } else {
                            currEvent = undefined;
                        }
                        setWatchingEvent(currEvent);
                    }
                }
                fetch();
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
            controlActionStream = await EventsSolidService.getControlActionStream(
                session, watchingEvent?.eventUrl);
            controlActionStream.on('data', (data) => {
                if (data.diff != true) {
                    return;
                }

                const datetime = new Date(data.get('datetime').value);
                let lastControlDatetime = null;
                if (!lastControlDatetime || datetime >= lastControlDatetime) {
                    lastControlDatetime = datetime;
                    const actionType = data.get('actionType').value;
                    const resumeAt = parseFloat(data.get('location').value);
                    if (actionType === `${SCHEMA_ORG}ResumeAction`) {
                        setIsPlaying(true)
                        videoRef.current.seekTo(resumeAt)
                    } else if (actionType === `${SCHEMA_ORG}SuspendAction`) {
                        setIsPlaying(false)
                        videoRef.current.seekTo(resumeAt)
                    }

                }
            })
        }
        if (watchingEvent) {
            launchControlActionStream();
            console.log(watchingEvent)
            if (watchingEvent.isPlaying) {
                setIsPlaying(true);
                videoRef.current.seekTo(watchingEvent.joinedAt);
            } else {
                setIsPlaying(false);
                console.log('LAST PAUSED AT')
            }
        }
        return () => {
            controlActionStream?.close();
        };
    }, [session, sessionRequestInProgress, watchingEvent]);


    useEffect(() => {
        videoRef.current.seekTo(watchingEvent.lastPauseAt);
    }, [isPlaying]);


    const playerConfig = {
        youtube: {
            playerVars: { rel: 0, disablekb: 1 }
        },
    }

  return (
    <div className="h-full w-full relative aspect-video">
      <FullScreen handle={fullscreenHandle} className="h-full w-full">
        <div className="absolute bottom-0 right-0 w-full h-full z-5 flex flex-col justify-end">
          <SWVideoPlayerControls videoRef={videoRef}
                                 watchingEvent={watchingEvent}
                                 isPlaying={isPlaying}
                                 fullscreenHandle={fullscreenHandle}
                                />
        </div>
        <ReactPlayer url={watchingEvent?.videoUrl}
                     width="100%" height="100%" controls={false} playing={isPlaying}
                     config={playerConfig}
                     ref={videoRef}
                    />
      </FullScreen>
    </div>
  );
}

SWVideoPlayer.propTypes = {
  roomUrl:      PropTypes.string,
  className:    PropTypes.string,
};

export default SWVideoPlayer;
