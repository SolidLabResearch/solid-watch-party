/* library imports */
import { useEffect, useState, useRef } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import { useSearchParams } from 'react-router-dom';
import { FaUserFriends } from "react-icons/fa";
import dashjs from 'dashjs';
import { FaUserCircle, FaCheck } from "react-icons/fa";

/* component imports */
import SWPageWrapper from '../components/SWPageWrapper'
import SWChatComponent from '../components/SWChatComponent';
import SWModal from '../components/SWModal';
import SWVideoPlayer from '../components/SWVideoPlayer';
import SWLoadingIcon from '../components/SWLoadingIcon';
import StartWatchingEventModal from '../components/StartWatchingEventModal';
import { MenuBar, MenuItem } from '../components/SWMenu';

/* service imports */
import RoomSolidService from '../services/room.solidservice.js';
import EventsSolidService from '../services/events.solidservice.js';

/* util imports */
import { inSession } from '../utils/solidUtils';
import { SCHEMA_ORG } from '../utils/schemaUtils';

/* TODO(Elias): Add validations and error handling everywhere */

function LoadingCard({}) {
    return (
        <div className="flex w-full h-full items-center justify-center">
            <SWLoadingIcon className="w-8 h-8"/>
        </div>
    );
}

function PersonCard({person}) {
    return (
        <div className="rgb-bg-1 sw-border flex justify-between p-4 h-fit">
            <div className="flex gap-3">
                <FaUserCircle className="rgb-1 sw-fw-1 w-6 h-6"/>
                <p className="">{person.name}</p>
            </div>
        </div>
    );
}

function RequestingPersonCard({person, roomUrl, onAccept}) {
    return (
        <div className="rgb-bg-1 sw-border flex justify-between p-4 h-fit">
            <div className="flex gap-3 justify-between w-full items-center">
                <div className="flex gap-3">
                    <FaUserCircle className="rgb-1 sw-fw-1 w-6 h-6"/>
                    <p className="rgb-on">{person.name}</p>
                </div>
                <button className="p-2 rounded items-center
                                   rgb-bg-active-1 hover:rgb-bg-1 active:rgb-bg-active-2
                                   rgb-active-1 active:rgb-1"
                        onClick={() => onAccept(person)}>
                    <FaCheck/>
                </button>
            </div>
        </div>
    );
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
        <div className="overflow-auto grid grid-cols-2 auto-rows-min gap-4 h-[90%]">
            {people.map((person, index) => <PersonCard person={person} key={index}/>)}
        </div>
    );
}

function RequestingPeople({roomUrl}) {
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

    const onAccept = async (person) => {
        const result = await RoomSolidService.addPerson(sessionContext, roomUrl, person.messageboxUrl, person.webId);
    }

    if (isLoading) {
        return (<LoadingCard/>);
    }
    return (
        <div className="overflow-auto grid grid-cols-2 auto-rows-min gap-4 h-[90%]">
            {people.map((person, index) => <RequestingPersonCard person={person} key={index} onAccept={onAccept}/>)}
        </div>
    );
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
        case "requesting":
            body = <RequestingPeople roomUrl={roomUrl}/>;
            break;
    }

    return (
        <SWModal className="rgb-bg-2 h-2/3 p-12 z-10 w-1/2 sw-border" setIsShown={setModalIsShown}>
            <div className="mb-6 flex items-center justify-between">
                <p className="sw-fs-2 sw-fw-1">People</p>
                <MenuBar>
                    <MenuItem onClick={() => setTab("in-room")}>In Room</MenuItem>
                    <MenuItem onClick={() => setTab("requesting")}>Requesting</MenuItem>
                </MenuBar>
            </div>
            {body}
        </SWModal>
    );
}

export default PeopleMenuModal;
