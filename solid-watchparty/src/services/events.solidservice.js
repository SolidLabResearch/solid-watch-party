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
import { QueryEngine } from '@comunica/query-sparql';
import { QueryEngineBase } from '@comunica/actor-init-query';

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
            let roomDataset = await getSolidDataset(roomUrl, { fetch: sessionContext.fetch });
            if (!roomDataset) {
                return { error: "room dataset not found", errorMsg: "The specified room dataset was not found" }
            }

            let eventBuilder = buildThing(createThing())
                .addUrl(RDF.type, SCHEMA_ORG + 'Event')
                .addDatetime(SCHEMA_ORG + 'startDate', new Date());

            let addSourceObject = true;
            if (metaUrl) {
                let videoObject = await VideoSolidService.getVideoObject(sessionContext, metaUrl);
                if (!videoObject) {
                    return { error: "video object not found", errorMsg: "The specified video object was not found" }
                }
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

        const queryEngine = new QueryEngineBase(await (await import('../../engine-config/engine.js')).default());
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

        const queryEngine = new QueryEngineBase(await (await import('../../engine-config/engine.js')).default());
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

    async getLastPause(sessionContext, watchingEvent) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!watchingEvent) {
            return { error: "no event url", errorMsg: "No event provided" }
        }

        const file = watchingEvent.eventUrl;
        const queryEngine = new QueryEngine();
        try {
            const resultStream = await queryEngine.queryBindings(`
                PREFIX schema: <${SCHEMA_ORG}>
                SELECT ?controlAction ?actionType ?agent ?datetime ?location
                WHERE {
                    ?controlAction a schema:ControlAction .
                    ?controlAction a ?actionType .
                    ?controlAction schema:agent ?agent .
                    ?controlAction schema:object <${watchingEvent.eventUrl}> .
                    ?controlAction schema:startTime ?datetime .
                    ?controlAction schema:location ?location .
                    FILTER (?actionType IN (schema:ResumeAction, schema:SuspendAction))
                }
                ORDER BY DESC(?datetime)
                LIMIT 1
                `, {
                    sources: [file],
                    fetch: sessionContext.fetch
                });
            const resultBindings = await resultStream.toArray();
            if (resultBindings.length === 0) {
                return null;
            }
            const lastPauseBinding = resultBindings[0];
            const lastPause = {
                isPlaying:      lastPauseBinding.get('actionType').value  === `${SCHEMA_ORG}ResumeAction`,
                datetime:       new Date(lastPauseBinding.get('datetime').value),
                location:       parseFloat(lastPauseBinding.get('location').value),
            }
            return lastPause;
        } catch (error) {
            console.error(error)
            return { error: error }
        }
    }

}

export default new EventsSolidService();
