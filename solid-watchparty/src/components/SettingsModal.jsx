
/* library imports */
import { useEffect, useState, useContext, useRef } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import { FaUserCircle, FaCheck } from "react-icons/fa";
import propTypes from 'prop-types';

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
import { parseTitle } from '../utils/messageParser';

/* context imports */
import { RoomContext } from '../contexts';


function SettingsModal({setModalIsShown, roomUrl}) {
    const sessionContext = useSession();
    const [room, setRoom] = useContext(RoomContext);
    const [isLoading, setIsLoading] = useState(true);

    const nameRef = useRef();
    const thumbnailRef = useRef();

    useEffect(() => {
        setIsLoading(true);
        RoomSolidService.getRoomInfo(sessionContext, roomUrl).then((room) => {
            if (room.error) {
                return;
            }
            setRoom(room);
            setIsLoading(false);
            nameRef.current.focus();
        });
    }, [sessionContext.session, sessionContext.requested, roomUrl]);

    const submit = async (e) => {
        setIsLoading(true);
        e.preventDefault();
        const name = parseTitle(nameRef.current.value);
        const thumbnailUrl = thumbnailRef.current.value;
        const room_ = {...room, name, thumbnailUrl};

        RoomSolidService.updateRoomInfo(sessionContext, roomUrl, room_).then((result) => {
            setIsLoading(false);
            if (result.error) {
                return;
            }
            setRoom(room_);
        });

    }

    useEffect(() => {
        nameRef.current.value = (room?.name) ? room.name: "";
        thumbnailRef.current.value = (room?.thumbnailUrl) ? room.thumbnailUrl: "";
    }, [room]);

    return (
        <SWModal className="relative rgb-bg-2 h-fit p-12 z-10 w-1/2 sw-border" setIsShown={setModalIsShown}>
            <div className="mb-6 flex items-center justify-between">
                <p className="sw-fs-2 sw-fw-1">Settings</p>
            </div>
            <form onSubmit={submit}>
                <div className="my-4">
                    <p className="sw-fs-4 sw-fw-1 my-2 w-full">Room Name</p>
                    <div className={`sw-input${isLoading ? "-disabled" : ""} w-full flex justify-between`}>
                        <input className="w-full" type="text" placeholder="Room name" ref={nameRef} disabled={isLoading}/>
                        { isLoading ? <SWLoadingIcon className="w-4 h-4"/> : null}
                    </div>
                </div>
                <div className="my-4">
                    <p className="sw-fs-4 sw-fw-1 my-2">Thumbnail Url</p>
                    <div className={`sw-input${isLoading ? "-disabled" : ""} w-full flex justify-between`}>
                        <input className="w-full" type="text" placeholder="Image Url"
                                ref={thumbnailRef} value={room?.thumbnail} disabled={isLoading}/>
                        { isLoading ? <SWLoadingIcon className="w-4 h-4"/> : null}
                    </div>
                </div>
                <button className="sw-btn sw-btn-1 mt-6">Save</button>
            </form>
        </SWModal>
    );
}

export default SettingsModal;
