/* libary imports */
import {
    useSession,
} from '@inrupt/solid-ui-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* component imports */
import SWPageWrapper from '../components/SWPageWrapper';
import SWLoadingIcon from '../components/SWLoadingIcon';

/* service imports */
import RoomSolidService from '../services/room.solidservice';
import MessageSolidService from '../services/message.solidservice';

/* util imports */
import {
    validateAll,
    validateRequired,
    validateIsUrl,
    validateLength
} from '../utils/validationUtils';

/* config imports */
import config from '../../config';

function
MenuPage()
{
    const [roomUrl, setRoomUrl] = useState({value: "", alertMsg: null});
    const [roomName, setRoomName] = useState({value: "", alertMsg: null});
    const [isCreateLoading, setIsCreateLoading] = useState(false);
    const [isJoinLoading, setIsJoinLoading] = useState(false);

    const sessionContext = useSession();
    const navigateTo = useNavigate();

    const joinRoomClicked = async () => {
        setIsJoinLoading(true);
        const isValid = validateAll(roomUrl, setRoomUrl, [
            {run: validateRequired, message: "Provide a URL!"},
            {run: validateIsUrl, message: "Provide a valid URL!"},
        ])
        if (isValid) {
            navigateTo(`${config.baseDir}/watch?roomUrl=${encodeURIComponent(roomUrl.value)}`);
        }
        setIsJoinLoading(false);
    };

    const createRoomClicked = async () => {
        setIsCreateLoading(true);
        const isValid = validateAll(roomName, setRoomName, [
            {run: validateRequired, message: "Provide a name!"},
            {run: (v) => validateLength(v, 1, 42), message: "Your name can only be 42 characters long!"},
        ])
        if (isValid) {
            // TODO: At the moment an error in this process will cause dangling dataset
            const roomResult = await RoomSolidService.createNewRoom(sessionContext, roomName.value)
            if (!roomResult || roomResult.error) {
                setRoomName({value: roomName.value, alertMsg: roomResult.errorMsg});
                setIsCreateLoading(false);
                return;
            }
            const messageboxResult = await MessageSolidService.createMyMessageBox(sessionContext, roomResult.roomUrl);
            if (!messageboxResult || messageboxResult.error) {
                setRoomName({value: roomName.value, alertMsg: "Something went wrong, try again"});
                setIsCreateLoading(false);
                return;
            }
            const registerResult = await RoomSolidService.register(sessionContext, messageboxResult.messageboxUrl,
                                                                   roomResult.roomUrl);
            if (!registerResult || registerResult.error) {
                setRoomName({value: roomName.value, alertMsg: "Something went wrong, try again"});
                setIsCreateLoading(false);
                return;
            }
            const addResult = await RoomSolidService.addPerson(sessionContext, roomResult.roomUrl,
                                                               messageboxResult.messageboxUrl,
                                                               sessionContext.session.info.webId);
            navigateTo(`${config.baseDir}/watch?roomUrl=${encodeURIComponent(roomResult.roomUrl)}`);
        }
        setIsCreateLoading(false);
    };

    return (
        <SWPageWrapper className="flex justify-center items-center" mustBeAuthenticated={true}>
            <div className="w-1/2">
                <p className="sw-fs-2 sw-fw-1 my-4">Join a room</p>
                <div className="flex flex-col">
                    <p className="my-1">Room URL</p>
                    <input type="url" name="roomUrlField" className="sw-input flex-grow"
                        onChange={(e) => setRoomUrl({value: e.target.value, alertMsg: null})}
                        placeholder="http://example.com/pod/rooms/new-room2023-11-21t153957921z"/>
                    { roomUrl.alertMsg && <p className="my-1 rgb-alert sw-fw-1">{roomUrl.alertMsg}</p>}
                    <button className={`${isJoinLoading ? 'sw-btn-loading' : 'sw-btn'} my-3 flex-grow h-6 flex justify-center`}
                        onClick={joinRoomClicked}>
                        {isJoinLoading ? <SWLoadingIcon className="w-4"/> : <>Join room</>}
                    </button>
                </div>
                <div className="my-8">
                    <p className="sw-fs-2 sw-fw-1 my-4">Or create a new room</p>
                    <p className="my-1">Room name</p>
                    <div className="flex">
                        <input type="url" name="roomName" className="sw-input w-1/2"
                            onChange={(e) => setRoomName({value: e.target.value, alertMsg: null})}
                            placeholder="Room (new)"/>
                        <button className={`${isCreateLoading ? 'sw-btn-loading' : 'sw-btn'} w-32 ml-2 h-6 flex justify-center`}
                            onClick={createRoomClicked}>
                            {isCreateLoading ? <SWLoadingIcon className="w-4"/> : <>Create room</>}
                        </button>
                    </div>
                    { roomName.alertMsg && <p className="my-1 rgb-alert sw-fw-1">{roomName.alertMsg}</p>}
                </div>
            </div>
        </SWPageWrapper>
    )
}


export default MenuPage;
