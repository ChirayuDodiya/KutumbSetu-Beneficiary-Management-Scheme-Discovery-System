import React, { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import { MessageSquare, MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';

const AssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

  // Set initial welcome message
  useEffect(() => {
    setMessages([
      { role: 'bot', content: lang === 'gu' ? 'નમસ્તે! હું કુટુંબસેતુ માટે તમારો AI સહાયક છું. તમે મને સરકારી યોજનાઓ, પાત્રતા અથવા જરૂરી દસ્તાવેજો વિશે કોઈપણ પ્રશ્નો પૂછી શકો છો.' : 'Hello! I am your AI assistant for Kutumbsetu. You can ask me any questions about government schemes, eligibility, or required documents.' }
    ]);
  }, [lang]);

  // Track language changes
  useEffect(() => {
    const handleLangChange = () => {
      setLang(localStorage.getItem('lang') || 'en');
    };
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

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
      const res = await api.post('/assistant/ask', { question: userMsg, language: lang });
      
      const { answer, sources } = res.data.data;
      
      let botMsg = answer;
      // We already append sources in the backend now, so we can just use the answer directly!
      
      setMessages(prev => [...prev, { role: 'bot', content: botMsg }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: lang === 'gu' ? 'માફ કરશો, નેટવર્કની સમસ્યાને કારણે હું જવાબ આપી શકતો નથી.' : 'Sorry, I am currently facing network issues and cannot answer right now.' }]);
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
          <div className="p-3 bg-blue-900 text-white rounded-t-lg flex justify-between items-center shadow-md relative z-10">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-200" />
              <h3 className="font-bold tracking-wide">{lang === 'gu' ? 'AI સહાયક' : 'AI Assistant'}</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-blue-200 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg text-sm shadow-sm whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] p-3 rounded-lg text-sm bg-white border border-gray-200 shadow-sm rounded-bl-none flex items-center space-x-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'gu' ? 'વિચારી રહ્યાં છે...' : 'Thinking...'}</span>
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
                placeholder={lang === 'gu' ? 'તમારો પ્રશ્ન પૂછો...' : 'Ask about schemes...'}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center"
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
