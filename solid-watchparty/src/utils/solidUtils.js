import { getSolidDataset, } from '@inrupt/solid-client';

export async function
doesResourceExist(url)
{
	try {
		await getSolidDataset(url);
		return { exists: true, error: null }
	} catch(error) {
		if (error.statusCode === 404) {
			return { exists: false, error: error }
		}
		return { error: error }
	}
}

export function
inSession(session)
{
	return !(!session || !session.info || !session.info.isLoggedIn);
}
