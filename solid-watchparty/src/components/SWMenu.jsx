import React from 'react';


export function Seperator({children}) {
    return (
        <div className="sw-border h-4 mx-2 w-[1px]"></div>
    );
}


export function MenuBar({children}) {
    children = React.Children.map(children, (child, index) => {
        return (
            <div className="flex flex-row items-center">
                {child}
                {index < children.length - 1 && <Seperator/>}
            </div>
        );
    });
    return (
        <div className="flex flex-row items-center">
            {children}
        </div>
    );
}


export function MenuItem({children, onClick}) {
    return (
        <button className="flex flex-row" onClick={onClick}>
            <a>{children}</a>
        </button>
    );
}


