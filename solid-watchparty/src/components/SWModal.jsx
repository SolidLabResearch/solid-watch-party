import PropTypes from 'prop-types';

function SWModal({children, className, setIsShown}) {
    const outsideClicked = () => {
        setIsShown(false);
    }
    return (
        <div className="fixed flex-col top-0 right-0 left-0 bottom-0 flex justify-center items-center z-50">
            <div onClick={outsideClicked} className="fixed top-0 right-0 left-0 bottom-0 bg-[#000D]"/>
            <div className={className}>
                {children}
            </div>
        </div>
    );
}

SWModal.propTypes = {
    children:     PropTypes.node,
    className:    PropTypes.string,
    setIsShown:   PropTypes.func
};

export default SWModal;
