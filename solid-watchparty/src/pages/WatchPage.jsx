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

function WatchPage() {
  const [parentHeight, setParentHeight] = useState('auto');
  const [modalIsShown, setModalIsShown] = useState(false);
  const [inputVideoURL, setInputVideoURL] = useState(null);
  const [watchingEvent, setWatchingEvent] = useState(null);
  const [joinedRoom, setJoinedRoom] = useState(false);
  const iframeRef = useRef(null);
  const {session, sessionRequestInProgress} = useSession();

  /* TODO(Elias): Add error handling, what if there is no parameter */
  const [searchParams] = useSearchParams();
  const roomUrl = decodeURIComponent(searchParams.get('room'));


  useEffect(() => {
    let videoObjectStream = null;

    const fetch = async () => {
      const joiningRoomResult = await RoomSolidService.joinRoom(session, roomUrl)
      if (joiningRoomResult.error) {
        console.error(joiningRoomResult.error);
        return;
      }
      setJoinedRoom(true);

      videoObjectStream = await EventsSolidService.getWatchingEventStream(session, roomUrl);
      if (videoObjectStream.error) {
        console.error(videoObjectStream.error);
        videoObjectStream = null;
        return;
      }
      let currentWatchingEvent = null;
      videoObjectStream.on('data', (data) => {
        const receivedWatchingEvent = {
          eventURL:       data.get('watchingEvent').value,
          videoURL:       data.get('dashLink').value,
          startDate:      new Date(data.get('startDate').value)
        };
        if (!currentWatchingEvent || receivedWatchingEvent.startDate >= currentWatchingEvent.startDate) {
          currentWatchingEvent = receivedWatchingEvent;
          setWatchingEvent(currentWatchingEvent);
        }
      });
    }
    fetch();
    return (() => {
      if (videoObjectStream) {
        videoObjectStream.close()
      }
    });
  }, [session, roomUrl, sessionRequestInProgress])

  const updateChatHeight = () => {
    if (iframeRef.current) {
      setParentHeight(`${iframeRef.current.clientHeight}px`);
    }
  }

  useEffect(() => {
    updateChatHeight();
    window.addEventListener("resize", updateChatHeight, false);
  }, [session, sessionRequestInProgress]);

  return (
    <SWPageWrapper className="h-full" mustBeAuthenticated={true}>
      <div className="px-8 py-4 rgb-2">
        <p>{roomUrl}</p>
      </div>
      <div className="w-full flex px-8 gap-4" style={{height: parentHeight}}>
        <div className="w-2/3 h-fit flex rgb-bg-2 sw-border" ref={iframeRef}>
          <SWVideoPlayer className="w-full aspect-video"
                         videoURL={watchingEvent?.videoURL}
                         startDate={watchingEvent?.startDate}
                         playButtonPressed={(isPlay) => {
                           EventsSolidService.saveControlAction(session, watchingEvent?.eventURL, isPlay)
                         }}
          />
        </div>
        <SWChatComponent roomUrl={roomUrl} joined={joinedRoom}/>
      </div>
      <div className="px-8 py-4 rgb-2">
        <button className={`sw-btn flex-grow h-6 flex justify-center`} onClick={() => setModalIsShown(true)}>
          Start new movie/clip
        </button>
      </div>

      {(modalIsShown) ? (
        <SWModal className="rgb-bg-2 p-12 sw-border z-10 w-1/2" setIsShown={setModalIsShown}>
          <p className="sw-fs-2 sw-fw-1 my-4">Start new movie/clip</p>
          <p className="sw-fs-4 sw-fw-1 my-2">Stream location</p>
          <div className="my-2">
            <input type="url" name="locator" className="sw-input w-full" placeholder="Stream Locator"
                   onChange={(e) => setInputVideoURL(e.target.value)} />
          </div>
          <button className={`sw-btn flex-grow h-6 mt-6 flex justify-center`}
                  onClick={() => {
                    EventsSolidService.newWatchingEvent(session, roomUrl, inputVideoURL)
                    setInputVideoURL(null)
                    setModalIsShown(false);
                  }}>
            Start
          </button>
        </SWModal>
      ) : (
        <></>
      )}
    </SWPageWrapper>
  );
}

export default WatchPage;
