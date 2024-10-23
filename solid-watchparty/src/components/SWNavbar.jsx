import { useState, useEffect } from "react";
import { useSession } from "@inrupt/solid-ui-react";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

/* component imports */
import { MenuBar, MenuItem } from '../components/SWMenu';
import LoadingIcon from "./SWLoadingIcon";

/* config imports */
import config from '../../config';

import UserSolidService from "../services/user.solidservice";

function SWNavbar()
{
    const sessionContext = useSession();
    const [username, setUsername] = useState(null);
    const navigateTo = useNavigate();

    useEffect(() => {
        if (!sessionContext.session.info.isLoggedIn || sessionContext.sessionRequestInProgress) {
            return;
        }
        UserSolidService.getName(sessionContext, sessionContext.session.info.webId).then((name) => {
            setUsername((name.error) ? 'Unknown' : name);
        });
    }, [sessionContext.sessionRequestInProgress, sessionContext.session]);

    if (!sessionContext.session.info.isLoggedIn) {
        return (<></>);
    }

    return (
        <div className="w-full flex p-8">
            <div className="flex basis-1/2">
                <p className="flex sw-fw-1 justify-center items-center sw-text-gradient">
                    solid-watchparty
                </p>
            </div>
            <div className="flex items-center basis-2/2 ml-auto">
                <div className="flex gap-4 items-center sw-fw-1">
                    { (!sessionContext.sessionRequestInProgress) ? <p>{username}</p> : <LoadingIcon/> }
                    <FaUserCircle className="sw-fw-1 w-6 h-6"/>
                </div>
            </div>
        </div>
    );
}

export default SWNavbar;
