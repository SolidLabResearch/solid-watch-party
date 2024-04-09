import { useEffect, useState, useRef } from 'react';

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

export default SWSwitch;
