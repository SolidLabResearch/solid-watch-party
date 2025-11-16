import { createContext } from 'react';

export const MessageBoxContext = createContext(null);
export const RoomContext = createContext(null);
export const SessionContext = createContext({
    session: { info: { isLoggedIn: false, webId: undefined } },
    sessionRequestInProgress: false,
    fetch: (...args) => fetch(...args),
    auth: undefined,
    aggregatorEnabled: false,
    setAggregatorEnabled: () => {},
});
