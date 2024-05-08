/* library imports */
import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SessionProvider } from '@inrupt/solid-ui-react'

/* page imports */
import LoginPage from './pages/LoginPage';
import MenuPage from './pages/MenuPage';
import WatchPage from './pages/WatchPage';
import LandingPage from './pages/LandingPage';

/* context imports */
import { MessageBoxContext } from './contexts';

/* config imports */
import config from '../config';

const router = createBrowserRouter([
    {path: (config.baseDir + "/"), element: <LandingPage/>},
    {path: (config.baseDir + "/auth"), element: <LoginPage/>},
    {path: (config.baseDir + "/menu"), element: <MenuPage/>},
    {path: (config.baseDir + "/watch"), element: <WatchPage/>},
]);

function App() {
    const messageBox = useState(null);
    return (
        <SessionProvider>
            <MessageBoxContext.Provider value={messageBox}>
                    <RouterProvider router={router}/>
            </MessageBoxContext.Provider>
        </SessionProvider>
    );
}

export default App;

