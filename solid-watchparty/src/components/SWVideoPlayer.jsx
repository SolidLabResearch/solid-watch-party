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

function playFrom(videoRef, lastPause) {
    if (!videoRef || !lastPause || !videoRef.current) {
        return 0;
    }
    let from = lastPause.isPlaying
        ? lastPause.location + ((new Date() - lastPause.datetime) / 1000.0)
        : lastPause.location;
    from = Math.ceil(from);
    videoRef.current.seekTo(from, "seconds");
}

async function handleNewWatchingEvent(sessionContext, data) {
    const videoObject = await VideoSolidService.getVideoObject(sessionContext, data.get('videoObject').value);
    if (videoObject.error) {
        console.log("NO VIDEO OBJECT");
        return null;
    }
    const contentUrl = getUrlAll(videoObject, SCHEMA_ORG + 'contentUrl');
    if (!contentUrl || contentUrl.length === 0) {
        console.log("NO CONTENT URL");
        return null;
    }
    const newWatchingEvent  = {
        eventUrl:   data.get('watchingEvent').value,
        videoUrl:   getUrl(videoObject, SCHEMA_ORG + 'contentUrl'),
        startDate:  new Date(data.get('startDate').value),
    };
    let lastPause = await EventsSolidService.getLastPause(sessionContext, newWatchingEvent);
    if (!lastPause || lastPause.datetime < newWatchingEvent.startDate) {
        lastPause = {
            datetime:   newWatchingEvent.startDate,
            location:   0,
            isPlaying:  true,
        };
    }
    if (lastPause.error) {
        console.log("LAST PAUSE ERROR: ", lastPause.error);
        return null;
    }
    return { newWatchingEvent, lastPause };
}

async function handleControlAction(sessionContext, data, watchingEvent) {
    const date = new Date(data.get('datetime').value);
    if (data.diff != true) {
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
        isPlaying:  isPlaying,
        datetime:   date,
        location:   parseFloat(data.get('location').value),
    };
}

function SWVideoPlayer({roomUrl}) {
    const [lastPause, setLastPause] = useState(null);
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
            watchingEventStream.on('data', (data) => {
                handleNewWatchingEvent(sessionContext, data).then((data) => {
                    if (!data) {
                        return;
                    }
                    const { newWatchingEvent, lastPause } = data;
                    if (lastWatchingEvent && newWatchingEvent.startDate <= lastWatchingEvent.startDate) {
                        return;
                    }
                    lastWatchingEvent = newWatchingEvent;
                    setWatchingEvent(lastWatchingEvent);
                    setLastPause(lastPause);
                });
            });
        }
        act();
    }, [sessionContext.session, sessionContext.sessionRequestInProgress, roomUrl]);


    useEffect(() => {
        let controlActionStream = null;
        let lastPause_ = null;
        const act = async () => {
            if (!watchingEvent) {
                return;
            }
            controlActionStream = await EventsSolidService.getControlActionStream(sessionContext, watchingEvent?.eventUrl);
            controlActionStream.on('data', (data) => {
                handleControlAction(sessionContext, data, watchingEvent).then((pause) => {
                    if (!pause) {
                        return;
                    }
                    if (lastPause_ && pause.datetime <= lastPause_.datetime) {
                        return;
                    }
                    lastPause_ = pause;
                    if (pause.datetime < lastPause.datetime) {
                        return;
                    }
                    setLastPause(pause);
                });
            })
        }
        act();
    }, [sessionContext.session, sessionContext.sessionRequestInProgress, watchingEvent]);

    useEffect(() => {
        console.log("PLAYING FROM: ", lastPause);
        playFrom(videoRef, lastPause);
    }, [lastPause, videoRef, watchingEvent]);

    const playerConfig = { youtube: { playerVars: { rel: 0, disablekb: 1 } }, }
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    return (
        <div className="h-full w-full relative aspect-video">
            <FullScreen handle={fullscreenHandle} className="h-full w-full">
                <div className="absolute bottom-0 right-0 w-full h-full z-5 flex flex-col justify-end">
                    <SWVideoPlayerControls videoRef={videoRef} watchingEvent={watchingEvent}
                                           isPlaying={lastPause?.isPlaying} fullscreenHandle={fullscreenHandle}
                                           duration={duration} progress={progress} />
                </div>
                <ReactPlayer url={watchingEvent?.videoUrl} width="100%" height="100%" controls={false}
                             playing={lastPause?.isPlaying} config={playerConfig} ref={videoRef}
                             onDuration={(duration) => setDuration(duration)}
                             onProgress={(state) => setProgress(state.playedSeconds)}
                             playsinline={true} />
            </FullScreen>
        </div>
    );
}

SWVideoPlayer.propTypes = {
  roomUrl:      PropTypes.string,
};

export default SWVideoPlayer;
