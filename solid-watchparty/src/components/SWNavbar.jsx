import { useState, useEffect } from "react";
import { useSession } from "../hooks/useSession";
import { FaUserCircle } from "react-icons/fa";

/* component imports */
import LoadingIcon from "./SWLoadingIcon";
import UserSettingsModal from "./UserSettingsModal";

/* config imports */
import UserSolidService from "../services/user.solidservice";

function SWNavbar()
{
    const [modalIsShown, setModalIsShown] = useState(false);
    const sessionContext = useSession();
    const [username, setUsername] = useState(null);
    const getAndSetName = () => {
        if (!sessionContext.session.info.isLoggedIn || sessionContext.sessionRequestInProgress) {
            return;
        }
        UserSolidService.getName(sessionContext, sessionContext.session.info.webId).then((name) => {
            setUsername((name.error) ? 'Unknown' : name);
        });
    }

    useEffect(getAndSetName, [sessionContext.sessionRequestInProgress, sessionContext.session]);

    if (!sessionContext.session.info.isLoggedIn) {
        return (<></>);
    }

    return (
        <div className="w-full flex p-8">
            <div className="flex basis-1/2">
                <p className="flex sw-fw-1 justify-center items-center sw-text-gradient">
                    watchparty
                </p>
            </div>
            <div className="flex items-center basis-2/2 ml-auto">
                <div className="flex gap-4 items-center sw-fw-1 cursor-pointer"
                     onClick={() => setModalIsShown(true)} >
                    { (!sessionContext.sessionRequestInProgress) ? <p>{username}</p> : <LoadingIcon/> }
                    <FaUserCircle className="sw-fw-1 w-6 h-6"/>
                </div>
            </div>
            { modalIsShown && (
                <UserSettingsModal setModalIsShown={setModalIsShown} getAndSetName={getAndSetName} />
            )}
        </div>
    );
}

export default SWNavbar;
