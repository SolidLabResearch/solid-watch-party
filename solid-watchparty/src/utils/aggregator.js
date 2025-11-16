class Aggregator {
    aggregatorUrl = 'http://localhost:5000/';

    async waitForAggregatorReady(authFetch, id) {
        const maxRetries = 20;
        const delay = 1000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await authFetch(`${this.aggregatorUrl}${id}/`);
                if (response.ok) {
                    return;
                }
            } catch (e) {
                // Ignore errors and retry
            }
            console.log(`Aggregator not ready, retrying in ${delay / 1000} seconds... (Attempt ${attempt}/${maxRetries})`);
            await new Promise(res => setTimeout(res, delay));
        }
        throw new Error('Aggregator service is not available after multiple attempts.');
    }

    async createAggregatorService(authFetch, FnoDescription){
        const response = await authFetch(`${this.aggregatorUrl}config/actors`, {
            method: "POST",
            headers: {
                "content-type": "text/turtle"
            },
            body: FnoDescription,
        });
        if (!response.ok) {
            throw new Error(`Failed to configure aggregator: ${await response.text()}`);
        }
        return (await response.json()).id;
    }

    // Remove all cached aggregator stage IDs
    invalidateAggregatorCache() {
        try {
            this.invalidateOverviewCache()
            this.invalidateMessageCache()
        } catch {}
    }

    invalidateOverviewCache() {
        try {
            localStorage.removeItem('messageLocationsServiceId');
            localStorage.removeItem('messageBoxesServiceId');
            localStorage.removeItem('overviewServiceId');
        } catch {}
    }

    // Create the full chain sequentially in background
    createChainInBackground(sessionContext, messageContainer) {
        (async () => {
            try {
                const messageLocationsId = await this.createAggregatorService(sessionContext.fetch, fnoConfMessageLocations.replace(
                    "$MessageContainer$",
                    messageContainer
                ));
                await this.waitForAggregatorReady(sessionContext.fetch, messageLocationsId);
                localStorage.setItem('messageLocationsServiceId', messageLocationsId);

                const messageBoxesId = await this.createAggregatorService(sessionContext.fetch, fnoConfMessageBoxes.replace(
                    "$MessageLocationsQueryResultLocation$",
                    `${this.aggregatorUrl}${messageLocationsId}/`
                ));
                await this.waitForAggregatorReady(sessionContext.fetch, messageBoxesId);
                localStorage.setItem('messageBoxesServiceId', messageBoxesId);

                const roomId = await this.createAggregatorService(sessionContext.fetch, fnoConfRooms.replace(
                    "$MessageBoxesQueryResultLocation$",
                    `${this.aggregatorUrl}${messageBoxesId}/`
                ));
                await this.waitForAggregatorReady(sessionContext.fetch, roomId);
                localStorage.setItem('overviewServiceId', roomId);
            } catch (e) {
                console.warn('Background creation of aggregator chain failed', e);
            }
        })();
    }

    async getOverviewService(sessionContext) {
        // Determine user-specific container
        const u = new URL(sessionContext.session.info.webId);
        const podName = `${u.origin}${u.pathname.replace(/\/profile\/card\/?$/, '')}`;
        const messageContainer = `${podName}/watchparties/myMessages/`;

        const fetchServiceResults = async (id) => {
            const response = await sessionContext.fetch(`${this.aggregatorUrl}${id}/`, {
                method: 'GET',
                headers: { 'Accept': 'application/sparql-results+json' }
            });
            if (!response.ok) {
                const err = new Error(`Failed to get aggregator service results (${response.status}): ${await response.text()}`);
                // @ts-ignore attach status for callers
                err.status = response.status;
                throw err;
            }
            return await response.json();
        };

        const normalize = (s) => typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '';

        const getOrFindId = async (cacheKey, predicate) => {
            let id = localStorage.getItem(cacheKey);
            if (id) {
                const res = await sessionContext.fetch(`${this.aggregatorUrl}config/actors/${id}`);
                if (res.ok) return id;
                localStorage.removeItem(cacheKey);
            }
            try {
                const response = await sessionContext.fetch(`${this.aggregatorUrl}config/actors`);
                if (!response.ok) {
                    // Aggregator likely unavailable or reset; clear caches and bail
                    this.invalidateOverviewCache();
                    try { console.warn('Aggregator actors query failed:', await response.text()); } catch {}
                    return null;
                }
                const { actors } = await response.json();
                for (const actorId of actors) {
                    const res = await sessionContext.fetch(`${this.aggregatorUrl}config/actors/${actorId}`);
                    if (!res.ok) continue;
                    const actor = await res.json();
                    const transformation = typeof actor.transformation === 'string' ? normalize(actor.transformation) : '';
                    if (predicate(transformation)) {
                        localStorage.setItem(cacheKey, actorId);
                        return actorId;
                    }
                }
            } catch (e) {
                console.warn('Failed to scan aggregator actors', e);
            }
            return null;
        };

        // Discover existing services
        const mlId = await getOrFindId(
            'messageLocationsServiceId',
            (t) => t.includes(normalize(queryMessageLocations)) && t.includes(messageContainer)
        );
        const mlResultUrl = mlId ? `${this.aggregatorUrl}${mlId}/` : undefined;
        const mbId = await getOrFindId(
            'messageBoxesServiceId',
            (t) => t.includes(normalize(queryMessageBoxes)) && (mlResultUrl ? t.includes(mlResultUrl) : true)
        );
        const mbResultUrl = mbId ? `${this.aggregatorUrl}${mbId}/` : undefined;
        const roomsId = await getOrFindId(
            'overviewServiceId',
            (t) => t.includes(normalize(queryRooms)) && (mbResultUrl ? t.includes(mbResultUrl) : true)
        );

        // If any stage is missing, re-create full chain in background and ask caller to retry
        if (!mlId || !mbId || !roomsId) {
            // Invalidate partial caches to avoid stale IDs
            this.invalidateOverviewCache();
            this.createChainInBackground(sessionContext, messageContainer);
            throw new Error('Aggregator initializing: rebuilding services. Please retry shortly.');
        }

        // All three exist; try returning results. If not ready or gone (404), rebuild and signal retry
        try {
            return await fetchServiceResults(roomsId);
        } catch (e) {
            if (e && typeof e === 'object' && 'status' in e && (e.status === 404 || e.status === 410)) {
                // Services likely removed; rebuild
                this.invalidateOverviewCache();
                this.createChainInBackground(sessionContext, messageContainer);
                throw new Error('Aggregator was removed; rebuilding services. Please retry shortly.');
            }
            // Not a clear removal signal; wait in background and ask to retry
            (async () => { try { await this.waitForAggregatorReady(sessionContext.fetch, roomsId); } catch {} })();
            throw new Error('Aggregator services exist but are not ready yet. Please retry shortly.');
        }
    }

    invalidateMessageCache(roomUrl) {
        try {
            localStorage.removeItem(`roomLookupServiceId:${roomUrl}`);
            localStorage.removeItem(`messagesServiceId:${roomUrl}`);
        } catch {}
    }

    createMessageChainInBackground(sessionContext, roomUrl) {
        (async () => {
            try {
                const roomLookupId = await this.createAggregatorService(
                    sessionContext.fetch,
                    fnoConfRoom.replace("$room$", roomUrl)
                );
                await this.waitForAggregatorReady(sessionContext.fetch, roomLookupId);
                localStorage.setItem(`roomLookupServiceId:${roomUrl}`, roomLookupId);

                const messagesId = await this.createAggregatorService(
                    sessionContext.fetch,
                    fnoConfMessages.replace(
                        "$MessageLocationsQueryResultLocation$",
                        `${this.aggregatorUrl}${roomLookupId}/`
                    )
                );
                await this.waitForAggregatorReady(sessionContext.fetch, messagesId);
                localStorage.setItem(`messagesServiceId:${roomUrl}`, messagesId);
            } catch (e) {
                console.warn('Background creation of message chain failed', e);
            }
        })();
    }

    async getMessageService(sessionContext, roomUrl) {
        const fetchServiceResults = async (id) => {
            const response = await sessionContext.fetch(`${this.aggregatorUrl}${id}/`, {
                method: 'GET',
                headers: { 'Accept': 'application/sparql-results+json' }
            });
            if (!response.ok) {
                const err = new Error(`Failed to get aggregator service results (${response.status}): ${await response.text()}`);
                // @ts-ignore attach status for callers
                err.status = response.status;
                throw err;
            }
            return await response.json();
        };

        const normalize = (s) => typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '';

        const getOrFindId = async (cacheKey, predicate) => {
            let id = localStorage.getItem(cacheKey);
            if (id) {
                const res = await sessionContext.fetch(`${this.aggregatorUrl}config/actors/${id}`);
                if (res.ok) return id;
                localStorage.removeItem(cacheKey);
            }
            try {
                const response = await sessionContext.fetch(`${this.aggregatorUrl}config/actors`);
                if (!response.ok) {
                    // Aggregator likely unavailable or reset; clear caches and bail
                    this.invalidateMessageCache(roomUrl);
                    try { console.warn('Aggregator actors query failed:', await response.text()); } catch {}
                    return null;
                }
                const { actors } = await response.json();
                for (const actorId of actors) {
                    const res = await sessionContext.fetch(`${this.aggregatorUrl}config/actors/${actorId}`);
                    if (!res.ok) continue;
                    const actor = await res.json();
                    const transformation = typeof actor.transformation === 'string' ? normalize(actor.transformation) : '';
                    if (predicate(transformation)) {
                        localStorage.setItem(cacheKey, actorId);
                        return actorId;
                    }
                }
            } catch (e) {
                console.warn('Failed to scan aggregator actors', e);
            }
            return null;
        };

        // Discover existing services for this room
        const roomLookupId = await getOrFindId(
            `roomLookupServiceId:${roomUrl}`,
            (t) => t.includes(normalize(queryRoom)) && t.includes(roomUrl)
        );
        const roomResultUrl = roomLookupId ? `${this.aggregatorUrl}${roomLookupId}/` : undefined;

        const messagesId = await getOrFindId(
            `messagesServiceId:${roomUrl}`,
            (t) => t.includes(normalize(queryMessages)) && (roomResultUrl ? t.includes(roomResultUrl) : true)
        );

        // If any stage is missing, re-create chain and ask caller to retry
        if (!roomLookupId || !messagesId) {
            this.invalidateMessageCache(roomUrl);
            this.createMessageChainInBackground(sessionContext, roomUrl);
            throw new Error('Aggregator initializing for room: rebuilding services. Please retry shortly.');
        }

        // Try returning results. If not ready or gone (404), rebuild and signal retry
        try {
            return await fetchServiceResults(messagesId);
        } catch (e) {
            if (e && typeof e === 'object' && 'status' in e && (e.status === 404 || e.status === 410)) {
                this.invalidateMessageCache(roomUrl);
                this.createMessageChainInBackground(sessionContext, roomUrl);
                throw new Error('Aggregator for this room was removed; rebuilding services. Please retry shortly.');
            }
            (async () => { try { await this.waitForAggregatorReady(sessionContext.fetch, messagesId); } catch {} })();
            throw new Error('Aggregator services for this room exist but are not ready yet. Please retry shortly.');
        }
    }

    // Check if the per-room message chain exists and is responding without creating anything
    async isMessageServiceReady(sessionContext, roomUrl) {
        const normalize = (s) => typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '';

        const getOrFindId = async (cacheKey, predicate) => {
            let id = localStorage.getItem(cacheKey);
            if (id) {
                const res = await sessionContext.fetch(`${this.aggregatorUrl}config/actors/${id}`);
                if (res.ok) return id;
                localStorage.removeItem(cacheKey);
            }
            try {
                const response = await sessionContext.fetch(`${this.aggregatorUrl}config/actors`);
                if (!response.ok) {
                    return null;
                }
                const { actors } = await response.json();
                for (const actorId of actors) {
                    const res = await sessionContext.fetch(`${this.aggregatorUrl}config/actors/${actorId}`);
                    if (!res.ok) continue;
                    const actor = await res.json();
                    const transformation = typeof actor.transformation === 'string' ? normalize(actor.transformation) : '';
                    if (predicate(transformation)) {
                        localStorage.setItem(cacheKey, actorId);
                        return actorId;
                    }
                }
            } catch (e) {
                return null;
            }
            return null;
        };

        // Discover existing services for this room without creating
        const roomLookupId = await getOrFindId(
            `roomLookupServiceId:${roomUrl}`,
            (t) => t.includes(normalize(queryRoom)) && t.includes(roomUrl)
        );
        if (!roomLookupId) return false;

        const roomResultUrl = `${this.aggregatorUrl}${roomLookupId}/`;
        const messagesId = await getOrFindId(
            `messagesServiceId:${roomUrl}`,
            (t) => t.includes(normalize(queryMessages)) && t.includes(roomResultUrl)
        );
        if (!messagesId) return false;

        try {
            const resp = await sessionContext.fetch(`${this.aggregatorUrl}${messagesId}/`, {
                method: 'GET',
                headers: { 'Accept': 'application/sparql-results+json' }
            });
            return resp.ok;
        } catch {
            return false;
        }
    }
}

