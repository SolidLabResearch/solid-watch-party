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
import { parseTitle } from '../utils/messageParser';

/* config imports */
import config from '../../config';


async function joinRoom({input, setError, navigateTo}) {
    const errors = validateAll(input, [
        {run: validateRequired, message: "Provide a URL!"},
        {run: validateIsUrl, message: "Provide a valid URL!"},
        {run: (s) => s.includes(config.baseDir), message: "Provide a valid URL!"}
    ])
    input = input.split(`${config.baseDir}/`)[1];
    if (!errors) {
        navigateTo(`${config.baseDir}/${input}`);
    }
    return errors;
}

async function createRoom({input, setError, sessionContext, setMessageBox, navigateTo}) {
    const errors = validateAll(input, [
        {run: validateRequired, message: "Provide a name!"},
        {run: (v) => validateLength(v, 1, 42), message: "Your name can only be 42 characters long!"},
    ]);
    input = parseTitle(input);
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
        let stream = null;

        const timeout = setTimeout(() => {
            setIsLoading(false);
        }, 10000);

        MessageSolidService.getMessageBoxesStream(sessionContext).then((s) => {
            if (!s || s.error) {
                setIsLoading(false);
                return;
            }
            stream = s
            s.on('data', (r) => {
                const roomUrl = r.get('roomUrl').value;
                const endDate = r.get('endDate')?.value;
                if (!roomUrl || endDate) {
                    return;
                }
                RoomSolidService.getRoomInfo(sessionContext, roomUrl).then((room) => {
                    if (!room || room.error || room.endDate) {
                        return;
                    }
                    setIsLoading(false);
                    setRooms((rooms) => [...rooms, room]);
                });
            });
        });
    }, [sessionContext.sessionRequestInProgress, sessionContext.session]);

    useEffect(() => {
        const filteredrooms = rooms.filter((room) => room.name?.toLowerCase().includes(searchTerm.toLowerCase()));
        setFilteredRooms(filteredrooms);
    }, [searchTerm, rooms]);

    const onDelete = (r1) => {
        setRooms((rooms) => rooms.filter((r2) => r1.roomUrl !== r2.roomUrl));
    }

    return (
        <SWPageWrapper className="px-24 padding-mobile" mustBeAuthenticated={true}>
            <div className="flex justify-between items-baseline my-16 grid grid-cols-2">
                <div className="sw-input h-fit flex justify-between" style={{marginRight: 10, maxWidth: 400}}>
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
                <div className="flex flex-col justify-center items-center">
                    <SWLoadingIcon className="w-6 h-6 py-8"/>
                    <p className="sw-fw-1">Retrieving rooms...</p>
                </div>
            ) : (rooms.length === 0) ? (
                <div className="flex flex-col justify-center items-center">
                    <p className="sw-fw-1 rgb-1">No rooms found</p>
                </div>
            ) : (filteredRooms.length === 0) ? (
                <div className="flex flex-col justify-center items-center">
                    <p className="sw-fw-1 rgb-1">No search results...</p>
                </div>
            ) : (
                <div className="grid gap-12 h-2/4 overflow-y-auto justify-center" style={{gridTemplateColumns: "repeat(auto-fill, 216px)"}}>
                    { filteredRooms.map((room, i) => (
                        <SWRoomPoster key={i} room={room} onDelete={onDelete}/>
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
