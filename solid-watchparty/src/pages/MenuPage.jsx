/* NOTE(Elias): libary imports */
import {
  useSession,
} from '@inrupt/solid-ui-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* NOTE(Elias): component imports */
import SWPageWrapper from '../components/SWPageWrapper';

/* NOTE(Elias): service imports */
import RoomSolidService from '../services/room.solidservice';

/* NOTE(Elias): util imports */
import { doesResourceExist } from '../utils/solidUtils';

function
MenuPage()
{
  const [roomUrl, setRoomUrl] = useState("");

  const { session } = useSession();
  const navigateTo = useNavigate();

  const joinRoomClicked = async () => {
    const result = await doesResourceExist(roomUrl);
    if (result.exists) {
      navigateTo('/watch?room=' + encodeURIComponent(roomUrl));
    }
    /* TODO(Elias): Add error handling */
  };

  const createRoomClicked = async () => {
    /* TODO(Elias): Add the ability to give a name to the room instead of "new room" */
    /* TODO(Elias): Add a loading icon */
    const result = await RoomSolidService.createNewRoom(session, "new room")

    /* TODO(Elias): Abstract an error/interrupt handler */
    /* TODO(Elias): Add an error component */
    if (result.error || result.interrupt) {
      return;
    }
    navigateTo('/watch?room=' + encodeURIComponent(result.roomUrl));
  };

  /* TODO(Elias): Add pastRooms */
  return (
    <SWPageWrapper className="flex justify-center items-center">
      <div className="w-1/2">
        <h1 className="sw-fs-1 sw-fw-1 mb-5">Rooms</h1>
        <div className="flex">
          <input type="url" name="roomUrlField" className="sw-input w-full" onChange={(e) => setRoomUrl(e.target.value)}
                 placeholder="http://example.com/pod/rooms/new-room2023-11-21t153957921z"/>
          <button className="sw-btn w-32 ml-3" onClick={joinRoomClicked}>Join room</button>
        </div>
        <div className="my-8">
          <p className="sw-fs-4">Or create a new room</p>
          <button className="sw-btn w-32 my-2" onClick={createRoomClicked}>Create room</button>
        </div>
      </div>
    </SWPageWrapper>
  )
}


export default MenuPage;
