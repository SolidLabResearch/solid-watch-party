/* NOTE(Elias): libary imports */
import { useEffect } from 'react';
import { useSession } from "@inrupt/solid-ui-react";
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

/* NOTE(Elias): Component imports */
import SWNavbar from './SWNavbar'
import SWFooter from './SWFooter'

/* NOTE(Elias): Util imports */
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

  // TODO(Elias): Add loading icon
  return (
    <div className="h-full flex flex-col justify-between">
      <SWNavbar/>
      <div className={"h-full w-full " + className}>
        { sessionRequestInProgress ? (
            <p> Autenticating... </p>
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
