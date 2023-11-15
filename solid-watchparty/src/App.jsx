/* NOTE(Elias): library imports */
import {
	createBrowserRouter,
	RouterProvider
} from 'react-router-dom';
import { SessionProvider } from '@inrupt/solid-ui-react'

/* NOTE(Elias): page imports */
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';


const router = createBrowserRouter([
	{path: "/",				element: <LoginPage/>},
	{path: "/home",		element: <HomePage/>},
]);

function App() {
	return (
			<SessionProvider>
				<RouterProvider router={router}/>
			</SessionProvider>
	);
}


export default App;
