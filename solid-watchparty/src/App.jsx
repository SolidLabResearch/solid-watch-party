/* library imports */
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SessionProvider } from '@inrupt/solid-ui-react'

import LoginPage from './pages/LoginPage';
import MenuPage from './pages/MenuPage';
import WatchPage from './pages/WatchPage';

/* config imports */
import config from '../config';

export const router = createBrowserRouter([
  {path: (config.baseDir + "/"), element: <LoginPage/>},
  {path: (config.baseDir + "/menu"), element: <MenuPage/>},
  {path: (config.baseDir + "/watch"), element: <WatchPage/>},
]);

function App() {
  return (
      <SessionProvider>
        <RouterProvider router={router}/>
      </SessionProvider>
  );
}

export default App;

