import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { sendMessage, addUserMessage, clearChat, clearError } from '../features/chat/chatSlice';
import { Bot, User, Send, Trash2, AlertCircle, X } from 'lucide-react';

// Memoized message bubble — only re-renders if its own data changes
// This prevents all previous messages from re-rendering when a new one arrives
const MessageBubble = memo(({ msg }) => (
  <div className={`flex items-end gap-2 message-animate ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

    {/* AI avatar — LEFT */}
    {msg.role === 'assistant' && (
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-indigo-600" />
      </div>
    )}

    {/* Bubble */}
    <div className={`max-w-[75%] md:max-w-[65%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
      msg.role === 'user'
        ? 'bg-indigo-600 text-white rounded-br-sm'
        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
    }`}>
      {msg.content}
      <span className={`block text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-indigo-200 text-right' : 'text-gray-400'}`}>
        {msg.timestamp}
      </span>
    </div>

    {/* User avatar — RIGHT */}
    {msg.role === 'user' && (
      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
        <User className="w-4 h-4 text-white" />
      </div>
    )}
  </div>
));

const ChatBox = () => {
  const [input, setInput] = useState('');

  // Select only what's needed — avoids full re-render on unrelated state changes
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-3xl h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-indigo-600 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-base leading-tight">NexusAI</p>
              <p className="text-xs text-indigo-200 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full inline-block transition-colors duration-300 ${status === 'loading' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                {status === 'loading' ? 'Typing...' : 'Online'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-indigo-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear chat
          </button>
        </div>

        {/* Error Banner — stays visible until user dismisses */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border-b border-red-200 px-5 py-3 flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 flex-1 leading-snug">{error}</p>
            <button onClick={handleDismissError} className="text-red-400 hover:text-red-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-5 space-y-4 chat-scroll">

          {/* Empty state */}
          {messages.length === 0 && status !== 'loading' && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 select-none">
              <Bot className="w-12 h-12 text-indigo-200" />
              <p className="text-sm font-medium">Send a message to start chatting</p>
              <p className="text-xs text-gray-300">Powered by GPT-3.5 Turbo</p>
            </div>
          )}

          {/* Each bubble is memoized — only re-renders if its own msg changes */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {/* Loading indicator — AI typing bubble on LEFT */}
          {status === 'loading' && (
            <div className="flex items-end gap-2 justify-start message-animate">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="loader-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white px-4 py-3 flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
              disabled={status === 'loading'}
              className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || status === 'loading'}
              className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChatBox;
