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
import { QueryEngine } from '@comunica/query-sparql';
import { QueryEngine as QueryEngineLT } from '@comunica/query-sparql-link-traversal';

/* util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';
import { getPodUrl, urlify, getDirectoryOfUrl } from '../utils/urlUtils';
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
        // check context
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" };
        }

        // initialise needed variables
        const now = new Date();
        const roomDirectoryUrl = `${getPodUrl(sessionContext.session.info.webId)}/${ROOMS_ROOT}/${urlify(name + now.toISOString())}`
        const roomUrl = `${roomDirectoryUrl}/room`
        const registerUrl = `${roomDirectoryUrl}/register`

        // build new room and add it to a new dataset
        const newRoom = buildThing(buildThing())
            .addUrl(RDF.type, SCHEMA_ORG + 'EventSeries')
            .addStringNoLocale(SCHEMA_ORG + 'description', "Solid Watchparty")
            .addStringNoLocale(SCHEMA_ORG + 'name', name)
            .addUrl(SCHEMA_ORG + 'organizer', sessionContext.session.info.webId)
            .addDatetime(SCHEMA_ORG + 'startDate', now)
            .build();
        let roomDataset = createSolidDataset()
        roomDataset = setThing(roomDataset, newRoom);

        // create new dataset for register actions
        const registerInboxDataset = createSolidDataset();

        try {
            // save the new room on the pod
            await saveSolidDatasetAt(roomUrl, roomDataset, {fetch: sessionContext.fetch});

            // save the new register dataset on the pod and set access control
            await saveSolidDatasetAt(registerUrl, registerInboxDataset, {fetch: sessionContext.fetch});
            const authResult = await universalAccess.setPublicAccess(
                registerUrl,
                {append: true},
                {fetch: sessionContext.fetch}
            );
            if (!authResult) {
                throw new Error("failed to set access control for register dataset");
            }

            return { roomUrl: asUrl(newRoom, roomUrl) };
        } catch (error) {
            console.error('Error creating new room: ', error);
            return { error: error, errorMsg: 'error creating new room'};
        }
    }

    async register(sessionContext, messageboxUrl, roomUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!roomUrl) {
            return { error: "no room directory url", errorMsg: "No url was provided" }
        }

        try {
            console.log(RDF.type)
            const engine = new QueryEngine();
            const result = await engine.query(`
                PREFIX schema: <${SCHEMA_ORG}>
                INSERT DATA {
                    ?p <${RDF.type}> schema:RegisterAction .
                    ?p schema:agent ${sessionContext.session.info.webId} .
                    ?p schema:actionStatus schema:ActiveActionStatus .
                    /P schema:additionalType ${messageboxUrl} .
                }`);

        // const roomDirectoryUrl = getDirectoryOfUrl(roomUrl);
        // try {
        //     const newRegister = buildThing(createThing())
        //         .addUrl(RDF.type, SCHEMA_ORG + 'RegisterAction')
        //         .addUrl(SCHEMA_ORG + 'agent', sessionContext.session.info.webId)
        //         .addUrl(SCHEMA_ORG + 'actionStatus', SCHEMA_ORG + 'ActiveActionStatus')
        //         .addUrl(SCHEMA_ORG + 'additionalType', messageboxUrl)
        //         .build();

        } catch (error) {
            console.error(error);
            return { error: error, errorMsg: 'Failed to register for the room'};
        }
    }

    async amIRegistered(sessionContext, roomUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!roomUrl) {
            return { error: "no room url", errorMsg: "No url was provided" }
        }

        try {
            await getSolidDataset(roomUrl, {fetch: sessionContext.fetch});
            return true;
        } catch (error) {
            if (error.response.status !== 403) {
                console.error(error);
                return {error: error, errorMsg: 'Failed to check if you are registered'};
            }
            return false;
        }
    }

    async addPerson(sessionContext, roomUrl, outboxUrl, webID) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!roomUrl) {
            return { error: "no room url", errorMsg: "No url was provided" }
        } else if (!outboxUrl) {
            return { error: "no outbox url", errorMsg: "No outbox url was provided" }
        } else if (!webID) {
            return { error: "no webID", errorMsg: "No webID was provided" }
        }

        // retrieve the dataset
        try {
            const roomDataset = await getSolidDataset(roomUrl, {fetch: sessionContext.fetch});

            // update the dataset
            const updatedRoom = buildThing(getThingAll(roomDataset)[0])
                .addUrl(SCHEMA_ORG + 'attendee', sessionContext.session.info.webId)
                .addUrl(SCHEMA_ORG + 'subjectOf', outboxUrl)
                .build();

            // save the dataset
            await saveSolidDatasetAt(roomUrl, setThing(roomDataset, updatedRoom), {fetch: sessionContext.fetch});

            // add person to auth group
        } catch (error) {
            return { error: error, errorMsg: 'Failed to add person to the room'};
        }
    }

    async getPeople(sessionContext, roomUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!roomUrl) {
            return { error: "No room url", errorMsg: "No url was provided" }
        }

        const queryEngine = new QueryEngineLT();
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

    async getActiveRegisterPeople(sessionContext, roomUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!roomUrl) {
            return { error: "No register url", errorMsg: "No register url was provided" }
        }

        const registerUrl = `${getDirectoryOfUrl(roomUrl)}/register`;

        const queryEngine = new QueryEngineLT();
        const resultStream = await queryEngine.queryBindings(`
            PREFIX schema: <${SCHEMA_ORG}>
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            SELECT ?messageBox ?webId ?name
            WHERE {
                ?registerAction schema:additionalType ?messageBox .
                ?registerAction schema:agent ?webId .
                ?webId foaf:name ?name .
            }`, {
                sources: [registerUrl],
                fetch: sessionContext.fetch,
            });
        const resultBindings = await resultStream.toArray()
        const result = resultBindings.map((binding) => {
            return ({
                messageBox: binding.get('messageBox').value,
                name: binding.get('name').value,
                webID: binding.get('webId').value,
            });
        });

        return result;
    }

}

export default new RoomSolidService();
