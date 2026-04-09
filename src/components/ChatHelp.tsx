import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HelpCircle, X, Send, Bot, User } from "lucide-react";
import { useChatbase, CHAT_TOGGLE_EVENT } from "@/hooks/useChatbase";

interface ChatHelpProps {
  chatbotId?: string;
  buttonClassName?: string;
  iconClassName?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "custom";
  customPosition?: string;
}

export function ChatHelp({
  chatbotId,
  buttonClassName = "",
  iconClassName = "",
  position = "bottom-right",
  customPosition = "",
}: ChatHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{type: "user" | "bot"; text: string}[]>([
    { type: "bot", text: "Hi there! I'm Cura's virtual assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const { openChat } = useChatbase({ chatbotId });

  // Handle global toggle event from useChatbase
  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.open !== undefined) {
        setIsOpen(customEvent.detail.open);
      } else {
        setIsOpen(prev => !prev);
      }
    };
    
    window.addEventListener(CHAT_TOGGLE_EVENT, handleToggle);
    return () => window.removeEventListener(CHAT_TOGGLE_EVENT, handleToggle);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { type: "user", text: input }]);
    setInput("");
    setIsTyping(true);
    
    // Simulate bot response
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        type: "bot", 
        text: "Thanks for reaching out! Since this is a local simulated chat interface, a real support agent cannot reply. Please contact us directly at support@cura.com!" 
      }]);
    }, 1500);
  };
  
  const getPositionClasses = () => {
    if (position === "custom") return customPosition;
    
    switch (position) {
      case "bottom-right":
        return "fixed bottom-6 right-6 z-[1000]";
      case "bottom-left":
        return "fixed bottom-6 left-6 z-[1000]";
      case "top-right":
        return "fixed top-6 right-6 z-[1000]";
      case "top-left":
        return "fixed top-6 left-6 z-[1000]";
      default:
        return "fixed bottom-6 right-6 z-[1000]";
    }
  };
  
  return (
    <div className={getPositionClasses()} data-chatbase-component>
      {isOpen ? (
        <Card className="w-80 h-96 shadow-2xl flex flex-col border border-gray-200 overflow-hidden transform animate-in slide-in-from-bottom-5">
          <CardHeader className="bg-amber-400 p-4 flex flex-row justify-between items-center rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="text-white" size={24} />
              <CardTitle className="text-white text-lg font-bold m-0">Cura Support</CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-amber-500 rounded-full" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex w-full ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                  msg.type === "user" 
                    ? "bg-amber-400 text-white rounded-br-none" 
                    : "bg-white border text-gray-800 rounded-bl-none shadow-sm"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex w-full justify-start">
                <div className="bg-white border text-gray-500 rounded-lg rounded-bl-none p-3 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          <CardFooter className="p-3 bg-white border-t border-gray-100">
            <form className="flex w-full items-center gap-2" onSubmit={handleSend}>
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <Button type="submit" size="icon" className="bg-amber-400 hover:bg-amber-500 h-10 w-10 text-white shrink-0">
                <Send size={16} />
              </Button>
            </form>
          </CardFooter>
        </Card>
      ) : (
        <Button
          onClick={openChat}
          className={`w-14 h-14 rounded-full shadow-lg bg-amber-400 hover:bg-amber-500 flex items-center justify-center transition-transform hover:scale-110 ${buttonClassName}`}
          aria-label="Get help"
          type="button"
        >
          <HelpCircle className={`w-7 h-7 text-white ${iconClassName}`} />
        </Button>
      )}
    </div>
  );
}
