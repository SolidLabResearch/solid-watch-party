/* NOTE(Elias): libary imports */
import PropTypes from 'prop-types';
import { LoginButton } from '@inrupt/solid-ui-react';

function SWLoginButton(props)
{
  // TODO(Elias): At the moment it is possible to click inside the div and not on the button :(
  return (
    <div className={"sw-btn rgb-bg-3 rgb-3" + ' ' + props.className}>
      <LoginButton authOptions={props.authOptions} oidcIssuer={props.oidcIssuer}
        redirectUrl={props.redirectUrl} onError={console.error}/>
    </div>
  );
}

SWLoginButton.propTypes = {
    className:    PropTypes.string,
    authOptions:  PropTypes.object,
    oidcIssuer:   PropTypes.string,
    redirectUrl:  PropTypes.string
};

export default SWLoginButton;
