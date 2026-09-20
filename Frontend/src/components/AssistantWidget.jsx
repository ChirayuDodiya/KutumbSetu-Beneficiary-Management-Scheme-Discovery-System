import React, { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';

const AssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hello! I am your AI assistant for Kutumbsetu. You can ask me any questions about government schemes, eligibility, or required documents.' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post('/assistant/ask', { question: userMsg });
      
      const { answer, sources } = res.data.data;
      
      let botMsg = answer;
      if (sources && sources.length > 0) {
        // Just extract filename from source path if necessary
        const uniqueSources = [...new Set(sources)];
        botMsg += `\n\n*(Source: ${uniqueSources.join(', ')})*`;
      }
      
      setMessages(prev => [...prev, { role: 'bot', content: botMsg }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: 'Sorry, I am currently facing network issues and cannot answer right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-800 text-white p-4 rounded-full shadow-lg hover:bg-blue-900 transition flex items-center justify-center z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden" style={{ height: '500px', maxHeight: '80vh' }}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-bold">Kutumbsetu AI</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-blue-100 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-200 text-blue-800 ml-2' : 'bg-gray-200 text-gray-700 mr-2'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  {/* Bubble */}
                  <div className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'}`}>
                    {msg.content}
                  </div>

                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] flex-row">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-700 mr-2 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-lg bg-white border border-gray-200 text-gray-500 rounded-tl-none shadow-sm flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-200">
            <form onSubmit={handleSend} className="flex space-x-2">
              <input
                type="text"
                placeholder="Ask about schemes..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-blue-700 text-white p-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="text-center mt-2">
              <p className="text-[10px] text-gray-400">AI can make mistakes. Verify official documents.</p>
            </div>
          </div>

        </div>
      )}
    </>
  );
};

export default AssistantWidget;
