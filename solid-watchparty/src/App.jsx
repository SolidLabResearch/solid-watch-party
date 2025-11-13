/* library imports */
import { useState, useEffect, useRef } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
/* page imports */
import LoginPage from './pages/LoginPage';
import MenuPage from './pages/MenuPage';
import WatchPage from './pages/WatchPage';
import LandingPage from './pages/LandingPage';
/* context imports */
import { MessageBoxContext, SessionContext } from './contexts';
/* config imports */
import config from '../config';
/* auth util */
import { Auth } from './utils/auth.js';

const pathFromBase = (p) => (config.baseDir === '/' ? p : (config.baseDir + p));
const router = createBrowserRouter([
    {path: pathFromBase('/'), element: <LandingPage/>},
    {path: pathFromBase('/auth'), element: <LoginPage/>},
    {path: pathFromBase('/menu'), element: <MenuPage/>},
    {path: pathFromBase('/watch'), element: <WatchPage/>},
]);

function App() {
    const messageBox = useState(null);
    const [sessionInfo, setSessionInfo] = useState({ isLoggedIn: false, webId: undefined });
    const [sessionRequestInProgress, setSessionRequestInProgress] = useState(true);
    const [aggregatorEnabled, setAggregatorEnabled] = useState(() => {
        try { return JSON.parse(localStorage.getItem('aggregatorEnabled') || 'false'); } catch { return false; }
    });
    const authRef = useRef(null);
    if (!authRef.current) authRef.current = new Auth();

    useEffect(() => {
        localStorage.setItem('aggregatorEnabled', JSON.stringify(aggregatorEnabled));
    }, [aggregatorEnabled]);

    useEffect(() => {
        (async () => {
            try {
                const started = await authRef.current.initSessionFromRedirect();
                // If tokens obtained we consider logged in
                if (started || authRef.current.WebId) {
                    setSessionInfo({ isLoggedIn: true, webId: authRef.current.WebId });
                }
            } catch (e) {
                // stay logged out
                console.warn('OIDC init error', e);
            } finally {
                setSessionRequestInProgress(false);
            }
        })();
    }, []);

    const sessionContextValue = {
        session: { info: sessionInfo },
        sessionRequestInProgress,
        fetch: authRef.current.fetch.bind(authRef.current),
        auth: authRef.current,
        aggregatorEnabled,
        setAggregatorEnabled,
    };

    return (
        <SessionContext.Provider value={sessionContextValue}>
            <MessageBoxContext.Provider value={messageBox}>
                <RouterProvider router={router}/>
            </MessageBoxContext.Provider>
        </SessionContext.Provider>
    );
}

export default App;
