'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/game';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentUser: string;
}

export default function Chat({ messages, onSendMessage, currentUser }: ChatProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages && messages.length > 0) {
      console.log('Chat received messages:', messages.length);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="chat-container">
      <h3>Game Chat</h3>
      <div className="messages-list">
        {(messages || []).map((msg, idx) => (
          <div key={idx} className={`message ${msg.username === currentUser ? 'own-message' : ''}`}>
            <span className="message-user">{msg.username}:</span>
            <span className="message-text">{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          autoComplete="off"
        />
        <button type="submit">Send</button>
      </form>

      <style jsx>{`
        .chat-container {
          width: 300px;
          height: 400px;
          display: flex;
          flex-direction: column;
          background: #eee8d5;
          border-radius: 8px;
          padding: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h3 {
          margin: 0 0 10px 0;
          font-size: 1rem;
          color: #586e75;
          border-bottom: 1px solid #dcd7c0;
          padding-bottom: 5px;
        }
        .messages-list {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding-right: 5px;
        }
        .message {
          font-size: 0.9rem;
          padding: 4px 8px;
          border-radius: 4px;
          background: #fdf6e3;
          word-break: break-word;
        }
        .own-message {
          background: #e1e9b7;
          align-self: flex-end;
        }
        .message-user {
          font-weight: bold;
          margin-right: 5px;
          color: #268bd2;
        }
        .own-message .message-user {
          color: #859900;
        }
        .message-text {
          color: #657b83;
        }
        .chat-input-form {
          display: flex;
          gap: 5px;
        }
        input {
          flex: 1;
          padding: 5px 8px;
          border: 1px solid #dcd7c0;
          border-radius: 4px;
          font-size: 0.9rem;
          background: #fdf6e3;
        }
        button {
          padding: 5px 12px;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
