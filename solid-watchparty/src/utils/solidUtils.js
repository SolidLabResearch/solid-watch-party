
export function
inSession(sessionContext)
{
    const session = sessionContext.session;
	return session && session.info && session.info.isLoggedIn;
}

