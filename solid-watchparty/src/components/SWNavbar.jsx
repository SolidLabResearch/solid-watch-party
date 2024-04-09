import {
    Text,
    useSession,
    CombinedDataProvider,
} from "@inrupt/solid-ui-react";
import { FaUserCircle } from "react-icons/fa";

import Logo from '../assets/watchparty.png'

function SWNavbar()
{
    const sessionContext = useSession();

    if (sessionContext.session.info.isLoggedIn) {
        /* TODO(Elias): Change <Text ... > to custom services after they have been written */
        return (
            <div className="w-full flex p-8 grow-0">
                <label className="sw-fw-1 basis-1/3 text-left">solid-watchparty-v0</label>
                <div className="flex sw-fw-1 basis-1/3 justify-center items-center">
                    <p>Solid Watchparty</p>
                </div>
                <div className="flex items-center basis-1/3 justify-end">
                    {sessionContext.session.info.isLoggedIn ? (
                        <div className="flex gap-4 ">
                            <CombinedDataProvider
                                datasetUrl={sessionContext.session.info.webId}
                                thingUrl={sessionContext.session.info.webId}
                            >
                                <Text className="sw-fw-1" properties={[
                                    "http://www.w3.org/2006/vcard/ns#fn",
                                        "http://xmlns.com/foaf/0.1/name",
                                ]} />
                            </CombinedDataProvider>
                            <FaUserCircle className="sw-fw-1 w-6 h-6"/>
                        </div>
                    ) : (
                        <p className="rgb-alert sw-fw-1">Error</p>
                    )}
                </div>
            </div>
        );
    }
    return (
        <div className="w-full flex justify-center p-8">
            <div className="flex sw-fw-1 items-center">
                <img className="mr-2" src={Logo} width="36px"/>
                <p>Watchparty</p>
            </div>
        </div>
    );
}

export default SWNavbar;
