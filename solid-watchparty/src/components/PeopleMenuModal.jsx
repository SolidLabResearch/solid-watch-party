/* library imports */
import { useEffect, useState, useContext } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import { FaUserCircle, FaCheck } from "react-icons/fa";
import propTypes from 'prop-types';
import QRCode from "react-qr-code";

/* component imports */
import SWModal from '../components/SWModal';
import SWLoadingIcon from '../components/SWLoadingIcon';
import { MenuBar, MenuItem } from '../components/SWMenu';
import SWSwitch from '../components/SWSwitch';

/* context imports */
import { MessageBoxContext } from '../contexts';

/* service imports */
import RoomSolidService from '../services/room.solidservice.js';
import MessageSolidService from '../services/message.solidservice.js';

/* util imports */
import { inSession } from '../utils/solidUtils';

/* TODO(Elias): Add validations and error handling everywhere */

function LoadingCard() {
    return (
        <div className="flex w-full h-full items-center justify-center">
            <SWLoadingIcon className="w-8 h-8"/>
        </div>
    );
}

function PersonCard({person}) {
    const [enabled, setEnabled] = useState(false);
    const [messageBoxUrl, setMessageBoxUrl] = useContext(MessageBoxContext);
    const [isLoading, setIsLoading] = useState(true);
    const sessionContext = useSession();
    const isMyCard = (person.webId === sessionContext.session.info.webId);

    useEffect(() => {
        const fetch = async () => {
            setIsLoading(true);
            const accessModes = await MessageSolidService.checkAccess(sessionContext, messageBoxUrl, person.webId);
            if (accessModes.error) {
                return;
            }
            setEnabled(accessModes.read);
            setIsLoading(false);
        }
        fetch();
    }, []);

    const onSwitch = async () => {
        setIsLoading(true);
        const result = await MessageSolidService.setAccess(sessionContext, messageBoxUrl, person.webId,
                                                           {read: !enabled});
        setIsLoading(false);
        if (result.error) {
            return;
        }
        setEnabled(result.read);
    }

    return (
        <div className="rgb-bg-1 sw-border flex justify-between p-4 items-center">
            <div className="flex gap-3">
                <FaUserCircle className="rgb-1 sw-fw-1 w-6 h-6"/>
                <p>{person.name}</p>
            </div>
            <div className="flex gap-3 items-center">
                <SWSwitch enabled={enabled} onSwitch={onSwitch} disabled={isMyCard} isLoading={isLoading}/>
            </div>
        </div>
    );
}
PersonCard.propTypes = {
    person: propTypes.object.isRequired,
}

function WaitingPersonCard({person, roomUrl, removeFromPeople}) {
    const sessionContext = useSession();
    const [isLoading, setIsLoading] = useState(false);

    const onAccept = async (person) => {
        setIsLoading(true);
        const result = await RoomSolidService.addPerson(sessionContext, roomUrl, person.messageBoxUrl, person.webId);
        setIsLoading(false);
        if (result.error) {
            console.error(result.error);
            return;
        }
        removeFromPeople(person);
    }

    return (
        <div className="rgb-bg-1 sw-border flex justify-between p-4 h-fit">
            <div className="flex gap-3 justify-between w-full items-center">
                <div className="flex gap-3">
                    <FaUserCircle className="rgb-1 sw-fw-1 w-6 h-6"/>
                    <p className="rgb-on">{person.name}</p>
                </div>
                {isLoading ? (
                    <div className="p-1">
                        <SWLoadingIcon className={`w-5`}/>
                    </div>
                ) : (
                    <button onClick={() => onAccept(person)}
                        className="p-2 rounded items-center rgb-bg-active-1 hover:rgb-bg-1
                        active:rgb-bg-active-2 rgb-active-1 active:rgb-1">
                        <FaCheck/>
                    </button>
                )}
            </div>
        </div>
    );
}
WaitingPersonCard.propTypes = {
    person:             propTypes.object.isRequired,
    roomUrl:            propTypes.string.isRequired,
    removeFromPeople:   propTypes.func.isRequired,
}

