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

/* util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';
import { inSession } from '../utils/solidUtils';

class VideoSolidService {

    async getVideoObject(session, videoObjectUrl) {
        if (!inSession(session)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        }

        try {
            const dataset = await getSolidDataset(videoObjectUrl);
            return getThing(dataset, videoObjectUrl);
        } catch (error) {
            console.log(error)
            return {error: error}
        }
    }

}

export default new VideoSolidService();






