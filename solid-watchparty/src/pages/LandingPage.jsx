/* library imports */
import { useNavigate } from 'react-router-dom';
import { FaChevronDown } from "react-icons/fa";

/* component imports */
import { MenuBar, MenuItem } from '../components/SWMenu';

/* config imports */
import config from '../../config';

/* asset imports */
import BannerImg from '../assets/bannerimg.png';

function Banner({name, children, className, showArrow=false}) {
    return (
        <div className={`flex flex-col justify-between items-center h-screen ${className}`}>
            <a name={name}></a>
            <div className="flex flex-col justify-center">
                {children}
            </div>
            <div>
                {showArrow && (
                    <a href="#about">
                        <FaChevronDown className="w-8 h-8 mb-20"/>
                    </a>
                )}
            </div>
        </div>
    );
}

export default function LandingPage()
{
    const navigateTo = useNavigate();
    const pathFromBase = (p) => (config.baseDir === '/' ? p : (config.baseDir + p));

    return (
        <>
        <div className={
            "fixed flex grow justify-between items-baseline grid grid-cols-2"
                + " top-0 left-0 w-full px-12 py-6 z-10"
                + " rgb-bg-1"
            }>
            <div className="flex justify-center">
                <MenuBar>
                    <MenuItem href="#home">Home</MenuItem>
                    <MenuItem href="#about">About</MenuItem>
                </MenuBar>
            </div>
            <div className="flex justify-end">
                <button onClick={() => navigateTo(pathFromBase('/auth'))}
                    className="sw-btn sw-btn-2 my-4 w-fit">Login</button>
            </div>
        </div>
        <div className="w-full h-full">
            <div className="h-full">
                <Banner name="home" className="text-center" showArrow={true}>
                    <div className="flex justify-center">
                        <p className="mt-40 sw-fw-1 sw-fs-1 mb-2 sw-text-gradient">watchparty</p>
                    </div>
                    <p className="sw-fs-3 sw-fw-1 rgb-2">
                        Watch videos together with friends and family in a private and secure manner
                    </p>
                </Banner>
                <Banner name="about" className="px-44 bg-[#111] padding-mobile">
                    <div className="flex justify-center items-center w-full flex-mobile">
                        <img src={BannerImg} className="w-1/2 p-12 width-mobile"/>
                        <div className="text-justify w-1/3 width-mobile text-center-mobile">
                            <p className="sw-fs-1 sw-fw-1 my-4 bg-gradient-to-r from-indigo-500 to-[#d9a12A] bg-clip-text text-[#fff5] inline-block">About</p>
                            <p className="sw-fs-2 sw-fw-1 my-4">Watchparty lets you create a room, invite people, watch synchronized videos and chat together – all while keeping control over your viewing experience.</p>
                        </div>
                    </div>
                </Banner>
                <div className="p-44 padding-mobile">
                    <div className="flex justify-center items-center">
                        <p className="sw-fs-2 sw-fw-1 my-4">© 2024 IDLab</p>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
