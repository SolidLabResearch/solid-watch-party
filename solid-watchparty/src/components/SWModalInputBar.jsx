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


function SWModalInputBar({setModalIsShown, title, f, args}) {
    const inputRef = useRef(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");


    useEffect(() => {
        inputRef.current.focus();
    }, [isLoading]);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) {
            return;
        }
        setIsLoading(true);
        const result = await f({
            input:          inputRef.current.value,
            setError:       setError,
            ...args
        });
        if (result) {
            setError(result);
        }
        setIsLoading(false);
    }

    const inputStyle =
        (isLoading) ? "sw-input-disabled"
        : (error) ? "sw-input-error"
        : "sw-input";
    return (
        <SWModal className="p-12 z-10 w-1/2" setIsShown={setModalIsShown}>
            <form onSubmit={onSubmit} className={`p-24 flex w-full items-center justify-between gap-6 border ${inputStyle}`}>
                <label className="w-fit sw-fw-1 rgb-1">{title}:</label>
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

export default SWModalInputBar;
