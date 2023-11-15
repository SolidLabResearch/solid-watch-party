/* NOTE(Elias): library imports */
import {
	createBrowserRouter,
	RouterProvider
} from 'react-router-dom';

/* NOTE(Elias): page imports */
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';


const router = createBrowserRouter([
	{path: "/",				element: <LoginPage/>},
	{path: "/home",		element: <HomePage/>},
]);

function App() {
	return (
			<RouterProvider router={router}/>
	);
}


export default App;
