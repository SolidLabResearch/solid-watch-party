/* library imports */
import { getSolidDataset, getThing, } from '@inrupt/solid-client';

/* util imports */
import { inSession } from '../utils/solidUtils';

class VideoSolidService {

    async getVideoObject(sessionContext, videoObjectUrl) {
        if (!inSession(sessionContext)) {
            return { error: "invalid session", errorMsg: "Your session is invalid, log in again!" }
        }
        try {
            const dataset = await getSolidDataset(videoObjectUrl, { fetch: sessionContext.fetch });
            return getThing(dataset, videoObjectUrl);
        } catch (error) {
            console.error(error)
            return {error: error}
        }
    }

}

export default new VideoSolidService();






