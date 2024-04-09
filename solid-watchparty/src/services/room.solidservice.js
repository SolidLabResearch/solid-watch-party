/* library imports */
import {
    createSolidDataset,
    getSolidDataset,
    saveSolidDatasetAt,
    setThing,
    buildThing,
    asUrl,
    universalAccess,
} from '@inrupt/solid-client';
import { RDF } from "@inrupt/vocab-common-rdf";
import { QueryEngine as QueryEngineLT } from '@comunica/query-sparql-link-traversal';

/* util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';
import { getPodUrl, urlify, getDirectoryOfUrl } from '../utils/urlUtils';
import { inSession } from '../utils/solidUtils';
import { sprql_patch } from '../utils/queryUtils';

/* config imports */
import { ROOMS_ROOT, } from '../config.js'


class RoomSolidService
{

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

    async register(sessionContext, messageBoxUrl, roomUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!roomUrl) {
            return { error: "no room directory url", errorMsg: "No url was provided" }
        }
        try {
            const id = `${urlify(sessionContext.session.info.webId)}`
            const file = `${getDirectoryOfUrl(roomUrl)}/register`
            const query = `
                PREFIX schema: <${SCHEMA_ORG}>
                INSERT DATA {
                    <${file}#${id}> a schema:RegisterAction .
                    <${file}#${id}> schema:agent <${sessionContext.session.info.webId}> .
                    <${file}#${id}> schema:object <${roomUrl}> .
                    <${file}#${id}> schema:actionStatus schema:ActiveActionStatus .
                    <${file}#${id}> schema:additionalType <${messageBoxUrl}> .
                }`;
            const result = await sprql_patch(sessionContext, file, query);
            return result;
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

    async addPerson(sessionContext, roomUrl, messageBoxUrl, webId) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        } else if (!roomUrl) {
            return { error: "no room url", errorMsg: "No url was provided" }
        } else if (!messageBoxUrl) {
            return { error: "no outbox url", errorMsg: "No outbox url was provided" }
        } else if (!webId) {
            return { error: "no webID", errorMsg: "No webID was provided" }
        }
        try {
            const roomResource = roomUrl;
            const roomQuery = `
                PREFIX schema: <${SCHEMA_ORG}>
                INSERT DATA {
                    <${roomResource}> schema:attendee <${webId}> .
                    <${roomResource}> schema:subjectOf <${messageBoxUrl}> .
                }`;
            const roomResult = await sprql_patch(sessionContext, roomResource, roomQuery);
            if (!roomResult.ok) {
                throw new Error("failed to add person to the room");
            }
            const registerResource = `${getDirectoryOfUrl(roomUrl)}/register`;
            const registerId = `${urlify(webId)}`
            const registerDeleteQuery = `
                PREFIX schema: <${SCHEMA_ORG}>
                DELETE DATA {
                    <${registerResource}#${registerId}> schema:actionStatus schema:ActiveActionStatus .
                }`;
            const registerPatchQuery = `
                PREFIX schema: <${SCHEMA_ORG}>
                INSERT DATA {
                    <${registerResource}#${registerId}> schema:actionStatus schema:CompletedActionStatus .
                }`;
            const registerDeleteResult = await sprql_patch(sessionContext, registerResource, registerDeleteQuery);
            if (!registerDeleteResult || registerDeleteResult.error || !registerDeleteResult.ok) {
                console.error(registerDeleteResult);
                throw new Error("failed to delete old registration status");
            }
            const registerPatchResult = await sprql_patch(sessionContext, registerResource, registerPatchQuery);
            if (!registerPatchResult || registerPatchResult.error || !registerPatchResult.ok) {
                console.error(registerDeleteResult);
                throw new Error("failed to update registration status");
            }
            const access = await universalAccess.setAgentAccess(roomUrl, webId,
                                                                {read: true, write: true, append: true},
                                                                {fetch: sessionContext.fetch});
            console.log(access);
            return access;
        } catch (error) {
            console.error(error);
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
                OPTIONAL { ?webId foaf:name ?name . }
            }`, {
                sources: [roomUrl],
                fetch: sessionContext.fetch,
            });
        const resultBindings = await resultStream.toArray()
        const result = resultBindings.map((binding) => {
            let name = binding.get('name');
            name = name ? name.value : '[Anonymous]';
            return ({
                name: name,
                webId: binding.get('webId').value,
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

        const file = `${getDirectoryOfUrl(roomUrl)}/register`;
        const queryEngine = new QueryEngineLT();
        const resultStream = await queryEngine.queryBindings(`
            PREFIX schema: <${SCHEMA_ORG}>
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            SELECT ?webId ?messageBoxUrl ?name
            WHERE {
                ?registerAction a schema:RegisterAction .
                ?registerAction schema:object <${roomUrl}> .
                ?registerAction schema:actionStatus schema:ActiveActionStatus .
                ?registerAction schema:additionalType ?messageBoxUrl .
                ?registerAction schema:agent ?webId .
                OPTIONAL { ?webId foaf:name ?name . }
            }`, {
                sources: [file],
                fetch: sessionContext.fetch,
                lenient: true,
            });
        const resultBindings = await resultStream.toArray()
        const result = resultBindings.map((binding) => {
            let name = binding.get('name');
            name = name ? name.value : '[Anonymous]';
            return ({
                name: name,
                webId: binding.get('webId').value,
                messageBoxUrl: binding.get('messageBoxUrl').value,
            });
        });
        return result;
    }

}

export default new RoomSolidService();
