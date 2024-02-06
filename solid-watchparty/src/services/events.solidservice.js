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
import { QueryEngine } from '@incremunica/query-sparql-incremental';

/* util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';
import { getPodUrl, urlify } from '../utils/urlUtils';
import { doesResourceExist, inSession } from '../utils/solidUtils';

/* config imports */
import { ROOMS_ROOT, MESSAGES_ROOT } from '../config.js'

class EventsSolidService {

  async newWatchingEvent(session, roomUrl, dashLink) {
    if (!inSession(session)) {
      return { interrupt: "invalid session", interruptMsg: "Your session is invalid, log in again!" }
    } else if (!roomUrl) {
      return { interrupt: "no room url", interruptMsg: "No room url was provided" }
    } else if (!dashLink) {
      return { interrupt: "no video url", interruptMsg: "No video url was provided" }
    }

    let newVideoObject = buildThing(createThing())
      .addUrl(RDF.type, SCHEMA_ORG + 'VideoObject')
      .addUrl(SCHEMA_ORG + 'contentUrl', dashLink)
      .build();

    const roomFileUrl = roomUrl.split('#')[0];
    try {
      let roomDataset = await getSolidDataset(roomFileUrl);
      roomDataset = setThing(roomDataset, newVideoObject);

      const videoObjectUrl = asUrl(newVideoObject, roomFileUrl);
      const now = new Date();
      let newWatchingEvent = buildThing(createThing())
        .addUrl(RDF.type, SCHEMA_ORG + 'Event')
        .addDatetime(SCHEMA_ORG + 'startDate', now)
        .addUrl(SCHEMA_ORG + 'workFeatured', videoObjectUrl)
        .build();
      roomDataset = setThing(roomDataset, newWatchingEvent);
      console.log('hallo')

      await saveSolidDatasetAt(roomFileUrl, roomDataset);
    } catch (error) {
      console.log(error)
    }
  }

  async getVideoObjectStream(session, roomUrl) {
    if (!inSession(session)) {
      return { interrupt: "invalid session", interruptMsg: "Your session is invalid, log in again!" }
    } else if (!roomUrl) {
      return { interrupt: "no room url", interruptMsg: "No room url was provided" }
    }

    const sparqlQuery = `
PREFIX schema: <${SCHEMA_ORG}>
SELECT ?watchingEvent ?startDate ?videoObject ?dashLink
WHERE {
  ?watchingEvent a schema:Event .
  ?watchingEvent schema:startDate ?startDate .
  ?watchingEvent schema:workFeatured ?VideoObject .
  ?videoObject schema:contentUrl ?dashLink .
}
`;

    const queryEngine = new QueryEngine();
    const resultStream = await queryEngine.queryBindings(sparqlQuery, { sources: [roomUrl] });
    return resultStream;
  }

}

export default new EventsSolidService();






