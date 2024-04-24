
/* library imports */
import { useEffect, useState, useContext } from 'react';
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


function SettingsModal({setModalIsShown, roomUrl}) {
    return (
        <SWModal className="rgb-bg-2 h-2/3 p-12 z-10 w-1/2 sw-border" setIsShown={setModalIsShown}>
            <div className="mb-6 flex items-center justify-between">
                <p className="sw-fs-2 sw-fw-1">Settings</p>
            </div>
            <form>
                <div>
                    <label className="sw-fs-1 sw-fw-1">Name</label>
                    <input className="sw-input" type="text" placeholder="Room name"/>
                </div>
                <div>
                    <label className="sw-fs-1 sw-fw-1">Thumbnail Url</label>
                    <input className="sw-input" type="text" placeholder="Image Url"/>
                </div>
                <button className="sw-btn sw-btn-1 mt-6 w-full">Save</button>
            </form>
        </SWModal>
    );
}

export default SettingsModal;
