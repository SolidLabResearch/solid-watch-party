/* library imports */
import { useState, useEffect, useRef } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import { getUrl, getUrlAll } from "@inrupt/solid-client";
import PropTypes from 'prop-types';
import ReactPlayer from 'react-player'

/* imports imports */
import SWVideoPlayerControls from '../components/SWVideoPlayerControls';

/* service imports */
import EventsSolidService from '../services/events.solidservice.js';
import VideoSolidService from '../services/videos.solidservice.js';
/* util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';


async function handleNewWatchingEvent(sessionContext, data) {
    const videoObject = await VideoSolidService.getVideoObject(sessionContext, data.get('videoObject').value);
    if (videoObject.error) {
        return null;
    }
    const contentUrl = getUrlAll(videoObject, SCHEMA_ORG + 'contentUrl');
    if (!contentUrl || contentUrl.length === 0) {
        return null;
    }
    const newWatchingEvent  = {
        eventUrl:   data.get('watchingEvent').value,
        videoUrl:   getUrl(videoObject, SCHEMA_ORG + 'contentUrl'),
        startDate:  new Date(data.get('startDate').value),
    };
    const pauseTimeContext = await EventsSolidService.getPauseTimeContext(sessionContext, newWatchingEvent);
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

async function handleControlAction(sessionContext, data, watchingEvent) {
    const date = new Date(data.get('datetime').value);
    if (data.diff != true || date <= watchingEvent.joinedAt) {
        return null;
    }
    let isPlaying = null;
    if (data.get('actionType').value === `${SCHEMA_ORG}ResumeAction`) {
        isPlaying = true;
    } else if (data.get('actionType').value === `${SCHEMA_ORG}SuspendAction`) {
        isPlaying = false;
    } else {
        /* NOTE(Elias): This might happen since 'Incremunica' sends events for all instances of type */
        return null;
    }
    return {
        loc:        parseFloat(data.get('location').value),
        isPlaying:  isPlaying,
        date:       date,
    }
}

function SWVideoPlayer({roomUrl}) {
    const [playerReady, setPlayerReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState({is: false, from: 0});
    const [watchingEvent, setWatchingEvent] = useState(null);
    const sessionContext = useSession();
    const videoRef = useRef(null);
    const fullscreenHandle = useFullScreenHandle();

    useEffect(() => {
        let watchingEventStream = null;
        let lastWatchingEvent = null;
        const act = async () => {
            watchingEventStream = await EventsSolidService.getWatchingEventStream(sessionContext, roomUrl);
            if (watchingEventStream.error) {
                watchingEventStream = null;
                return;
            }
            console.log('NOW LISTENING FOR NEW WATCHING EVENTS');
            watchingEventStream.on('data', (data) => {
                handleNewWatchingEvent(sessionContext, data).then((newWatchingEvent) => {
                    if (!newWatchingEvent) {
                        return;
                    }
                    if (lastWatchingEvent && newWatchingEvent.startDate <= lastWatchingEvent.startDate) {
                        return;
                    }
                    console.log("NEW WATCHING EVENT", newWatchingEvent);
                    lastWatchingEvent = newWatchingEvent;
                    setWatchingEvent(lastWatchingEvent);
                });
            });
        }
        act();
        return (() => {
            watchingEventStream?.close();
        });
    }, [sessionContext, sessionContext.session, sessionContext.sessionRequestInProgress, roomUrl]);


    useEffect(() => {
        let controlActionStream = null;
        let lastControlAction = null;
        const act = async () => {
            if (!watchingEvent) {
                return;
            }
            controlActionStream = await EventsSolidService.getControlActionStream(sessionContext, watchingEvent?.eventUrl);
            controlActionStream.on('data', (data) => {
                handleControlAction(sessionContext, data, watchingEvent).then((controlAction) => {
                    if (!controlAction) {
                        return;
                    }
                    if (lastControlAction && controlAction.date <= lastControlAction.date) {
                        return;
                    }
                    lastControlAction = controlAction;
                    setIsPlaying({is: lastControlAction.isPlaying, from: lastControlAction.loc});
                });
            })
            setIsPlaying({is: watchingEvent.isPlaying, from: watchingEvent.joinedAt});
        }
        act();
        return () => {
            controlActionStream?.close();
        };
    }, [sessionContext, sessionContext.session, sessionContext.sessionRequestInProgress, watchingEvent]);


    useEffect(() => {
        if (playerReady === false || !isPlaying) {
            return;
        }
        videoRef.current.seekTo(Math.round(isPlaying.from), "seconds");
    }, [isPlaying, playerReady]);


    const playerConfig = { youtube: { playerVars: { rel: 0, disablekb: 1 } }, }
    return (
        <div className="h-full w-full relative aspect-video">
            <FullScreen handle={fullscreenHandle} className="h-full w-full">
                <div className="absolute bottom-0 right-0 w-full h-full z-5 flex flex-col justify-end">
                    <SWVideoPlayerControls videoRef={videoRef} watchingEvent={watchingEvent}
                                           isPlaying={isPlaying.is} fullscreenHandle={fullscreenHandle} />
                </div>
                <ReactPlayer url={watchingEvent?.videoUrl} width="100%" height="100%" controls={false}
                             playing={isPlaying.is} config={playerConfig} ref={videoRef}
                             onReady={() => setPlayerReady(true)}/>
            </FullScreen>
        </div>
    );
}

SWVideoPlayer.propTypes = {
  roomUrl:      PropTypes.string,
};

export default SWVideoPlayer;
