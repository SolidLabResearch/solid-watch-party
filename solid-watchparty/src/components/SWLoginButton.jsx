/* libary imports */
import { LoginButton } from '@inrupt/solid-ui-react';
import PropTypes from 'prop-types';

function SWLoginButton(props)
{
  return (
      <LoginButton authOptions={props.authOptions} oidcIssuer={props.oidcIssuer}
        redirectUrl={props.redirectUrl} onError={console.error}>
        <button className={"sw-btn rgb-bg-3 rgb-3" + ' ' + props.className}>Log In</button>
      </LoginButton>
  );
}

SWLoginButton.propTypes = {
    className:    PropTypes.string,
    authOptions:  PropTypes.object,
    oidcIssuer:   PropTypes.string,
    redirectUrl:  PropTypes.string
};

export default SWLoginButton;
