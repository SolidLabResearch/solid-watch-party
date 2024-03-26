import { getSolidDataset, } from '@inrupt/solid-client';
import { QueryEngine } from '@incremunica/query-sparql-incremental';

export function
inSession(sessionContext)
{
    const session = sessionContext.session;
	return session && session.info && session.info.isLoggedIn;
}
