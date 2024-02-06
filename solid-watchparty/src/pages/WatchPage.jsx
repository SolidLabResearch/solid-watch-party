/* library Imports */
import { useState, useEffect, useRef } from 'react';
import { useSession, } from "@inrupt/solid-ui-react";
import { useSearchParams } from 'react-router-dom';

/* component Imports */
import SWPageWrapper from '../components/SWPageWrapper'
import SWLoadingIcon from '../components/SWLoadingIcon';
import SWChatComponent from '../components/SWChatComponent';

/* service Imports */
import RoomSolidService from '../services/room.solidservice.js';
import MessageSolidService from '../services/message.solidservice.js'


function
WatchPage() {
  const [parentHeight, setParentHeight] = useState('auto');
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
      <div>
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
          <p>{roomUrl}</p>
        </div>
      </div>
    </SWPageWrapper>
  );
}

export default WatchPage;
