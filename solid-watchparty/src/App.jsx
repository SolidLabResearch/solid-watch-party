/* library imports */
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SessionProvider } from '@inrupt/solid-ui-react'

/* page imports */
import LoginPage from './pages/LoginPage';
import MenuPage from './pages/MenuPage';
import WatchPage from './pages/WatchPage';


const router = createBrowserRouter([
  {path: "/", element: <LoginPage/>},
  {path: "/menu", element: <MenuPage/>},
  {path: "/watch", element: <WatchPage/>},
]);

function App() {
  return (
      <SessionProvider>
        <RouterProvider router={router}/>
      </SessionProvider>
  );
}

export default App;

