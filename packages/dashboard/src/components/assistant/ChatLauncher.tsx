import { useEffect, useState } from "react";
import ChatAssistant from "./ChatAssistant";
import ChatMascot from "./ChatMascot";

const ChatLauncher = () => {
  const [open, setOpen] = useState(false);
  const [cookieBannerOpen, setCookieBannerOpen] = useState(false);

  // Detect the cookie banner so the mascot can lift above it.
  useEffect(() => {
    const check = () => {
      const banner = document.querySelector<HTMLElement>('[aria-label="Cookie consent"]');
      setCookieBannerOpen(!!banner);
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <ChatMascot onOpen={() => setOpen(true)} cookieBannerOpen={cookieBannerOpen} />
      <ChatAssistant open={open} onOpenChange={setOpen} />
    </>
  );
};

export default ChatLauncher;
