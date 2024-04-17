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
                {showArrow && <FaChevronDown className="w-8 h-8 mb-20"/>}
            </div>
        </div>
    );
}

export default function LandingPage()
{
    const navigateTo = useNavigate();

    return (
        <>
        <div className={
            "flex grow justify-between items-baseline grid grid-cols-3"
                + " top-0 left-0 fixed w-full px-12 py-6 z-10"
                + " rgb-bg-1"
            }>
            <h1 className="sw-fw-1 mb-5">Solid Watch Party</h1>
            <div className="flex justify-center">
                <MenuBar>
                    <MenuItem href="#home">Home</MenuItem>
                    <MenuItem href="#about">About</MenuItem>
                    <MenuItem href="#solid">Solid</MenuItem>
                </MenuBar>
            </div>
            <div className="flex justify-end">
                <button onClick={() => navigateTo(config.baseDir + '/auth')}
                    className="sw-btn my-4 w-fit">Login</button>
            </div>
        </div>
        <div className="w-full h-full">
            <div className="h-full">
                <Banner name="home" className="text-center" showArrow={true}>
                    <div className="flex justify-center">
                        <p className="mt-40 sw-fw-1 sw-fs-1 mb-2 sw-text-gradient">solid-watchparty</p>
                    </div>
                    <p className="sw-fs-3 sw-fw-1 rgb-2">
                        Watching videos with friends and familiy in a private and secure manner
                    </p>
                </Banner>
                <Banner name="about" className="px-44 bg-[#111]">
                    <div className="flex justify-center items-center w-full">
                        <img src={BannerImg} className="w-1/2 p-12"/>
                        <div className="text-justify w-1/3">
                            <p className="sw-fs-1 sw-fw-1 my-4 bg-gradient-to-r from-indigo-500 to-[#d9a12A] bg-clip-text text-[#fff5] inline-block">About</p>
                            <p className="sw-fs-2 sw-fw-1 my-4">Solid Watch Party is a platform that allows you to watch videos with your friends and family in a private and secure manner. You can create a room, invite your friends and family, watch videos together and chat with each other. The platform is built on top of Solid, a decentralized web platform that gives you control over your data.</p>
                        </div>
                    </div>
                </Banner>
                <Banner name="solid" className="px-44 rgb-bg-solid">
                    <div className="flex justify-center items-center w-full">
                        <div className="text-justify w-1/3">
                            <p className="sw-fs-1 sw-fw-1 my-4">Solid</p>
                            <p className="sw-fs-2 sw-fw-1 my-4">
                                Solid is a technology that lets individuals and groups store their data securely in decentralized data stores called Pods. Pods are like secure web servers for data. When data is stored in a Pod, its owners control which people and applications can access it.
                            </p>
                            <a href="https://solidproject.org/users/get-a-pod" target="_blank">
                                <button className="sw-btn my-4">Create your own pod</button>
                            </a>
                        </div>
                        <img src="https://solidproject.org/assets/img/solid-pod-tour.svg" className="w-1/2 p-40"/>
                    </div>
                </Banner>
                <div className="p-44">
                    <div className="flex justify-center items-center">
                        <p className="sw-fs-2 sw-fw-1 my-4">© 2024 IDLab</p>
                    </div>
                </div>
            </div>
            {/* footer legal information and stuff*/}
        </div>
        </>
    );
}
