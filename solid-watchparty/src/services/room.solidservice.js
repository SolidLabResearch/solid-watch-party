/* library imports */
import {
    createSolidDataset,
    getSolidDataset,
    saveSolidDatasetAt,
    setThing,
    getThingAll,
    createThing,
    buildThing,
    asUrl,
} from '@inrupt/solid-client';
import { RDF } from "@inrupt/vocab-common-rdf";

/* util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';
import { getPodUrl, urlify } from '../utils/urlUtils';
import { inSession } from '../utils/solidUtils';

/* config imports */
import { ROOMS_ROOT, MESSAGES_ROOT } from '../config.js'


class RoomSolidService
{

    async createNewRoom(sessionContext, name)
    {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" };
        }

        const now = new Date();
        const newRoom = buildThing(buildThing())
            .addUrl(RDF.type, SCHEMA_ORG + 'EventSeries')
            .addStringNoLocale(SCHEMA_ORG + 'description', "Solid Watchparty")
            .addStringNoLocale(SCHEMA_ORG + 'name', name)
            .addUrl(SCHEMA_ORG + 'organizer', sessionContext.session.info.webId)
            .addDatetime(SCHEMA_ORG + 'startDate', now)
            .build();
        const dataset = setThing(createSolidDataset(), newRoom);
        const roomUrl = `${getPodUrl(sessionContext.session.info.webId)}/${ROOMS_ROOT}/${urlify(name + now.toISOString())}`;

        try {
            await saveSolidDatasetAt(roomUrl, dataset, {fetch: sessionContext.fetch});
            return { roomUrl: asUrl(newRoom, roomUrl) };
        } catch (error) {
            console.error('Error creating new room: ', error);
            return { error: error, errorMsg: 'error creating new room'};
        }
    }

    async joinRoom(sessionContext, roomUrl)
    {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!roomUrl) {
            return { error: "no url", errorMsg: "No url was provided" }
        }

        const messagesFileUrl = `${getPodUrl(sessionContext.session.info.webId)}/${MESSAGES_ROOT}/MSG${urlify(roomUrl)}`;

        try {
            const newOutbox = buildThing(createThing())
                .addUrl(RDF.type, SCHEMA_ORG + 'CreativeWorkSeries')
                .addUrl(SCHEMA_ORG + 'about', roomUrl)
                .addUrl(SCHEMA_ORG + 'creator', sessionContext.session.info.webId)
                .build();
            const outboxUrl = asUrl(newOutbox, messagesFileUrl);
            await saveSolidDatasetAt(outboxUrl, setThing(createSolidDataset(), newOutbox), {fetch: sessionContext.fetch});

            const roomFileUrl = roomUrl.split('#')[0]
            const roomDataset = await getSolidDataset(roomFileUrl, {fetch: sessionContext.fetch});
            const updatedRoom = buildThing(getThingAll(roomDataset)[0])
                .addUrl(SCHEMA_ORG + 'attendee', sessionContext.session.info.webId)
                .addUrl(SCHEMA_ORG + 'subjectOf', outboxUrl)
                .build();
            await saveSolidDatasetAt(roomFileUrl, setThing(roomDataset, updatedRoom), {fetch: sessionContext.fetch});

            return { roomUrl: asUrl(updatedRoom, roomFileUrl) };
        } catch (error) {
            return { error: error, errorMsg: 'Failed to join the room, make sure you have the correct url'};
        }
    }

}

export default new RoomSolidService();
