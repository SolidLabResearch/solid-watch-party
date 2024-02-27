/* library imports */
import {
  getSolidDataset,
  saveSolidDatasetAt,
  setThing,
  getThing,
  addUrl,
  createThing,
  buildThing,
  asUrl,
} from '@inrupt/solid-client';
import { RDF } from "@inrupt/vocab-common-rdf";
import { QueryEngine } from '@incremunica/query-sparql-incremental';

/* util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';
import { inSession } from '../utils/solidUtils';

class EventsSolidService {


  async newWatchingEvent(session, roomUrl, dashLink) {
    if (!inSession(session)) {
      return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
    } else if (!roomUrl) {
      return { error: "no room url", errorMsg: "No room url was provided" }
    } else if (!dashLink) {
      return { error: "no video url", errorMsg: "No video url was provided" }
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
      await saveSolidDatasetAt(roomFileUrl, roomDataset);
    } catch (error) {
      console.log(error)
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


  async saveControlAction(session, eventUrl, isPlay) {
    console.log('SAVE CONTROL ACTION:', isPlay, 'to', eventUrl)

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
      .addUrl(SCHEMA_ORG + 'agent', session.info.webId)
      .addUrl(SCHEMA_ORG + 'object', eventUrl)
      .addDatetime(SCHEMA_ORG + 'startTime', now)
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


}

export default new EventsSolidService();






