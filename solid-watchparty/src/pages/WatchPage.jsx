/* library Imports */
import { useState, useEffect, useRef } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import { useSearchParams } from 'react-router-dom';

/* component Imports */
import SWPageWrapper from '../components/SWPageWrapper'
import SWLoadingIcon from '../components/SWLoadingIcon';
import SWChatComponent from '../components/SWChatComponent';
import SWModal from '../components/SWModal';

/* service Imports */
import RoomSolidService from '../services/room.solidservice.js';
import MessageSolidService from '../services/message.solidservice.js'


function
WatchPage() {
  const [parentHeight, setParentHeight] = useState('auto');
  const [modalIsShown, setModalIsShown] = useState(true);
  const iframeRef = useRef(null);

  const { session } = useSession();
  /* TODO(Elias): Add error handling, what if there is no parameter */

  const [searchParams] = useSearchParams();
  const roomUrl = decodeURIComponent(searchParams.get('room'));

  const updateChatHeight = () => {
    if (iframeRef.current) {
      const height = iframeRef.current.clientHeight;
      setParentHeight(`${height}px`);
    }
  }

  useEffect(() => {
    window.addEventListener("resize", updateChatHeight, false);
  }, []);

  return (
    <SWPageWrapper className="h-full" mustBeAuthenticated={true}>
      <div className="px-8 py-4 rgb-2">
        <p>{roomUrl}</p>
      </div>
      <div className="w-full flex px-8 gap-4" style={{height: parentHeight}}>
        <div className="w-2/3 h-fit flex rgb-bg-2 sw-border" ref={iframeRef}>
          <iframe className="w-full aspect-video" src="" title="YouTube video player" frameborder="0" allow="autoplay; picture-in-picture" allowfullscreen></iframe>
        </div>
        <SWChatComponent roomUrl={roomUrl} />
      </div>
      <div className="px-8 py-4 rgb-2">
        <button className={`sw-btn flex-grow h-6 flex justify-center`} onClick={() => setModalIsShown(true)}>
          Schedule new movie/clip
        </button>
      </div>

      {(modalIsShown) ? (
        <SWModal className="rgb-bg-2 p-12 sw-border z-10 w-1/2" setIsShown={setModalIsShown}>
          <p className="sw-fs-2 sw-fw-1 my-4">Schedule new Clip/Movie</p>
          <p className="sw-fs-4 sw-fw-1 my-2">Stream location</p>
          <div className="my-2">
            <input type="url" name="locator" className="sw-input w-full" placeholder="Stream Locator"/>
          </div>
          <p className="sw-fs-4 sw-fw-1 my-2">Starttime</p>
          <div className="my-2">
            <input type="time" name="timestamp" className="sw-input w-full" placeholder="Starttime"/>
          </div>
          <button className={`sw-btn flex-grow h-6 mt-6 flex justify-center`}>
            Schedule
          </button>
        </SWModal>
      ) : (
        <></>
      )}

    </SWPageWrapper>
  );
}

export default WatchPage;