const prefixes = `
@prefix trans: <http://localhost:5000/config/transformations#> .
@prefix fno: <https://w3id.org/function/ontology#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
`;

// ---- Overview page queries ----
const queryMessageLocations = `PREFIX ldp: <http://www.w3.org/ns/ldp#>
SELECT ?messageLocations WHERE {
    ?folder ldp:contains ?messageLocations .
}`;

const queryMessageBoxes = `PREFIX schema: <http://schema.org/>
SELECT ?roomUrl ?messageBox ?endDate WHERE {
  ?messageBox a schema:CreativeWorkSeries .
  ?messageBox schema:about ?roomUrl.
  OPTIONAL {
    ?messageBox schema:endDate ?endDate .
  }
}`;

const queryRooms = `PREFIX schema: <http://schema.org/>
SELECT ?room ?name ?organizer ?startDate ?endDate ?thumbnailUrl (COUNT(DISTINCT ?members) AS ?membersCount) WHERE {
  ?room a schema:EventSeries .
  ?room schema:name ?name .
  ?room schema:organizer ?organizer .
  ?room schema:startDate ?startDate .
  OPTIONAL { ?room schema:image ?thumbnailUrl . }
  OPTIONAL { ?room schema:endDate ?endDate . }
  OPTIONAL { ?room schema:attendee ?members . }
} GROUP BY ?room ?name ?organizer ?startDate ?endDate ?thumbnailUrl`;

