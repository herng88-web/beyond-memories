// src/components/ChatWidget.tsx
import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface ChatWidgetProps {
  currentDestination?: string;
  language: 'zh' | 'en';
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ currentDestination, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{text: string, isBot: boolean}[]>([
    { text: language === 'zh' ? "你好！我是 AI 助手。有问题随时问我！" : "Hi! I'm your AI assistant.", isBot: true }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, isBot: false }]);
    setInput("");
    
    // 自动回复模拟
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: language === 'zh' ? "收到！AI 功能正在连接中..." : "Got it! AI is connecting...", 
        isBot: true 
      }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-80 h-96 mb-4 flex flex-col overflow-hidden border border-gray-200 animate-in fade-in slide-in-from-bottom-5">
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
            <span className="font-bold flex items-center gap-2"><MessageCircle size={18}/> AI Assistant</span>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 rounded-full p-1"><X size={18}/></button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.isBot ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input 
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={language === 'zh' ? "输入消息..." : "Type a message..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"><Send size={18}/></button>
          </div>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};