function InRoomPeople({roomUrl}) {
    const sessionContext = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [people, setPeople] = useState([]);

    useEffect(() => {
        const getPeople = async () => {
            let peopleResult = await RoomSolidService.getPeople(sessionContext, roomUrl);
            if (peopleResult.error) {
                console.error(peopleResult.error);
                return;
            }
            peopleResult = peopleResult.map((person, index) => ({...person, key: index}));
            setIsLoading(false);
            setPeople(peopleResult);
        };
        if (inSession(sessionContext)) {
            getPeople();
        }
    }, []);

    if (isLoading) {
        return (<LoadingCard/>);
    }
    return (
        <div className="overflow-auto grid auto-rows-min gap-4 h-[90%]">
            <p className="rgb-1">Allow seeing my messages:</p>
            {people.map((person, index) => <PersonCard person={person} key={index}/>)}
        </div>
    );
}

InRoomPeople.propTypes = {
    roomUrl: propTypes.string.isRequired,
}

function WaitingPeople({roomUrl}) {
    const sessionContext = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [people, setPeople] = useState([]);

    useEffect(() => {
        const getPeople = async () => {
            let peopleResult = await RoomSolidService.getActiveRegisterPeople(sessionContext, roomUrl);
            if (peopleResult.error) {
                console.error(peopleResult.error);
                return;
            }
            peopleResult = peopleResult.map((person, index) => ({...person, key: index}));
            setIsLoading(false);
            setPeople(peopleResult);
        };
        if (inSession(sessionContext)) {
            getPeople();
        }
    }, []);

    const removeFromPeople = (person) => {
        setPeople(people.filter((p) => (p.webId !== person.webId)));
    }

    if (isLoading) {
        return (<LoadingCard/>);
    }
    return (
        <div className="overflow-auto grid auto-rows-min gap-4 h-[90%]">
            {people.map((person, index) => (
                <WaitingPersonCard person={person} key={index} roomUrl={roomUrl}
                                      removeFromPeople={removeFromPeople}/>
            ))}
        </div>
    );
}
WaitingPeople.propTypes = {
    roomUrl: propTypes.string.isRequired,
}

function InvitePeople() {
    console.log(window.location.href);
    return (
        <div className="h-full justify-center">
            <QRCode
                size={256}
                style={{ maxHeight: "90%", height: "auto", maxWidth: "90%", width: "100%", margin: "auto" }}
                value={window.location.href}
                viewBox={`0 0 256 256`}
            />
        </div>
    );
}
InvitePeople.propTypes = {
    roomUrl: propTypes.string.isRequired,
}

function PeopleMenuModal({setModalIsShown, roomUrl}) {
    /* NOTE(Elias): Uses strings for pages, valid options are:
     * 1. in-room
     * 2. requesting */
    const [tab, setTab] = useState("in-room");

    let body = <></>
    switch (tab) {
        case "in-room":
            body = <InRoomPeople roomUrl={roomUrl}/>;
            break;
        case "waiting":
            body = <WaitingPeople roomUrl={roomUrl}/>;
            break;
        case "invite":
            body = <InvitePeople roomUrl={roomUrl}/>;
            break;
    }

    return (
        <SWModal className="rgb-bg-2 h-2/3 p-12 z-10 w-1/2 sw-border width-mobile padding-full-mobile" setIsShown={setModalIsShown}>
            <div className="mb-6 flex items-center justify-between">
                <p className="sw-fs-2 sw-fw-1">People</p>
                <MenuBar>
                    <MenuItem onClick={() => setTab("in-room")}>In Room</MenuItem>
                    <MenuItem onClick={() => setTab("waiting")}>Waiting</MenuItem>
                    <MenuItem onClick={() => setTab("invite")}>Invite</MenuItem>
                </MenuBar>
            </div>
            {body}
        </SWModal>
    );
}
PeopleMenuModal.propTypes = {
    setModalIsShown:    propTypes.func.isRequired,
    roomUrl:            propTypes.string.isRequired,
}

export default PeopleMenuModal;
