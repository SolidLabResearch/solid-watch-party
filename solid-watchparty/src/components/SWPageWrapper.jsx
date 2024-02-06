/* libary imports */
import { useEffect } from 'react';
import { useSession } from "@inrupt/solid-ui-react";
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

/* component imports */
import SWNavbar from './SWNavbar'
import SWFooter from './SWFooter'
import SWLoadingIcon from './SWLoadingIcon';

/* util imports */
import { inSession } from '../utils/solidUtils';


/* NOTE(Elias): className has influence on how the component between the Navbar and footer is styled. */
function SWPageWrapper({children, className, mustBeAuthenticated})
{
  const { session, sessionRequestInProgress } = useSession();
  const navigateTo = useNavigate();

  useEffect(() => {
    if (mustBeAuthenticated && !sessionRequestInProgress && !inSession(session)) {
      navigateTo('/');
    }
  }, [session, sessionRequestInProgress])

  return (
    <div className="h-full flex flex-col justify-between">
      <SWNavbar/>
      <div className={"h-full w-full " + className}>
        { sessionRequestInProgress ? (
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
    children:               PropTypes.object,
    className:              PropTypes.string,
    mustBeAuthenticated:    PropTypes.bool.isRequired,
};

export default SWPageWrapper;
