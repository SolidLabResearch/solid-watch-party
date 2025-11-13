/* libary imports */
import PropTypes from 'prop-types';
import { FaChevronRight } from 'react-icons/fa';
import { useSession } from '../hooks/useSession';

function SWLoginButton({ oidcIssuer, redirectUrl, setError }) {
  const sessionContext = useSession();
  const onClick = async () => {
    setError?.('');
    try {
      // Clear any stale OIDC state that can confuse a new authorization request
      Object.keys(sessionStorage).forEach(k => { if (k.startsWith('oidc_')) sessionStorage.removeItem(k); });
      // Ensure absolute client_id URL for Solid webid scope (serve as JSON-LD)
      const clientId = new URL('/client.jsonld', window.location.origin).toString();
      // Probe issuer configuration
      const wellKnown = oidcIssuer.replace(/\/$/, '') + '/.well-known/openid-configuration';
      const r = await fetch(wellKnown);
      if (!r.ok) throw new Error('Invalid provider');
      // Trigger redirect-based login with absolute clientId
      await sessionContext.auth.login(oidcIssuer, clientId, redirectUrl, sessionStorage.getItem('oidc_scope') || 'openid webid offline_access');
    } catch (e) {
      if (e.message === 'Failed to fetch') setError?.('Failed to reach provider');
      else setError?.('Invalid provider');
    }
  };
  return (
    <button id="loginButton" className="sw-btn w-fit" type="button" onClick={onClick}>
      <FaChevronRight className="w-4 h-4"/>
    </button>
  );
}

SWLoginButton.propTypes = {
  className:    PropTypes.string,
  oidcIssuer:   PropTypes.string.isRequired,
  redirectUrl:  PropTypes.string.isRequired,
  setError:     PropTypes.func,
};

export default SWLoginButton;
