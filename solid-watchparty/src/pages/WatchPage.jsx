/* library imports */
import { useEffect, useState, useRef } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import { useSearchParams } from 'react-router-dom';

/* component imports */
import SWPageWrapper from '../components/SWPageWrapper'
import SWChatComponent from '../components/SWChatComponent';
import SWModal from '../components/SWModal';
import SWVideoPlayer from '../components/SWVideoPlayer';

/* service imports */
import RoomSolidService from '../services/room.solidservice.js';
import EventsSolidService from '../services/events.solidservice.js';

/* util imports */
import { SCHEMA_ORG } from '../utils/schemaUtils';


function WatchPage() {
  const [parentHeight, setParentHeight] = useState('auto');
  const [modalIsShown, setModalIsShown] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [joinedRoom, setJoinedRoom] = useState(false);
  const iframeRef = useRef(null);
  const {session, sessionRequestInProgress} = useSession();
  const [searchParams] = useSearchParams();
  const roomUrl = decodeURIComponent(searchParams.get('room'));

  /* TODO(Elias): Add error handling, what if there is no parameter */
  useEffect(() => {
    const fetch = async () => {
      const joiningRoomResult = await RoomSolidService.joinRoom(session, roomUrl)
      if (joiningRoomResult.error) {
        console.error(joiningRoomResult.error);
        return;
      }
      setJoinedRoom(true);
    }
    fetch();
  }, [session, roomUrl, sessionRequestInProgress])

  useEffect(() => {
    const updateChatHeight = () => {
      if (iframeRef.current) {
        setParentHeight(`${iframeRef.current.clientHeight}px`);
      }
    }
    window.addEventListener("resize", updateChatHeight, false);
  }, []);

  return (
    <SWPageWrapper className="h-full" mustBeAuthenticated={true}>
      <div className="px-8 py-4 rgb-2">
        <p>{roomUrl}</p>
      </div>
      <div className="w-full flex px-8 gap-4" style={{height: parentHeight}}>
        <div className="w-2/3 h-fit flex rgb-bg-2 sw-border" ref={iframeRef}>
          <SWVideoPlayer roomUrl={roomUrl} className="w-full aspect-video"/>
        </div>
        <SWChatComponent roomUrl={roomUrl} joined={joinedRoom}/>
      </div>
      <div className="px-8 py-4 rgb-2">
        <button className={`sw-btn flex-grow h-6 flex justify-center`} onClick={() => setModalIsShown(true)}>
          Start new movie/clip
        </button>
      </div>

      {modalIsShown &&
        <SWModal className="rgb-bg-2 p-12 sw-border z-10 w-1/2" setIsShown={setModalIsShown}>
          <p className="sw-fs-2 sw-fw-1 my-4">Start new movie/clip</p>
          <p className="sw-fs-4 sw-fw-1 my-2">Stream location</p>
          <div className="my-2">
            <input type="url" name="locator" className="sw-input w-full" placeholder="Stream Locator"
                   onChange={(e) => setVideoUrl(e.target.value)} />
          </div>
          <button className={`sw-btn flex-grow h-6 mt-6 flex justify-center`}
                  onClick={() => {
                    EventsSolidService.newWatchingEvent(session, roomUrl, videoUrl)
                    setVideoUrl(null)
                    setModalIsShown(false);
                  }}>
            Start
          </button>
        </SWModal>
      }

    </SWPageWrapper>
  );
}

export default WatchPage;
