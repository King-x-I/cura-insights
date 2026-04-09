import { useState, useEffect } from 'react';

// Default chatbot ID that can be overridden
const DEFAULT_CHATBOT_ID = '8vY43H3xte3q7CfWt1uoP';

export const CHAT_TOGGLE_EVENT = 'toggle-support-chat';

interface ChatbaseOptions {
  chatbotId?: string;
  domain?: string;
}

declare global {
  interface Window {
    botpressWebChat?: any;
    botpress?: any;
  }
}

export function useChatbase({ chatbotId = DEFAULT_CHATBOT_ID, domain = 'www.chatbase.co' }: ChatbaseOptions = {}) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(true); 

  const openChat = () => {
    console.log("Opening Botpress Webchat...");
    if (typeof window !== "undefined") {
      if (window.botpressWebChat) {
        window.botpressWebChat.sendEvent({ type: 'show' });
      } else if (window.botpress) {
        window.botpress.open();
      } else {
        console.warn("Botpress is not initialized yet");
      }
    }
  };

  const closeChat = () => {
    console.log("Closing Botpress Webchat...");
    if (typeof window !== "undefined") {
       if (window.botpressWebChat) {
        window.botpressWebChat.sendEvent({ type: 'hide' });
      } else if (window.botpress) {
        window.botpress.close();
      }
    }
  };

  return { openChat, closeChat, isScriptLoaded };
}
