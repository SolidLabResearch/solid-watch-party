/* libary imports */
import { LoginButton } from '@inrupt/solid-ui-react';
import PropTypes from 'prop-types';
import { FaChevronRight } from 'react-icons/fa';

function SWLoginButton(props)
{
  return (
      <></>
  );
}

SWLoginButton.propTypes = {
    className:    PropTypes.string,
    authOptions:  PropTypes.object,
    oidcIssuer:   PropTypes.string,
    redirectUrl:  PropTypes.string
};

export default SWLoginButton;
