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


function validateAll(field, setField, validations)
{
  for (let i = 0; i < validations.length; ++i) {
    if (!validations[i].run(field.value)) {
      setField({ value: field.value, alertMsg: validations[i].message });
      return false;
    }
  }
  return true;
}

function validateRequired(string) {
  return string.length > 0;
}

function validateIsUrl(string) {
  return string.includes('https://') || string.includes('http://');
}
function validateLength(string, min, max) {
  return string.length >= min && string.length < max;
}

function
MenuPage()
{
  const [roomUrl, setRoomUrl] = useState({value: "", alertMsg: null});
  const [roomName, setRoomName] = useState({value: "", alertMsg: null});

  const { session } = useSession();
  const navigateTo = useNavigate();

  const joinRoomClicked = async () => {
    const isValid = validateAll(roomUrl, setRoomUrl, [
      {run: validateRequired, message: "Provide a URL!"},
      {run: validateIsUrl, message: "Provide a valid URL!"},
    ])
    if (!isValid) {
      return;
    }
    const result = await doesResourceExist(roomUrl);
    if (result.exists) {
      navigateTo('/watch?room=' + encodeURIComponent(roomUrl.value));
    }
  };

  const createRoomClicked = async () => {
    /* TODO(Elias): Add a loading icon */
    const isValid = validateAll(roomName, setRoomName, [
      {run: validateRequired, message: "Provide a name!"},
      {run: (v) => validateLength(v, 1, 42), message: "Your name can only be 42 characters long!"},
    ])
    if (!isValid) {
      return;
    }
    const result = await RoomSolidService.createNewRoom(session, roomName.value)
    if (result.error || result.interrupt) {
      setRoomName({value: roomName.value, alertMsg: result.errorMsg || result.interruptMsg});
      return;
    }
    navigateTo('/watch?room=' + encodeURIComponent(result.roomUrl));
  };

  return (
    <SWPageWrapper className="flex justify-center items-center" mustBeAuthenticated={true}>
      <div className="w-1/2">
        <p className="sw-fs-2 sw-fw-1 my-4">Join a room</p>
        <div className="flex flex-col">
          <p className="my-1">Room URL</p>
          <input type="url" name="roomUrlField" className="sw-input flex-grow"
                 onChange={(e) => setRoomUrl({value: e.target.value, alertMsg: null})}
                 placeholder="http://example.com/pod/rooms/new-room2023-11-21t153957921z"/>
          { roomUrl.alertMsg && <p className="my-1 rgb-alert sw-fw-1">{roomUrl.alertMsg}</p>}
          <button className="sw-btn my-3 flex-grow" onClick={joinRoomClicked}>Join room</button>
        </div>
        <div className="my-8">
          <p className="sw-fs-2 sw-fw-1 my-4">Or create a new room</p>
          <p className="my-1">Room name</p>
          <input type="url" name="roomName" className="sw-input w-1/2"
                 onChange={(e) => setRoomName({value: e.target.value, alertMsg: null})}
                 placeholder="Room (new)"/>
          <button className="sw-btn w-32 ml-2" onClick={createRoomClicked}>Create room</button>
          { roomName.alertMsg && <p className="my-1 rgb-alert sw-fw-1">{roomName.alertMsg}</p>}
        </div>
      </div>
    </SWPageWrapper>
  )
}


export default MenuPage;
