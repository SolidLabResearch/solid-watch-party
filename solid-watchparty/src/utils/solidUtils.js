import { getSolidDataset, } from '@inrupt/solid-client';
import { QueryEngine } from '@incremunica/query-sparql-incremental';

export async function
doesResourceExist(url)
{
	try {
		await getSolidDataset(url);
		return { exists: true, error: null }
	} catch(error) {
		if (error.statusCode === 404) {
			return { exists: false, error: null }
		}
		return { error: error }
	}
}

export function
inSession(sessionContext)
{
    const session = sessionContext.session;
	return session && session.info && session.info.isLoggedIn;
}
