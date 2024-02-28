/* library imports */
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SessionProvider } from '@inrupt/solid-ui-react'

/* page imports */
import LoginPage from './pages/LoginPage';
import MenuPage from './pages/MenuPage';
import WatchPage from './pages/WatchPage';

/* config imports */
import { BASEPATH } from './config'

const router = createBrowserRouter([
  {path: (BASEPATH + "/"), element: <LoginPage/>},
  {path: (BASEPATH + "/menu"), element: <MenuPage/>},
  {path: (BASEPATH + "/watch"), element: <WatchPage/>},
]);

function App() {
  return (
      <SessionProvider>
        <RouterProvider router={router}/>
      </SessionProvider>
  );
}

export default App;

