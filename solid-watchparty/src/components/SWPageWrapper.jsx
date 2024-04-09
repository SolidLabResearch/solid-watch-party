/* libary imports */
import { useEffect } from 'react';
import { useSession } from "@inrupt/solid-ui-react";
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

/* component imports */
import SWNavbar from './SWNavbar'
import SWFooter from './SWFooter'
import SWLoadingIcon from './SWLoadingIcon';

/* util imports */
import { inSession } from '../utils/solidUtils';

/* config imports */
import config from '../../config';


/* NOTE(Elias): className has influence on how the component between the Navbar and footer is styled. */
function SWPageWrapper({children, className, mustBeAuthenticated})
{
    const sessionContext = useSession();
    const navigateTo = useNavigate();
    const currentLocation = useLocation();

    useEffect(() => {
        if (mustBeAuthenticated && !sessionContext.sessionRequestInProgress && !inSession(sessionContext)) {
            console.log('navigate back')
            navigateTo(`${config.baseDir}/`, {state: {from: currentLocation.pathname + currentLocation.search}});
        }
    }, [sessionContext, sessionContext.session, sessionContext.sessionRequestInProgress, currentLocation, navigateTo, mustBeAuthenticated])

    return (
        <div className="h-full flex flex-col justify-between">
            <SWNavbar/>
            <div className={"h-full w-full " + className}>
                { sessionContext.sessionRequestInProgress ? (
                    <div className="flex flex-col items-center">
                        <SWLoadingIcon className="w-6 h-6 mb-3"/>
                        <p className="sw-fw-1">Autenticating...</p>
                    </div>
                ) : (
                    children
                )}
            </div>
            <SWFooter/>
        </div>
    );
}

SWPageWrapper.propTypes = {
    children:               PropTypes.node,
    className:              PropTypes.string,
    mustBeAuthenticated:    PropTypes.bool.isRequired,
};

export default SWPageWrapper;
