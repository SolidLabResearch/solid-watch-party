/* library imports */
import {
    getSolidDataset,
    saveSolidDatasetAt,
    getStringNoLocale,
    getDatetime,
    getUrlAll,
    setThing,
    getThingAll,
    getThing,
    createThing,
    buildThing,
    asUrl,
} from '@inrupt/solid-client';
import { RDF } from "@inrupt/vocab-common-rdf";
import { QueryEngine as IncQueryEngine } from '@incremunica/query-sparql-incremental';

/* service imports */
import VideoSolidService from '../services/videos.solidservice.js';

/* util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';
import { inSession } from '../utils/solidUtils';


class EventsSolidService {

    async newWatchingEventFromVideoObject(sessionContext, roomUrl, videoUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!roomUrl) {
            return { error: "no room url", errorMsg: "No room url was provided" }
        } else if (!videoUrl) {
            return { error: "no video url", errorMsg: "No video url was provided" }
        }

        try {
            let roomDataset = await getSolidDataset(roomUrl, { fetch: sessionContext.fetch });
            const now = new Date();
            let newWatchingEvent = buildThing(createThing())
                .addUrl(RDF.type, SCHEMA_ORG + 'Event')
                .addDatetime(SCHEMA_ORG + 'startDate', now)
                .addUrl(SCHEMA_ORG + 'workFeatured', videoUrl)
                .build();
            roomDataset = setThing(roomDataset, newWatchingEvent);
            await saveSolidDatasetAt(roomUrl, roomDataset, { fetch: sessionContext.fetch });
        } catch (error) {
            console.error(error)
        }
    }

    async newWatchingEventFromSrc(sessionContext, roomUrl, srcUrl, metaUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!roomUrl) {
            return { error: "no room url", errorMsg: "No room url was provided" }
        } else if (!srcUrl) {
            return { error: "no video url", errorMsg: "No video url was provided" }
        }

        try {
            let videoObject = await VideoSolidService.getVideoObject(sessionContext, metaUrl);
            console.error(videoObject)
            if (!videoObject) {
                return { error: "video object not found", errorMsg: "The specified video object was not found" }
            }

            let roomDataset = await getSolidDataset(roomUrl, { fetch: sessionContext.fetch });
            if (!roomDataset) {
                return { error: "room dataset not found", errorMsg: "The specified room dataset was not found" }
            }

            let eventBuilder = buildThing(createThing())
                .addUrl(RDF.type, SCHEMA_ORG + 'Event')
                .addDatetime(SCHEMA_ORG + 'startDate', new Date());

            let addSourceObject = true;
            if (metaUrl) {
                eventBuilder = eventBuilder.addUrl(SCHEMA_ORG + 'workFeatured', asUrl(videoObject, roomUrl));
                const contentUrl = getUrlAll(videoObject, SCHEMA_ORG + 'contentUrl');
                addSourceObject = (contentUrl.length === 0);
            }

            if (addSourceObject) {
                const newVideoObject = buildThing(createThing())
                    .addUrl(RDF.type, SCHEMA_ORG + 'VideoObject')
                    .addUrl(SCHEMA_ORG + 'contentUrl', srcUrl)
                    .build();
                roomDataset = setThing(roomDataset, newVideoObject);
                eventBuilder = eventBuilder.addUrl(SCHEMA_ORG + 'workFeatured', asUrl(newVideoObject, roomUrl));
            }

            const newWatchingEvent = eventBuilder.build();
            roomDataset = setThing(roomDataset, newWatchingEvent);

            await saveSolidDatasetAt(roomUrl, roomDataset, { fetch: sessionContext.fetch });
        } catch (error) {
            console.error(error)
            return {error: error};
        }
    }


    async getWatchingEventStream(sessionContext, roomUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!roomUrl) {
            return { error: "no room url", errorMsg: "No room url was provided" }
        }

        const queryEngine = new IncQueryEngine();
        const resultStream = await queryEngine.queryBindings(`
            PREFIX schema: <${SCHEMA_ORG}>
            SELECT ?watchingEvent ?startDate ?videoObject
            WHERE {
                ?watchingEvent a schema:Event .
                ?watchingEvent schema:startDate ?startDate .
                ?watchingEvent schema:workFeatured ?videoObject .
            }`,
            {
                sources: [roomUrl],
                fetch: sessionContext.fetch,
            });

        return resultStream;
    }


    async saveControlAction(sessionContext, eventUrl, isPlay, atLocationNumber) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!eventUrl) {
            return { error: "no event url", errorMsg: "No watching event was provided" }
        }

        const actionType = (isPlay) ? 'ResumeAction' : 'SuspendAction';
        const now = new Date();
        const newControlAction = buildThing(createThing())
            .addUrl(RDF.type, SCHEMA_ORG + actionType)
            .addUrl(RDF.type, SCHEMA_ORG + 'ControlAction')
            .addUrl(SCHEMA_ORG + 'agent', sessionContext.session.info.webId)
            .addUrl(SCHEMA_ORG + 'object', eventUrl)
            .addDatetime(SCHEMA_ORG + 'startTime', now)
            .addStringNoLocale(SCHEMA_ORG + 'location', atLocationNumber.toString())
            .build();

        try {
            let roomDataset = await getSolidDataset(eventUrl, { fetch: sessionContext.fetch });

            roomDataset = setThing(roomDataset, newControlAction);

            let eventThing = getThing(roomDataset, eventUrl);
            if (!eventThing) {
                return { error: "event not found", errorMsg: "The specified event was not found in the dataset" };
            }

            // TODO(Elias): only add event if different from latest
            eventThing = buildThing(eventThing)
                .addUrl(SCHEMA_ORG + 'ControlAction', asUrl(newControlAction, eventUrl))
                .build();
            roomDataset = setThing(roomDataset, eventThing);

            const savedDataset = await saveSolidDatasetAt(eventUrl, roomDataset, { fetch: sessionContext.fetch });
            return savedDataset;
        } catch (error) {
            console.error(error)
        }
    }


    async getControlActionStream(sessionContext, eventUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!eventUrl) {
            return { error: "no event url", errorMsg: "No event url was provided" }
        }

        const queryEngine = new IncQueryEngine();
        const resultStream = await queryEngine.queryBindings(`
            PREFIX schema: <${SCHEMA_ORG}>
            SELECT ?controlAction ?actionType ?agent ?datetime ?location
            WHERE {
                ?controlAction a schema:ControlAction .
                ?controlAction a ?actionType .
                ?controlAction schema:agent ?agent .
                ?controlAction schema:object <${eventUrl}> .
                ?controlAction schema:startTime ?datetime .
                ?controlAction schema:location ?location .
            }`, {
                sources: [eventUrl],
                fetch: sessionContext.fetch,
            });

        return resultStream;
    }

    async getPauseTimeContext(sessionContext, watchingEvent) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!watchingEvent) {
            return { error: "no event url", errorMsg: "No event provided" }
        }

        try {
            const dataset = await getSolidDataset(watchingEvent?.eventUrl, { fetch: sessionContext.fetch });
            let things = getThingAll(dataset)
                .filter((thing) => {
                    const types = getUrlAll(thing, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
                    const objects = getUrlAll(thing, SCHEMA_ORG + 'object');
                    return (types.includes(SCHEMA_ORG + 'ControlAction') && objects.includes(watchingEvent.eventUrl));
                }).map((thing) => {
                    const types = getUrlAll(thing, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
                    return {
                        type: types.filter((x) => (x !== SCHEMA_ORG + 'ControlAction'))[0],
                        at: getDatetime(thing, SCHEMA_ORG + 'startTime'),
                        location: parseFloat(getStringNoLocale(thing, SCHEMA_ORG + 'location'))
                    }
                }).sort((a, b) => (a.at > b.at));

            let aggregatedTime = 0.0;
            let isPlaying = true; //(things.length > 0) ? (things[0].type !== SCHEMA_ORG + 'SuspendAction') : true;
            let lastPauseAt = isPlaying ? undefined : watchingEvent.startDate;
            let lastPauseLocation = 0;
            for (const key in things) {
                const action = things[key];
                if (isPlaying && (action.type === SCHEMA_ORG + 'SuspendAction')) {
                    isPlaying = false;
                    lastPauseAt = action.at;
                    lastPauseLocation = action.location
                } else if (!isPlaying) {
                    aggregatedTime += (action.at - lastPauseAt);
                    isPlaying = true;
                }
            }

            return { aggregatedPauseTime: aggregatedTime, lastPauseAt: lastPauseLocation, isPlaying: isPlaying };
        } catch (error) {
            console.error(error)
            return { error: error }
        }
    }

}

export default new EventsSolidService();
