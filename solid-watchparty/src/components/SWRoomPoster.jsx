/* libary imports */
import { useSession, } from '@inrupt/solid-ui-react';
import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMagnifyingGlass } from "react-icons/fa6";
import { FaChevronRight } from 'react-icons/fa';

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


function RoomPoster({room: {name, url, lastMovie, nMembers, isOwner, isPlaying, lastActive, thumbnailUrl}}) {
    thumbnailUrl = thumbnailUrl || "https://media.istockphoto.com/id/995815438/vector/movie-and-film-modern-retro-vintage-poster-background.jpg?s=612x612&w=0&k=20&c=UvRsJaKcp0EKIuqDKp6S7Dwhltt0D5rbegPkS-B8nDQ="
    return (
        <div className={
            "sw-border relative flex-col justify-center items-center aspect-[27/39]"
                + " h-96 shadow-lg rounded bg-black hover:cursor-pointer active:rgb-bg-1"
            }>
            {/* there needs to be a name, last-active date, thumbnail, # members and movie title */}
            <div className="h-full w-full hover:opacity-40 transition-opacity">
                <img className="absolute h-full w-full bg-cover rounded" src={thumbnailUrl} alt="room thumbnail"/>
            </div>
            <div className="w-full absolute top-0 bg-[#000A] p-3">
                <div className="flex items-center gap-3">
                    { isPlaying ? (
                        <>
                            <div className="w-3 h-3 rgb-bg-on-2 rounded-max"/>
                            <p className="sw-fw-1">{lastMovie}</p>
                        </>
                    ) : (
                        <p className="">Last active: {displayDate(lastActive)}</p>
                    )}
                </div>
            </div>
            <div className="w-full absolute bottom-0 bg-[#000A] p-3">
                <p className="sw-fw-1">{nMembers} members</p>
                <div className="flex gap-3 items-center">
                    <p className="sw-fw-1 sw-fs-3">{name}</p>
                    { isOwner && (
                        <div className="sw-border px-3 rounded-max rgb-bg-1">
                            <label>Owner</label>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RoomPoster;
