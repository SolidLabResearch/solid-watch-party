/* Libary imports */
import { useState, } from 'react';
import { useLocation } from 'react-router-dom';
import { FaChevronLeft, FaQuestionCircle } from "react-icons/fa";
import { LoginButton } from '@inrupt/solid-ui-react';
import { FaChevronRight } from 'react-icons/fa';

/* Component imports */
import SWPageWrapper from '../components/SWPageWrapper'
import SWLoginButton from '../components/SWLoginButton'

/* config imports */
import config from '../../config';

const authOptions = {
    clientName:  "solid-watchparty",
};

export default function LoginPage()
{
    const [oidcIssuer, setOidcIssuer] = useState("");
    const currentLocation = useLocation();
    const redirectLocation = (currentLocation.state?.from || `${config.baseDir}/menu`);
    const [error, setError] = useState("");

    const handleLoginError = (e) => {
        if (e.message === "Failed to fetch") {
            setError("Failed to reach provider");
            return;
        }
        setError("Invalid provider");
    }

    return (
        <div className="w-full h-full">
            <a href={config.baseDir + '/'} className="flex gap-2 items-center fixed top-12 left-12">
                <FaChevronLeft className="w-3 h-3 rgb-2"/>
                <p className="sw-fw-1">Home</p>
            </a>
            <div className="w-full flex justify-center items-center">
                <div className="rounded">
                    <div className="h-screen flex flex-col justify-center sw-bg-gradient-2 items-center">
                        <div className="w-1/3">
                            <h1 className="sw-fs-2 sw-fw-1 sw-text-gradient">Login to solid-watchparty</h1>
                            <div className="my-6">
                                <p className="sw-fs-4 sw-fw-1 my-2 rgb-2 flex items-center gap-2">
                                    Your solid pod provider
                                    <a href="#faq">
                                        <FaQuestionCircle className="hover:rgb-1"/>
                                    </a>
                                </p>
                                <div className={`flex w-full justify-between border sw-input${error === "" ? "" : "-error"}`}>
                                    <input name="oidcIssuerField" className="w-full"
                                        value={oidcIssuer} placeholder="https://your.pod.provider"
                                        onChange={(e) => {
                                            setOidcIssuer(e.target.value);
                                            setError("");
                                        }}/>
                                    <LoginButton authOptions={authOptions}
                                        oidcIssuer={oidcIssuer}
                                        redirectUrl={window.location.protocol + '//' + window.location.host + redirectLocation}
                                        onError={handleLoginError}>
                                        <button className={"sw-btn w-fit"}>
                                            <FaChevronRight className="w-4 h-4 "/>
                                        </button>
                                    </LoginButton>
                                </div>
                                <div className="h-12 mt-3 rgb-alert sw-fw-1">
                                    <label>{error}</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="h-screen flex justify-center">
                        <div className="flex flex-col justify-center gap-12 w-1/3">
                            <a name="faq"></a>
                            <h1 className="sw-fs-2 sw-fw-1">FAQ</h1>
                            <div>
                                <h1 className="sw-fs-2 sw-fw-1">How do I login with my pod?</h1>
                                <p className="sw-fs-3 my-2 rgb-2 text-justify">
                                    Every pod provider has a url that you can use to login.
                                    This url is called the OIDC issuer. In order to login, you have to fill in the OIDC issuer.
                                </p>
                            </div>
                            <div>
                                <h1 className="sw-fs-2 sw-fw-1">I don't have a pod, what now?</h1>
                                <p className="sw-fs-3 my-2 rgb-2 text-justify">
                                    <a href="https://solidproject.org/users/get-a-pod" className="underline">Get a pod</a> from one of the many pod providers.
                                </p>
                            </div>
                            <div>
                                <h1 className="sw-fs-2 sw-fw-1">What is a pod?</h1>
                                <p className="sw-fs-3 my-2 rgb-2 text-justify">
                                    A pod is a personal online storage space
                                    where you can store your files, photos, documents, and application data. This pod is controlled by you,
                                    and you can decide who has access to your data. This is in contrast to most
                                    other online services, like social media platforms and cloud storage services, where your data is stored
                                    on servers controlled by others.
                                </p>
                            </div>
                            <div>
                                <p className="underline">
                                    <a href="https://solidproject.org/">Learn more about pods</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="">
                <div className="flex justify-center items-center">
                    <p className="my-8">© 2024 IDLab</p>
                </div>
            </div>
        </div>
    )
}
