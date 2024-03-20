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
    addUrl,
    createThing,
    buildThing,
    asUrl,
} from '@inrupt/solid-client';
import { RDF } from "@inrupt/vocab-common-rdf";
import { QueryEngine as IncQueryEngine } from '@incremunica/query-sparql-incremental';
import { QueryEngine } from '@comunica/query-sparql-solid';

/* service imports */
import VideoSolidService from '../services/videos.solidservice.js';

/* util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';
import { inSession } from '../utils/solidUtils';


class EventsSolidService {

    async newWatchingEventFromVideoObject(session, roomUrl, videoUrl) {
        if (!inSession(session)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!roomUrl) {
            return { error: "no room url", errorMsg: "No room url was provided" }
        } else if (!videoUrl) {
            return { error: "no video url", errorMsg: "No video url was provided" }
        }

        try {
            let roomDataset = await getSolidDataset(roomUrl);
            const now = new Date();
            let newWatchingEvent = buildThing(createThing())
                .addUrl(RDF.type, SCHEMA_ORG + 'Event')
                .addDatetime(SCHEMA_ORG + 'startDate', now)
                .addUrl(SCHEMA_ORG + 'workFeatured', videoUrl)
                .build();
            roomDataset = setThing(roomDataset, newWatchingEvent);
            await saveSolidDatasetAt(roomUrl, roomDataset);
        } catch (error) {
            console.log(error)
        }
    }

    async newWatchingEventFromSrc(session, roomUrl, srcUrl, metaUrl) {
        if (!inSession(session)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!roomUrl) {
            return { error: "no room url", errorMsg: "No room url was provided" }
        } else if (!srcUrl) {
            return { error: "no video url", errorMsg: "No video url was provided" }
        }

        try {
            let videoObject = await VideoSolidService.getVideoObject(session, metaUrl);
            if (!videoObject) {
                return { error: "video object not found", errorMsg: "The specified video object was not found" }
            }

            let roomDataset = await getSolidDataset(roomUrl);
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
            };

            const newWatchingEvent = eventBuilder.build();
            roomDataset = setThing(roomDataset, newWatchingEvent);

            await saveSolidDatasetAt(roomUrl, roomDataset);
        } catch (error) {
            console.log(error)
            return {error: error};
        }
    }


    async getWatchingEventStream(session, roomUrl) {
        if (!inSession(session)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!roomUrl) {
            return { error: "no room url", errorMsg: "No room url was provided" }
        }

        const sparqlQuery = `
      PREFIX schema: <${SCHEMA_ORG}>
      SELECT ?watchingEvent ?startDate ?videoObject
      WHERE {
        ?watchingEvent a schema:Event .
        ?watchingEvent schema:startDate ?startDate .
        ?watchingEvent schema:workFeatured ?videoObject .
      }
      `;

        const queryEngine = new IncQueryEngine();
        const resultStream = await queryEngine.queryBindings(sparqlQuery, { sources: [roomUrl] });
        return resultStream;
    }


    async saveControlAction(session, eventUrl, isPlay, atLocationNumber) {
        if (!inSession(session)) {
            console.error("invalid session")
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!eventUrl) {
            console.error("no event url")
            return { error: "no event url", errorMsg: "No watching event was provided" }
        }

        const actionType = (isPlay) ? 'ResumeAction' : 'SuspendAction';
        const now = new Date();
        const newControlAction = buildThing(createThing())
            .addUrl(RDF.type, SCHEMA_ORG + actionType)
            .addUrl(RDF.type, SCHEMA_ORG + 'ControlAction')
            .addUrl(SCHEMA_ORG + 'agent', session.info.webId)
            .addUrl(SCHEMA_ORG + 'object', eventUrl)
            .addDatetime(SCHEMA_ORG + 'startTime', now)
            .addStringNoLocale(SCHEMA_ORG + 'location', atLocationNumber.toString())
            .build();

        try {
            let roomDataset = await getSolidDataset(eventUrl);

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

            const savedDataset = await saveSolidDatasetAt(eventUrl, roomDataset);
            return savedDataset;
        } catch (error) {
            console.error(error)
        }
    }


    async getControlActionStream(session, eventUrl) {
        if (!inSession(session)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!eventUrl) {
            return { error: "no event url", errorMsg: "No event url was provided" }
        }

        /* NOTE(Elias): Asssumes controlActions and event are in the same file */
        const sparqlQuery = `
          PREFIX schema: <${SCHEMA_ORG}>
          SELECT ?controlAction ?actionType ?agent ?datetime ?location
          WHERE {
            ?controlAction a schema:ControlAction .
            ?controlAction a ?actionType .
            ?controlAction schema:agent ?agent .
            ?controlAction schema:object <${eventUrl}> .
            ?controlAction schema:startTime ?datetime .
            ?controlAction schema:location ?location .
          }
          `;
        const queryEngine = new IncQueryEngine();
        const resultStream = await queryEngine.queryBindings(sparqlQuery, { sources: [eventUrl] });
        return resultStream;
    }

    async getPauseTimeContext(session, watchingEvent) {
        if (!inSession(session)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!watchingEvent) {
            return { error: "no event url", errorMsg: "No event provided" }
        }

        try {
            const dataset = await getSolidDataset(watchingEvent?.eventUrl);
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
            console.log(error)
            return { error: error }
        }
    }

}

export default new EventsSolidService();
