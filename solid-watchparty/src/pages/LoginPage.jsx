/* Libary imports */
import {
  useState,
  useEffect
} from 'react';
import { useSession } from "@inrupt/solid-ui-react";
import { useNavigate } from 'react-router-dom';

/* Component imports */
import SWPageWrapper from '../components/SWPageWrapper'
import SWLoginButton from '../components/SWLoginButton'

/* Util imports */
import { inSession } from '../utils/solidUtils';

const authOptions = {
  clientName:  "solid-watchparty",
};

function LoginPage()
{
  const [oidcIssuer, setOidcIssuer] = useState("http://localhost:3000/");
  const { session, sessionRequestInProgress } = useSession();
  const navigateTo = useNavigate();

  useEffect(() => {
    if (!sessionRequestInProgress && inSession(session)) {
      navigateTo('/menu');
    }
  }, [session, sessionRequestInProgress])

  return (
    <SWPageWrapper className="flex justify-center items-center" mustBeAuthenticated={false}>
      <div className="w-1/2">
        <h1 className="sw-fs-2 sw-fw-1 mb-5">Login</h1>
        <input className="sw-input w-full" type="url" name="oidcIssuerField"
               value={oidcIssuer} placeholder="oidcIssuer"
               onChange={(e) => setOidcIssuer(e.target.value)}/>
        <SWLoginButton className="my-4 w-fit"
                       authOptions={authOptions}
                       oidcIssuer={oidcIssuer}
                       redirectUrl={window.location.protocol + '//' + window.location.host + '/menu'}
                       onError={console.error}/>
      </div>
    </SWPageWrapper>
  )
}


export default LoginPage;
