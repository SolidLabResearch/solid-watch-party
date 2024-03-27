/* library imports */
import { useEffect, useState, useRef } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import { useSearchParams } from 'react-router-dom';
import { FaUserFriends } from "react-icons/fa";
import dashjs from 'dashjs';
import { FaUserCircle } from "react-icons/fa";

/* component imports */
import SWPageWrapper from '../components/SWPageWrapper'
import SWChatComponent from '../components/SWChatComponent';
import SWModal from '../components/SWModal';
import SWVideoPlayer from '../components/SWVideoPlayer';
import SWLoadingIcon from '../components/SWLoadingIcon';
import StartWatchingEventModal from '../components/StartWatchingEventModal';

/* service imports */
import RoomSolidService from '../services/room.solidservice.js';
import EventsSolidService from '../services/events.solidservice.js';

/* util imports */
import { inSession } from '../utils/solidUtils';
import { SCHEMA_ORG } from '../utils/schemaUtils';

function PeopleMenuModal({setModalIsShown, roomUrl}) {
    const sessionContext = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [people, setPeople] = useState([]);

    useEffect(() => {
        const getPeople = async () => {
            const peopleResult = await RoomSolidService.getPeople(sessionContext, roomUrl);
            if (peopleResult.error) {
                console.error(peopleResult.error);
                return;
            }
            setIsLoading(false);
            setPeople(peopleResult);
        };
        if (inSession(sessionContext)) {
            getPeople();
        }
    }, []);

    const renderPerson = (person) => {
        return (
            <div className="rgb-bg-1 sw-border flex justify-between p-4 h-fit">
                <div className="flex gap-3">
                    <FaUserCircle className="rgb-1 sw-fw-1 w-6 h-6"/>
                    <p className="">{person.name}</p>
                </div>
            </div>
        );
    }

    return (
        <SWModal className="rgb-bg-2 h-2/3 p-12 z-10 w-1/2 sw-border" setIsShown={setModalIsShown}>
            {(isLoading) ? (
                <div className="flex w-full h-full items-center justify-center">
                    <SWLoadingIcon className="w-8 h-8"/>
                </div>
            ) : (
                <>
                    <div className="mb-6">
                        <p className="sw-fs-2 sw-fw-1">People</p>
                    </div>
                    <div className="overflow-auto grid grid-cols-2 auto-rows-min gap-4 h-[90%]">
                        {people.map(renderPerson)}
                    </div>
                </>
            )}
        </SWModal>
    );
}

export default PeopleMenuModal;
