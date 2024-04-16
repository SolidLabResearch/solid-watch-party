
export function
inSession(sessionContext)
{
    const session = sessionContext.session;
	return session && session.info && session.info.isLoggedIn;
}

export function removeIdentifier(thingUri) {
    const index = thingUri.indexOf("#");
    if (index < 0) {
        return thingUri;
    }
    return thingUri.substring(0, index);
}

