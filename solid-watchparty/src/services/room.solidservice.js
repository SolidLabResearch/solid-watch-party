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
    universalAccess,
} from '@inrupt/solid-client';
import { RDF } from "@inrupt/vocab-common-rdf";
import { QueryEngine } from '@comunica/query-sparql-link-traversal';

/* util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';
import { getPodUrl, urlify } from '../utils/urlUtils';
import { inSession } from '../utils/solidUtils';

/* config imports */
import { ROOMS_ROOT, MESSAGES_ROOT, REGISTERS_ROOT } from '../config.js'


class RoomSolidService
{

    /* NOTE(Elias):
     *
     * PLAN FOR ROOM IMPLEMENTATION!!!!!
     *
     * - Seperate file with append permissions for the register actions.
     * - The register actions will link to the EventSeries but not the other way around.
     * - This will be fixed later... with some goofy extra shit.
     *
     * */


    async createNewRoom(sessionContext, name)
    {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" };
        }

        const now = new Date();
        const roomUrl = `${getPodUrl(sessionContext.session.info.webId)}/${ROOMS_ROOT}/${urlify(name + now.toISOString())}`;
        let dataset = createSolidDataset();

        const newRegisterInbox = buildThing(createThing())
            .addUrl(RDF.type, SCHEMA_ORG + 'ItemList')
            .build();
        dataset = setThing(dataset, newRegisterInbox);
        const registerInboxUrl = asUrl(newRegisterInbox, roomUrl);

        const newRoom = buildThing(buildThing())
            .addUrl(RDF.type, SCHEMA_ORG + 'EventSeries')
            .addStringNoLocale(SCHEMA_ORG + 'description', "Solid Watchparty")
            .addStringNoLocale(SCHEMA_ORG + 'name', name)
            .addUrl(SCHEMA_ORG + 'organizer', sessionContext.session.info.webId)
            .addDatetime(SCHEMA_ORG + 'startDate', now)
            .addUrl(SCHEMA_ORG + 'about', registerInboxUrl)
            .build();
        dataset = setThing(dataset, newRoom);

        try {
            await saveSolidDatasetAt(roomUrl, dataset, {fetch: sessionContext.fetch});

            const authResult = await universalAccess.setPublicAccess(
                registerInboxUrl,
                {append: true},
                {fetch: sessionContext.fetch}
            );
            if (!authResult) {
                return { error: "auth error", errorMsg: "Failed to set access control for the room"};
            }

            return {
                roomUrl: asUrl(newRoom, roomUrl),
                registerUrl: registerInboxUrl
            };
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

    async getPeople(sessionContext, roomUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!roomUrl) {
            return { error: "No room url", errorMsg: "No url was provided" }
        }

        const queryEngine = new QueryEngine();
        const resultStream = await queryEngine.queryBindings(`
            PREFIX schema: <${SCHEMA_ORG}>
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            SELECT ?webId ?name
            WHERE {
                <${roomUrl}> schema:attendee ?webId .
                ?webId foaf:name ?name .
            }`, {
                sources: [roomUrl],
                fetch: sessionContext.fetch,
            });
        const resultBindings = await resultStream.toArray()
        const result = resultBindings.map((binding) => {
            return ({
                name: binding.get('name').value,
                webID: binding.get('webId').value,
            });
        });

        return result;
    }

    async register(sessionContext, registerUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!registerUrl) {
            return { error: "no register url", errorMsg: "No url was provided" }
        }

        try {
            let dataset = await getSolidDataset(registerUrl, {fetch: sessionContext.fetch});

            const newRegister = buildThing(createThing())
                .addUrl(RDF.type, SCHEMA_ORG + 'RegisterAction')
                .addUrl(SCHEMA_ORG + 'agent', sessionContext.session.info.webId)
                .addUrl(SCHEMA_ORG + 'actionStatus', SCHEMA_ORG + 'ActiveActionStatus')
                .build();
            dataset = setThing(dataset, newRegister);

            // update the register item list
            const registerItemList = getThingAll(dataset).filter((data) => {
                return data.url === registerUrl;
            })[0]

            console.log(registerItemList)

            await saveSolidDatasetAt(registerUrl, dataset, {fetch: sessionContext.fetch});
        } catch (error) {
            return { error: error, errorMsg: 'Failed to register for the room'};
        }
    }

    async getActiveRegisterPeople(sessionContext, registerUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!registerUrl) {
            return { error: "No register url", errorMsg: "No register url was provided" }
        }

        const queryEngine = new QueryEngine();
        const resultStream = await queryEngine.queryBindings(`
            PREFIX schema: <${SCHEMA_ORG}>
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            SELECT ?webId
            WHERE {
                <${registerUrl}> schema:agent ?webId .
            }`, {
                sources: [registerUrl],
                fetch: sessionContext.fetch,
            });
        const resultBindings = await resultStream.toArray()
        const result = resultBindings.map((binding) => {
            return ({
                name: binding.get('name').value,
                webID: binding.get('webId').value,
            });
        });

        return result;
    }

}

export default new RoomSolidService();
