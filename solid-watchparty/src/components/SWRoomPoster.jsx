/* libary imports */
import { useSession, } from '@inrupt/solid-ui-react';
import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMagnifyingGlass } from "react-icons/fa6";
import { FaChevronRight } from 'react-icons/fa';
import { MdHideImage } from "react-icons/md";

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
import { displayDate } from '../utils/general';

/* config imports */
import config from '../../config';


function RoomPoster({room}) {
    if (!room) {
        console.error("RoomPoster: room is null");
        return null;
    }
    const { name, lastActive, nMembers, isOrganizer, isPlaying, lastMovie } = room;

    const randomposters = [
        "https://media.istockphoto.com/id/995815438/vector/movie-and-film-modern-retro-vintage-poster-background.jpg?s=612x612&w=0&k=20&c=UvRsJaKcp0EKIuqDKp6S7Dwhltt0D5rbegPkS-B8nDQ=",
        "https://thumbs.dreamstime.com/b/movie-film-poster-template-design-modern-retro-vintage-style-can-be-used-background-backdrop-banner-brochure-leaflet-flyer-128343314.jpg",
        "https://thumbs.dreamstime.com/b/movie-film-poster-template-design-modern-retro-vintage-style-movie-film-poster-template-design-modern-retro-vintage-style-125779532.jpg",
        "https://media.istockphoto.com/id/1127899152/vector/movie-and-film-poster-design-template-background-modern-vintage-retro-style.jpg?s=612x612&w=0&k=20&c=brNq4L210W-Vp4m-0Lg78JLyt86pdIcSDFDBWI0v4qc=",
        "https://media.istockphoto.com/id/995815438/vector/movie-and-film-modern-retro-vintage-poster-background.jpg?s=612x612&w=0&k=20&c=UvRsJaKcp0EKIuqDKp6S7Dwhltt0D5rbegPkS-B8nDQ="
    ]
    const thumbnailUrl = room.thumbnailUrl;

    const navigateTo = useNavigate();

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
                    <div className="absolute h-full w-full bg-cover rounded-lg rgb-bg-2 flex items-center justify-center">
                        <MdHideImage className="absolute h-8 w-8 rgb-2"/>
                    </div>
                )}
            </div>
            {/* <div className="w-full absolute top-0 bg-[#000A] p-3"> */}
            {/*     <div className="flex items-center gap-3"> */}
            {/*         { isPlaying ? ( */}
            {/*             <> */}
            {/*                 <div className="w-3 h-3 rgb-bg-on-2 rounded-max"/> */}
            {/*                 <p className="sw-fw-1">{lastMovie}</p> */}
            {/*             </> */}
            {/*         ) : ( */}
            {/*             <p className="">Last active: {'unknown' || displayDate(lastActive)}</p> */}
            {/*         )} */}
            {/*     </div> */}
            {/* </div> */}
            <div className="w-full absolute bottom-0 bg-[#000A] p-3 rounded-b-2xl">
                <div className="flex gap-3 items-center py-2">
                    <p className="sw-fw-1">{nMembers} members</p>
                    { isOrganizer && (
                        <div className="sw-border px-3 rounded-max rgb-bg-1">
                            <label>Owner</label>
                        </div>
                    )}
                </div>
                <p className="sw-fw-1 sw-fs-3 overflow-hidden whitespace-nowrap overflow-ellipsis">
                    {name}</p>
            </div>
        </div>
    );
}

export default RoomPoster;
