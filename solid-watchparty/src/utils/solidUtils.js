import {
    getSolidDataset,
    getSolidDatasetWithAcl,
    setGroupDefaultAccess,
} from '@inrupt/solid-client';
import { QueryEngine } from '@incremunica/query-sparql-incremental';

export function
inSession(sessionContext)
{
    const session = sessionContext.session;
	return session && session.info && session.info.isLoggedIn;
}

export async function setGroupAccess(resourceUrl, groupUrl, accessModes, sessionContext)
{
    const dataset = await getSolidDatasetWithAcl(resourceUrl, { fetch: sessionContext.fetch });
    if (!dataset || !dataset.acl) {
        throw new Error("Failed to get dataset or acl");
    }
    const acl_ = setGroupDefaultAccess(dataset.acl, groupUrl, accessModes);
    await saveAclFor(dataset, acl_, sessionContext);
}