const fnoConfMessageLocations = `${prefixes}
_:MessageLocationsQuery
    a fno:Execution ;
    fno:executes trans:SPARQLEvaluation ;
    trans:queryString """${queryMessageLocations}"""^^xsd:string ;
    trans:sources ( "$MessageContainer$"^^xsd:string ) .
`;

const fnoConfMessageBoxes = `${prefixes}
_:MessageLocationsResultsSource
    a trans:SPARQLQueryResultSource ;
    trans:sparqlQueryResult <$MessageLocationsQueryResultLocation$> ;
    trans:extractVariables ( "messageLocations" ) .

_:MessageBoxesQuery
    a fno:Execution ;
    fno:executes trans:SPARQLEvaluation ;
    trans:queryString """${queryMessageBoxes}"""^^xsd:string ;
    trans:sources ( _:MessageLocationsResultsSource ) .
`;

const fnoConfRooms = `${prefixes}
_:MessageBoxesResultsSource
    a trans:SPARQLQueryResultSource ;
    trans:sparqlQueryResult <$MessageBoxesQueryResultLocation$> ;
    trans:extractVariables ( "roomUrl" ) .

_:RoomsQuery
    a fno:Execution ;
    fno:executes trans:SPARQLEvaluation ;
    trans:queryString """${queryRooms}"""^^xsd:string ;
    trans:sources ( _:MessageBoxesResultsSource ) .
`;

