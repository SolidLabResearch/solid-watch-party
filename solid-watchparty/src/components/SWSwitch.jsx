/* library imports */
import propTypes from 'prop-types';

function SWSwitch({enabled, onSwitch, className, disabled, isLoading}) {
    const onClick = (isLoading || disabled) ? () => {} : () => onSwitch(!enabled);
    return (
        <div className={`relative ${className}`}>
            <button onClick={onClick} className={`${enabled ? 'rgb-bg-active-1' : 'rgb-bg-2'} grid grid-cols-2 items-center sw-border rounded-max w-12 h-6`}>
                <div className={`${!enabled ? 'rgb-bg-4' : 'bg-transparent'} rounded-max aspect-square m-1`}/>
                <div className={`${enabled ? 'rgb-bg-active-2' : 'bg-transparent'} rounded-max aspect-square m-1`}/>
            </button>
            {(disabled || isLoading) && <div className="absolute top-0 left-0 bg-[#0007] w-full h-full"/>}
        </div>
    );
}
SWSwitch.propTypes = {
    enabled:    propTypes.bool,
    onSwitch:   propTypes.func,
    className:  propTypes.string,
    disabled:   propTypes.bool,
    isLoading:  propTypes.bool,
};

export default SWSwitch;
