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
import SWRoomPoster from '../components/SWRoomPoster';
import SWModalInputBar from '../components/SWModalInputBar';

/* service imports */
import RoomSolidService from '../services/room.solidservice';
import MessageSolidService from '../services/message.solidservice';

/* context imports */
import { MessageBoxContext } from '../contexts';

/* util imports */
import { validateAll, validateRequired, validateIsUrl, validateLength } from '../utils/validationUtils';
import { displayDate } from '../utils/general';
import { inSession } from '../utils/solidUtils';

/* config imports */
import config from '../../config';


async function joinRoom({input, setError, navigateTo}) {
    const errors = validateAll(input, [
        {run: validateRequired, message: "Provide a URL!"},
        {run: validateIsUrl, message: "Provide a valid URL!"},
    ])
    if (!errors) {
        navigateTo(input);
    }
    return errors;
}

async function createRoom({input, setError, sessionContext, setMessageBox, navigateTo}) {
    const errors = validateAll(input, [
        {run: validateRequired, message: "Provide a name!"},
        {run: (v) => validateLength(v, 1, 42), message: "Your name can only be 42 characters long!"},
    ]);
    if (!errors) {
        // TODO: At the moment an error in this process will cause dangling dataset
        const roomResult = await RoomSolidService.createNewRoom(sessionContext, input)
        if (!roomResult || roomResult.error) {
            return roomResult.errorMsg;
        }
        const messageBoxResult = await MessageSolidService.createMyMessageBox(sessionContext, roomResult.roomUrl);
        if (!messageBoxResult || messageBoxResult.error) {
            return "Something went wrong, try again";
        }
        setMessageBox(messageBoxResult.messageBoxUrl);
        const registerResult = await RoomSolidService.register(sessionContext, messageBoxResult.messageBoxUrl,
                                                               roomResult.roomUrl);
        if (!registerResult || registerResult.error) {
            return "Something went wrong, try again";
        }
        const addResult = await RoomSolidService.addPerson(sessionContext, roomResult.roomUrl,
                                                           messageBoxResult.messageBoxUrl,
                                                           sessionContext.session.info.webId);
        if (!addResult || addResult.error) {
            return "Something went wrong, try again";
        }

        navigateTo(`${config.baseDir}/watch?roomUrl=${encodeURIComponent(roomResult.roomUrl)}`);
    }
    return errors;
}



function MenuPage()
{
    const [modalIsShown, setModalIsShown] = useState(false);
    const [action, setAction] = useState({name: "", f: null});
    const [isLoading, setIsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");

    const sessionContext = useSession();
    const navigateTo = useNavigate();
    const [,setMessageBox] = useContext(MessageBoxContext);
    const actionArgs = {
            sessionContext: sessionContext,
            setMessageBox:  setMessageBox,
            navigateTo:     navigateTo,
    }

    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    useEffect(() => {
        setIsLoading(true);
        if (!inSession(sessionContext) || sessionContext.sessionRequestInProgress) {
            return;
        }
        const roomsStream = RoomSolidService.getRoomsStream(sessionContext)
        roomsStream.on('data', async (data) => {
            console.log("NEW ROOM", data);
            // rooms = rooms.push(data);
            // rooms = rooms.filter((room) => !room.error);
            // setRooms(rooms);
            // setFilteredRooms(rooms);
            setIsLoading(false);
        });
    }, [sessionContext.sessionRequestInProgress, sessionContext.session]);

    useEffect(() => {
        const filteredrooms = rooms.filter((room) => room.name?.toLowerCase().includes(searchTerm.toLowerCase()));
        setFilteredRooms(filteredrooms);
    }, [searchTerm]);

    return (
        <SWPageWrapper className="px-24" mustBeAuthenticated={true}>
            <div className="flex justify-between items-baseline my-16 grid grid-cols-3">
                <div></div>
                <div className="sw-input h-fit flex justify-between">
                        <input type="text" placeholder="Find a room" className="w-full"
                               onChange={(e) => setSearchTerm(e.target.value)}/>
                    <button className="hover:cursor-pointer">
                        <FaMagnifyingGlass className="w-6 h-6 p-1"/>
                    </button>
                </div>
                <div className="flex w-full gap-3 justify-end">
                    <button className="hover:cursor-pointer sw-btn sw-btn-2 w-24"
                            onClick={() => {
                                setAction({name: "Room url", f: joinRoom});
                                setModalIsShown(true);
                            }}>
                        Join
                    </button>
                    <button className="hover:cursor-pointer sw-btn sw-btn-1 w-24"
                            onClick={() => {
                                setAction({name: "Room name", f: createRoom});
                                setModalIsShown(true);
                            }}>
                        New
                    </button>
                </div>
            </div>
            { isLoading ? (
                <div className="h-56 flex flex-col items-center">
                    <SWLoadingIcon className="w-6 h-6 py-8"/>
                    <p className="sw-fw-1">Retrieving rooms...</p>
                </div>
            ) : (
                <div className="flex flex-wrap gap-12 h-2/4 overflow-y-auto">
                    { filteredRooms.map((room, i) => (
                        <SWRoomPoster key={i} room={room}/>
                    ))}
                </div>
            )}
            { modalIsShown && (
                <SWModalInputBar title={action.name}f={action.f} args={actionArgs} setModalIsShown={setModalIsShown}/>
            )}
        </SWPageWrapper>
    )
}


export default MenuPage;
