import { useState, useEffect } from "react";
import { useSession } from "@inrupt/solid-ui-react";
import { FaUserCircle } from "react-icons/fa";

import LoadingIcon from "./SWLoadingIcon";

import UserSolidService from "../services/user.solidservice";

function SWNavbar()
{
    const sessionContext = useSession();
    const [username, setUsername] = useState(null);

    useEffect(() => {
        if (!sessionContext.session.info.isLoggedIn || sessionContext.sessionRequestInProgress) {
            return;
        }
        UserSolidService.getName(sessionContext, sessionContext.session.info.webId).then((name) => {
            setUsername((name.error) ? 'Unknown' : name);
        });
    }, [sessionContext.sessionRequestInProgress, sessionContext.session]);

    if (!sessionContext.session.info.isLoggedIn) {
        return (
            <div className="w-full flex justify-center p-8">
                <div className="flex sw-fw-1 items-center">
                    <p>Watchparty</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex p-8 grow-0">
            <label className="sw-fw-1 basis-1/3 text-left">solid-watchparty-v0</label>
            <div className="flex sw-fw-1 basis-1/3 justify-center items-center">
                <p>Solid Watchparty</p>
            </div>
            <div className="flex items-center basis-1/3 justify-end">
                <div className="flex gap-4 items-center sw-fw-1">
                    { (!sessionContext.sessionRequestInProgress) ? <p>{username}</p> : <LoadingIcon/> }
                    <FaUserCircle className="sw-fw-1 w-6 h-6"/>
                </div>
            </div>
        </div>
    );
}

export default SWNavbar;
