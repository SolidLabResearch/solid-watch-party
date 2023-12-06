/* NOTE(Elias): libary imports */
import PropTypes from 'prop-types';

/* NOTE(Elias): Utils Imports */
import { displayDate } from '../utils/general.js'

function MessageComponent({message})
{
  return (
      <div className="pb-2 flex">
        <div className="w-6 h-6 m-2 rgb-bg-3 rounded-max">
        </div>
        <div className="pb-2">
          <div className="w-fit w-max flex items-baseline">
            <p className="sw-fw-1 mr-2">{message.sender}</p>
            <p className="rgb-2 text-sm">{displayDate(message.date)}</p>
          </div>
          <div className="rgb-1 w-fit w-max">
            <p>{message.text}</p>
          </div>
        </div>
      </div>
    );
}

MessageComponent.propTypes = {
    message:    PropTypes.object,
};

export default MessageComponent