// ---- Watch page queries ----

const queryRoom = `PREFIX schema: <http://schema.org/>
SELECT ?messageBoxUrl
WHERE {
  ?eventSeries a schema:EventSeries .
  ?eventSeries schema:subjectOf ?messageBoxUrl .
}`;

const queryMessages = `PREFIX schema: <http://schema.org/>
SELECT ?messageBoxUrl ?message ?dateSent ?text ?sender
WHERE {
    ?messageBoxUrl schema:hasPart ?message .
    ?message a schema:Message .
    ?message schema:dateSent ?dateSent .
    ?message schema:text ?text .
    ?message schema:sender ?sender .
}
`;

const fnoConfRoom = `${prefixes}
_:MessageLocationsQuery
    a fno:Execution ;
    fno:executes trans:SPARQLEvaluation ;
    trans:queryString """${queryRoom}"""^^xsd:string ;
    trans:sources ( "$room$"^^xsd:string ) .
`;

const fnoConfMessages = `${prefixes}
_:MessageLocationsResultsSource
    a trans:SPARQLQueryResultSource ;
    trans:sparqlQueryResult <$MessageLocationsQueryResultLocation$> ;
    trans:extractVariables ( "messageBoxUrl" ) .

_:MessageBoxesQuery
    a fno:Execution ;
    fno:executes trans:SPARQLEvaluation ;
    trans:queryString """${queryMessages}"""^^xsd:string ;
    trans:sources ( _:MessageLocationsResultsSource ) .
`;

export default Aggregator;

