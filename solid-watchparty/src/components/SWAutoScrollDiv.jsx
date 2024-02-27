/* libary imports */
import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';


function AutoScrollDiv({children, className})
{
  const divRef = useRef(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);

  const onScroll = () => {
    const div = divRef.current;
    const atBottom = div.scrollHeight - div.scrollTop - div.clientHeight < 10;
    setIsUserAtBottom(atBottom);
  };

  useEffect(() => {
    const div = divRef.current;
    if (isUserAtBottom) {
      div.scrollTop = div.scrollHeight;
    }
  }, [children, isUserAtBottom]);

  return (
    <div ref={divRef} onScroll={onScroll} className={'' + className}>
      {children}
    </div>
  );
}

AutoScrollDiv.propTypes = {
    children:   PropTypes.node,
    className:  PropTypes.string,
}

export default AutoScrollDiv;
