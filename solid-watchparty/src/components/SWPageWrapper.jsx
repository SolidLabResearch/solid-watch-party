/* NOTE(Elias): Component imports */
import SWNavbar from './SWNavbar'
import SWFooter from './SWFooter'

/* NOTE(Elias): className has influence on how the component between the Navbar and footer
 * is styled. */
function SWPageWrapper({ children, className })
{
	return (
		<div className="h-full flex flex-col justify-between">
			<SWNavbar/>
			<div className={"h-full w-full " + className}>
				{children}
			</div>
			<SWFooter/>
		</div>
	);
}

export default SWPageWrapper;
