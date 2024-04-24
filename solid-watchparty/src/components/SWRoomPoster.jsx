/* libary imports */
import { useSession, } from '@inrupt/solid-ui-react';
import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMagnifyingGlass } from "react-icons/fa6";
import { FaChevronRight } from 'react-icons/fa';
import { MdHideImage } from "react-icons/md";
import { FaDeleteLeft } from "react-icons/fa6";

/* component imports */
import SWPageWrapper from '../components/SWPageWrapper';
import SWLoadingIcon from '../components/SWLoadingIcon';
import SWModal from '../components/SWModal';

/* service imports */
import RoomSolidService from '../services/room.solidservice';
import MessageSolidService from '../services/message.solidservice';

/* context imports */
import { MessageBoxContext } from '../contexts';

/* util imports */
import { validateAll, validateRequired, validateIsUrl, validateLength } from '../utils/validationUtils';
import { displayDate, stringToColor } from '../utils/general';
import { getPodUrl, urlify } from '../utils/urlUtils.js';

/* config imports */
import config from '../../config';
import { MESSAGES_ROOT } from '../config.js'

function DeleteRoomModal({room, setIsShown, onDelete}) {
    const sessionContext = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const deleteRoom = async () => {
        setIsLoading(true);

        if (room.isOrganizer) {
            const result = await RoomSolidService.endRoom(sessionContext, room.roomUrl);
            if (result.error) {
                setError(result.errorMsg);
                setIsLoading(false);
                return;
            }
        }

        const messageBoxUrl = `${getPodUrl(sessionContext.session.info.webId)}/${MESSAGES_ROOT}/MSG${urlify(room.roomUrl)}#outbox`
        const result = await MessageSolidService.endMessageBox(sessionContext, messageBoxUrl);
        if (result.error) {
            setError(result.errorMsg);
        }

        console.log("DeleteRoomModal: Room deleted: ", room.roomUrl);
        onDelete(room);

        setIsShown(false);
        setIsLoading(false);
    }

    return (
        <SWModal className="z-10 w-1/3" setIsShown={setIsShown}>
            <div className={`h-48 rgb-bg-1 flex w-full items-center justify-between gap-6 sw-border${error ? "-error" : ""}`}>
                { isLoading ? (
                    <div className="w-full flex justify-center">
                        <SWLoadingIcon className="w-6 h-6"/>
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center">
                        <p className="text-center sw-fs-3 sw-fw-1 py-3">Are you sure you want to delete the room?</p>
                        <div className="flex gap-3">
                            <button className="sw-btn sw-btn-alert" onClick={() => {deleteRoom()}}>Delete</button>
                            <button className="sw-btn sw-btn-2" onClick={() => setIsShown(false)}>Cancel</button>
                        </div>
                    </div>
                )}
            </div>
            <div className="h-12 mt-3 rgb-alert sw-fw-1">
                <label>{error}</label>
            </div>
        </SWModal>
    );
}

function RoomPoster({room, onDelete}) {
    if (!room) {
        console.error("RoomPoster: room is null");
        return null;
    }

    const { name, lastActive, nMembers, isOrganizer, isPlaying, lastMovie } = room;
    const [deleteModalIsShown, setDeleteModalIsShown] = useState(false);
    const navigateTo = useNavigate();

    const randomposters = [
        "https://media.istockphoto.com/id/995815438/vector/movie-and-film-modern-retro-vintage-poster-background.jpg?s=612x612&w=0&k=20&c=UvRsJaKcp0EKIuqDKp6S7Dwhltt0D5rbegPkS-B8nDQ=",
        "https://thumbs.dreamstime.com/b/movie-film-poster-template-design-modern-retro-vintage-style-can-be-used-background-backdrop-banner-brochure-leaflet-flyer-128343314.jpg",
        "https://thumbs.dreamstime.com/b/movie-film-poster-template-design-modern-retro-vintage-style-movie-film-poster-template-design-modern-retro-vintage-style-125779532.jpg",
        "https://media.istockphoto.com/id/1127899152/vector/movie-and-film-poster-design-template-background-modern-vintage-retro-style.jpg?s=612x612&w=0&k=20&c=brNq4L210W-Vp4m-0Lg78JLyt86pdIcSDFDBWI0v4qc=",
        "https://media.istockphoto.com/id/995815438/vector/movie-and-film-modern-retro-vintage-poster-background.jpg?s=612x612&w=0&k=20&c=UvRsJaKcp0EKIuqDKp6S7Dwhltt0D5rbegPkS-B8nDQ="
    ]
    const thumbnailUrl = room.thumbnailUrl;

    return (
        <div className={
            "sw-border relative flex-col justify-center items-center aspect-[27/39]"
                + " h-96 shadow-lg rounded bg-black hover:cursor-pointer active:rgb-bg-1"
            }>
            {/* there needs to be a name, last-active date, thumbnail, # members and movie title */}
            <button className="absolute h-full w-full z-10 bg-black opacity-0 hover:opacity-30 transition-opacity duration-200"
                    onClick={() => navigateTo(`${config.baseDir}/watch?roomUrl=${encodeURIComponent(room.roomUrl)}`)}/>
            <div className="h-full w-full">
                {thumbnailUrl ? (
                    <img className="absolute h-full w-full bg-cover rounded" src={thumbnailUrl} alt="room thumbnail"/>
                ) : (
                    <div className={`absolute h-full w-full bg-cover rounded-lg flex items-center justify-center`}>
                        <MdHideImage className="absolute h-8 w-8 rgb-2"/>
                    </div>
                )}
            </div>
            <div className="w-full absolute top-0 p-3 flex justify-between">
                <div></div>
                <button className="px-2 py-1 z-20 w-fit rounded-lg hover:bg-[#FaaA] active:bg-[#Faa]"
                        onClick={() => setDeleteModalIsShown(true)}>
                    <FaDeleteLeft className="h-6 w-6 text-red-500 "/>
                </button>
            </div>
            <div className="w-full absolute bottom-0 bg-[#000A] p-3 rounded-b-lg">
                <div className="flex gap-3 items-center py-2">
                    <p className="sw-fw-1">{nMembers} members</p>
                    { isOrganizer && (
                        <div className="sw-border px-3 rounded-max rgb-bg-1">
                            <label>Owner</label>
                        </div>
                    )}
                </div>
                <p className="sw-fw-1 sw-fs-3 overflow-hidden whitespace-nowrap overflow-ellipsis">{name}</p>
            </div>
            { deleteModalIsShown && (
                <DeleteRoomModal room={room} setIsShown={setDeleteModalIsShown} onDelete={onDelete}/>
            )}
        </div>
    );
}

export default RoomPoster;
