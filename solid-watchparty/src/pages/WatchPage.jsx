/* library imports */
import { useState, useEffect, useRef } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import { useSearchParams } from 'react-router-dom';

/* component imports */
import SWPageWrapper from '../components/SWPageWrapper'
import SWLoadingIcon from '../components/SWLoadingIcon';
import SWChatComponent from '../components/SWChatComponent';
import SWModal from '../components/SWModal';
import SWVideoPlayer from '../components/SWVideoPlayer';

/* service imports */
import RoomSolidService from '../services/room.solidservice.js';
import MessageSolidService from '../services/message.solidservice.js';
import EventsSolidService from '../services/events.solidservice.js';

/* uitil imports */
import {inSession} from '../utils/solidUtils.js';


function logNewVideoObject(oldDash, newDash) {
}


function WatchPage() {
  const [parentHeight, setParentHeight] = useState('auto');
  const [modalIsShown, setModalIsShown] = useState(false);
  const [newDashLink, setNewDashLink] = useState(null);
  const [dashSrc, setDashSrc] = useState(null);
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

      videoObjectStream = await EventsSolidService.getVideoObjectStream(session, roomUrl);
      if (videoObjectStream.error) {
        console.error(videoObjectStream.error);
        videoObjectStream = null;
        return;
      }
      console.log('NOW LISTENING FOR VIDEOS')

      let dashPlaying = null;
      videoObjectStream.on('data', (data) => {
        console.log('NEW VIDEO ACQUIRED')
        const newDashsrc = {
          src:        data.get('dashLink').value,
          startDate:  new Date(data.get('startDate').value)
        };
        console.log('===============================',
                    '\nVideoObject Update Received',
                    '\nlast videoObjectStream start:\t', dashPlaying?.startDate, dashPlaying?.src,
                    '\nnew videoObjectStream start:\t', newDashsrc.startDate, newDashsrc.src,
                    '\ndiff:\t', data.diff
        );
        if (!dashPlaying || newDashsrc.startDate >= dashPlaying.startDate) {
          dashPlaying = newDashsrc;
          setDashSrc(dashPlaying);
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
          <SWVideoPlayer className="w-full aspect-video" startDate={dashSrc?.startDate} src={dashSrc?.src} title=""/>
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
                   onChange={(e) => setNewDashLink(e.target.value)} />
          </div>
          <button className={`sw-btn flex-grow h-6 mt-6 flex justify-center`}
                  onClick={() => {
                    EventsSolidService.newWatchingEvent(session, roomUrl, newDashLink)
                    setNewDashLink(null)
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
