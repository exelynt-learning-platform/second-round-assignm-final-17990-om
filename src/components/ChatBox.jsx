import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSelector, useDispatch } from 'react-redux';
import { sendMessage, addUserMessage, clearChat, clearError } from '../features/chat/chatSlice';
import { Bot, User, Send, Trash2, AlertCircle, X } from 'lucide-react';

const MessageBubble = ({ msg }) => (
  <div className={`flex items-end gap-2 message-animate ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    {msg.role === 'assistant' && (
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-indigo-600" />
      </div>
    )}
    <div className={`max-w-[75%] md:max-w-[65%] px-4 py-3 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
      msg.role === 'user'
        ? 'bg-indigo-600 text-white rounded-br-sm'
        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
    }`}>
      {msg.role === 'assistant' ? (
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
            ol: ({ children }) => <ol className="list-decimal ml-4 space-y-1 my-2">{children}</ol>,
            ul: ({ children }) => <ul className="list-disc ml-4 space-y-1 my-2">{children}</ul>,
            li: ({ children }) => <li className="leading-snug">{children}</li>,
            h1: ({ children }) => <h1 className="font-bold text-base mb-1">{children}</h1>,
            h2: ({ children }) => <h2 className="font-bold text-sm mb-1">{children}</h2>,
            h3: ({ children }) => <h3 className="font-semibold text-sm mb-1">{children}</h3>,
          }}
        >{msg.content}</ReactMarkdown>
      ) : msg.content}
      <span className={`block text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-indigo-200 text-right' : 'text-gray-400'}`}>
        {msg.timestamp}
      </span>
    </div>
    {msg.role === 'user' && (
      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
        <User className="w-4 h-4 text-white" />
      </div>
    )}
  </div>
);

const ChatBox = () => {
  const [input, setInput] = useState('');
  const messages = useSelector((state) => state.chat.messages);
  const status   = useSelector((state) => state.chat.status);
  const error    = useSelector((state) => state.chat.error);

  const dispatch = useDispatch();
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Scroll to bottom only when messages list or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  // useCallback — stable references so child components don't re-render
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || status === 'loading') return;
    dispatch(clearError());
    dispatch(addUserMessage(text));
    dispatch(sendMessage(text));
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input, status, dispatch]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleInput = useCallback((e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, []);

  const handleClear = useCallback(() => {
    dispatch(clearChat());
    dispatch(clearError());
  }, [dispatch]);

  const handleDismissError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return (
   <div className="w-screen h-screen bg-black flex flex-col">

  {/* Header */}
  <div className="flex items-center justify-between px-5 py-4 bg-black text-white border-b border-gray-800 flex-shrink-0">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-semibold text-base leading-tight">OM'SAI</p>
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full inline-block ${status === 'loading' ? 'bg-yellow-400' : 'bg-green-400'}`} />
          {status === 'loading' ? 'Typing...' : 'Online'}
        </p>
      </div>
    </div>
    <button
      onClick={handleClear}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" /> Clear chat
    </button>
  </div>

  {/* Error Banner */}
  {error && (
    <div className="flex items-start gap-3 bg-red-900/40 border-b border-red-700 px-5 py-3 flex-shrink-0">
      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
      <p className="text-sm text-red-300 flex-1">{error}</p>
      <button onClick={handleDismissError} className="text-red-400 hover:text-red-200">
        <X className="w-4 h-4" />
      </button>
    </div>
  )}

  {/* Messages Area */}
  <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-black text-white">

    {/* Empty state */}
    {messages.length === 0 && status !== 'loading' && (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
        <Bot className="w-12 h-12 text-gray-700" />
        <p className="text-sm font-medium">Send a message to start chatting</p>
        <p className="text-xs text-gray-600">Powered by Custom API</p>
      </div>
    )}

    {messages.map((msg) => (
      <MessageBubble key={msg.id} msg={msg} />
    ))}

    {/* Loading */}
    {status === 'loading' && (
      <div className="flex items-end gap-2 justify-start">
        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="bg-gray-800 rounded-2xl px-4 py-3">
          <div className="loader-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )}

    <div ref={bottomRef} />
  </div>

  {/* Input Area */}
  <div className="border-t border-gray-800 bg-black px-4 py-3">
    <div className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Type a message..."
        disabled={status === 'loading'}
        className="flex-1 resize-none bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
      />
      <button
        onClick={handleSend}
        disabled={!input.trim() || status === 'loading'}
        className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  </div>

</div>
  );
};

export default ChatBox;
