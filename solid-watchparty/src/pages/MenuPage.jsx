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

function AddRoomPoster({setModalIsShown}) {
    return (
        <button className={
            "relative flex flex-col justify-center items-center"
            + " aspect-[27/39] h-96 rgb-bg-2 sw-border shadow-lg rounded border-dashed"
            + " hover:cursor-pointer hover:shadow-xl hover:rgb-bg-1"
            + " active:shadow-none active:rgb-bg-active-1 active:bg-opacity-10"
            + " sw-fs-1 rgb-2 hover:fg-opacity-10 active:rgb-active-1"
            } onClick={() => setModalIsShown(true)}>
            <p>+</p>
        </button>
    );
}

function AddRoomModal({setModalIsShown, action}) {
    const inputRef = useRef(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const sessionContext = useSession();
    const navigateTo = useNavigate();
    const [,setMessageBox] = useContext(MessageBoxContext);

    useEffect(() => {
        inputRef.current.focus();
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) {
            return;
        }
        setIsLoading(true);
        const result = await action.f({
            input: inputRef.current.value,
            setError: setError,
            sessionContext: sessionContext,
            setMessageBox: setMessageBox,
            navigateTo: navigateTo,
        });
        if (result) {
            setError(result);
        }
        setIsLoading(false);
    }

    return (
        <SWModal className="p-12 z-10 w-1/2" setIsShown={setModalIsShown}>
            <form onSubmit={onSubmit} className={`p-24 flex w-full items-center justify-between gap-6 border sw-input${error === "" ? "" : "-error"}`}>
                <label className="w-fit sw-fw-1">{action.name}:</label>
                <input className="flex grow" ref={inputRef} onChange={() => setError("")} disabled={isLoading} />
                <button className={`sw-btn w-fit`} type="submit">
                    { isLoading ? <SWLoadingIcon className="w-4"/> : <FaChevronRight className="w-4 h-4"/> }
                </button>
            </form>
            <div className="h-12 mt-3 rgb-alert sw-fw-1">
                <label>{error}</label>
            </div>
        </SWModal>
    );
}


function MenuPage()
{
    const [modalIsShown, setModalIsShown] = useState(false);
    const [action, setAction] = useState({name: "", f: null});
    return (
        <SWPageWrapper className="px-24" mustBeAuthenticated={true}>
            <div className="flex justify-between items-center my-16 grid grid-cols-3">
                <div></div>
                <div className="sw-input h-fit flex justify-between">
                    <input type="text" placeholder="Room URL"/>
                    <button className="hover:cursor-pointer">
                        <FaMagnifyingGlass className="w-6 h-6 p-1"/>
                    </button>
                </div>
                <div className="flex w-full gap-3 justify-end">
                    <button className="hover:cursor-pointer sw-btn sw-btn-1 w-24"
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
            <div className="flex flex-wrap gap-12">
                <RoomPoster room={{
                    name: ":woozy_face:",
                    roomUrl: "https://test.com",
                    lastMovie: "Jaws",
                    nMembers: 5,
                    isOwner: false,
                    isPlaying: false,
                    lastActive: new Date(),
                }}/>
                <RoomPoster room={{
                    name: "Hello World!",
                    roomUrl: "https://test.com",
                    lastMovie: "Jaws",
                    nMembers: 5,
                    isOwner: true,
                    isPlaying: true,
                    lastActive: new Date(),
                }}/>
                <RoomPoster room={{ name: "HAAI-P!!!", roomUrl: "https://test.com", lastMovie: "Jaws", nMembers: 5, isOwner: true, isPlaying: false, lastActive: new Date(), thumbnailUrl: "https://i.ebayimg.com/images/g/GsEAAOSw~DtilaQH/s-l1200.webp", }}/>
                <RoomPoster room={{ name: "HAAI-P!!!", roomUrl: "https://test.com", lastMovie: "Jaws", nMembers: 5, isOwner: true, isPlaying: false, lastActive: new Date(), thumbnailUrl: "https://i.ebayimg.com/images/g/GsEAAOSw~DtilaQH/s-l1200.webp", }}/>
                <RoomPoster room={{ name: "HAAI-P!!!", roomUrl: "https://test.com", lastMovie: "Jaws", nMembers: 5, isOwner: true, isPlaying: false, lastActive: new Date(), thumbnailUrl: "https://i.ebayimg.com/images/g/GsEAAOSw~DtilaQH/s-l1200.webp", }}/>
                <RoomPoster room={{ name: "HAAI-P!!!", roomUrl: "https://test.com", lastMovie: "Jaws", nMembers: 5, isOwner: true, isPlaying: false, lastActive: new Date(), thumbnailUrl: "https://i.ebayimg.com/images/g/GsEAAOSw~DtilaQH/s-l1200.webp", }}/>
                <RoomPoster room={{ name: "HAAI-P!!!", roomUrl: "https://test.com", lastMovie: "Jaws", nMembers: 5, isOwner: true, isPlaying: false, lastActive: new Date(), thumbnailUrl: "https://i.ebayimg.com/images/g/GsEAAOSw~DtilaQH/s-l1200.webp", }}/>
                <RoomPoster room={{ name: "HAAI-P!!!", roomUrl: "https://test.com", lastMovie: "Jaws", nMembers: 5, isOwner: true, isPlaying: false, lastActive: new Date(), thumbnailUrl: "https://i.ebayimg.com/images/g/GsEAAOSw~DtilaQH/s-l1200.webp", }}/>
                <RoomPoster room={{ name: "HAAI-P!!!", roomUrl: "https://test.com", lastMovie: "Jaws", nMembers: 5, isOwner: true, isPlaying: false, lastActive: new Date(), thumbnailUrl: "https://i.ebayimg.com/images/g/GsEAAOSw~DtilaQH/s-l1200.webp", }}/>
            </div>
            { modalIsShown && <AddRoomModal setModalIsShown={setModalIsShown} action={action}/> }
        </SWPageWrapper>
    )
}


export default MenuPage;
