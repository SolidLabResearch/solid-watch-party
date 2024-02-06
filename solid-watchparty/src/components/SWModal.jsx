export default function SWModal({children, className, setIsShown}) {
  const outsideClicked = () => {
    setIsShown(false);
  }
  return (
      <div className="fixed top-0 right-0 left-0 bottom-0 flex justify-center items-center">
        <div onClick={outsideClicked} className="fixed top-0 right-0 left-0 bottom-0 rgb-bg-1 opacity-80"/>
        <div className={className}>
          {children}
        </div>
      </div>
  );
}
