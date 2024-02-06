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

    // 1. Create VideoObject
    let newVideoObject = buildThing(createThing())
      .addUrl(RDF.type, SCHEMA_ORG + 'VideoObject')
      .addUrl(SCHEMA_ORG + 'contentUrl', dashLink)
      .build();

    const roomFileUrl = roomUrl.split('#')[0];
    try {
      let roomDataset = await getSolidDataset(roomFileUrl);
      roomDataset = setThing(roomDataset, newVideoObject);
      await saveSolidDatasetAt(roomFileUrl, roomDataset);
    } catch (error) {
      console.log(error)
    }

    // 2. Create Watching Event and link the VideoObject


  }

}

export default new EventsSolidService();
