import { useState, useEffect } from "react";
import { useSession } from "@inrupt/solid-ui-react";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

/* component imports */
import { MenuBar, MenuItem } from '../components/SWMenu';
import LoadingIcon from "./SWLoadingIcon";

/* config imports */
import UserSolidService from "../services/user.solidservice";
import SWModalInputBar from "./SWModalInputBar.jsx";

async function changeName({input, sessionContext, setModalIsShown, getAndSetName}) {
    await UserSolidService.changeName(sessionContext, sessionContext.session.info.webId, input);
    getAndSetName();
    setModalIsShown(false);
}

function SWNavbar()
{
    const [modalIsShown, setModalIsShown] = useState(false);
    const [action, setAction] = useState({name: "", f: null});
    const sessionContext = useSession();
    const [username, setUsername] = useState(null);
    const navigateTo = useNavigate();
    const getAndSetName = () => {
        if (!sessionContext.session.info.isLoggedIn || sessionContext.sessionRequestInProgress) {
            return;
        }
        UserSolidService.getName(sessionContext, sessionContext.session.info.webId).then((name) => {
            setUsername((name.error) ? 'Unknown' : name);
        });
    }
    const actionArgs = {
        sessionContext,
        setModalIsShown,
        getAndSetName,
    }

    useEffect(getAndSetName, [sessionContext.sessionRequestInProgress, sessionContext.session]);

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
                <div className="flex gap-4 items-center sw-fw-1 cursor-pointer"
                     onClick={() => {
                         setAction({name: "Your name", f: changeName});
                         setModalIsShown(true);
                     }} >
                    { (!sessionContext.sessionRequestInProgress) ? <p>{username}</p> : <LoadingIcon/> }
                    <FaUserCircle className="sw-fw-1 w-6 h-6"/>
                </div>
            </div>
            { modalIsShown && (
                <SWModalInputBar title={action.name} f={action.f} args={actionArgs} setModalIsShown={setModalIsShown}/>
            )}
        </div>
    );
}

export default SWNavbar;
