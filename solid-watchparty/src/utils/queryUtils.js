

export async function sprql_patch(sessionContext, endpoint, query) {
    const result = await sessionContext.fetch(endpoint, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/sparql-update',
        },
        body: query,
    });
    return result;
}


