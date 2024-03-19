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


async function handleNewWatchingEvent(session, data, watchingEvent) {
    console.log('RECEIVED NEW WATCHING EVENT');
    const videoObject = await VideoSolidService.getVideoObject(session, data.get('videoObject').value);
    if (videoObject.error) {
        return null;
    }
    const newWatchingEvent  = {
        eventUrl:   data.get('watchingEvent').value,
        videoUrl:   getUrl(videoObject, SCHEMA_ORG + 'contentUrl'),
        startDate:  new Date(data.get('startDate').value),
    };
    if (watchingEvent && newWatchingEvent.startDate < watchingEvent.startDate) {
        return null;
    }
    const pauseTimeContext = await EventsSolidService.getPauseTimeContext(session, newWatchingEvent);
    if (pauseTimeContext.error) {
        return null;
    }
    return {
        ...newWatchingEvent,
        joinedAt:       ((new Date() - newWatchingEvent.startDate) - pauseTimeContext.aggregatedPauseTime) / 1000.0,
        isPlaying:      pauseTimeContext.isPlaying,
        lastPauseAt:    pauseTimeContext.lastPauseAt,
    };
}

async function handleControlAction(session, data, watchingEvent, lastControlDate) {
    if (data.diff != true || data.get('datetime').value <= watchingEvent.joinedAt) {
        return null;
    }
    const date = new Date(data.get('datetime').value);
    if (lastControlDate && lastControlDate >= date) {
        return null;
    }
    return {
        loc:        parseFloat(data.get('location').value),
        isPlaying:  (data.get('actionType').value === `${SCHEMA_ORG}ResumeAction`),
        date:       date,
    }
}

function SWVideoPlayer({className, roomUrl}) {
    const [isPlaying, setIsPlaying] = useState(true);
    const [watchingEvent, setWatchingEvent] = useState(null);
    const {session, sessionRequestInProgress} = useSession();
    const videoRef = useRef(null);
    const fullscreenHandle = useFullScreenHandle();

    useEffect(() => {
        let watchingEventStream = null;
        const act = async () => {
            watchingEventStream = await EventsSolidService.getWatchingEventStream(session, roomUrl);
            if (watchingEventStream.error) {
                watchingEventStream = null;
                return;
            }
            console.log('NOW LISTENING FOR NEW WATCHING EVENTS');
            watchingEventStream.on('data', (data) => {
                handleNewWatchingEvent(session, data, watchingEvent).then((newWatchingEvent) => {
                    if (!newWatchingEvent) {
                        return;
                    }
                    console.log(newWatchingEvent);
                    setWatchingEvent(newWatchingEvent);
                });
            });
        }
        act();
        return (() => {
            watchingEventStream?.close();
        });
    }, [session, sessionRequestInProgress, roomUrl]);


    useEffect(() => {
        let controlActionStream = null;
        let lastControlDate = null;
        const act = async () => {
            if (!watchingEvent) {
                return;
            }
            controlActionStream = await EventsSolidService.getControlActionStream(session, watchingEvent?.eventUrl);
            controlActionStream.on('data', (data) => {
                handleControlAction(session, data, watchingEvent, lastControlDate).then((controlAction) => {
                    if (!controlAction) {
                        return;
                    }
                    console.log('CONTROL ACTION', controlAction);
                    setIsPlaying(controlAction.isPlaying);
                    videoRef.current.seekTo(controlAction.loc, 'seconds');
                    lastControlDate = controlAction.date;
                });
            })
            setIsPlaying(watchingEvent.isPlaying);
            videoRef.current.seekTo(watchingEvent.joinedAt, 'seconds');
        }
        act();
        return () => {
            controlActionStream?.close();
        };
    }, [session, sessionRequestInProgress, watchingEvent]);

    const playerConfig = { youtube: { playerVars: { rel: 0, disablekb: 1 } }, }
    return (
        <div className="h-full w-full relative aspect-video">
            <FullScreen handle={fullscreenHandle} className="h-full w-full">
                <div className="absolute bottom-0 right-0 w-full h-full z-5 flex flex-col justify-end">
                    <SWVideoPlayerControls videoRef={videoRef} watchingEvent={watchingEvent}
                                           isPlaying={isPlaying} fullscreenHandle={fullscreenHandle} />
                </div>
                <ReactPlayer url={watchingEvent?.videoUrl} width="100%" height="100%" controls={false}
                             playing={isPlaying} config={playerConfig} ref={videoRef} />
        </FullScreen>
    </div>
    );
}

SWVideoPlayer.propTypes = {
  roomUrl:      PropTypes.string,
  className:    PropTypes.string,
};

export default SWVideoPlayer;
