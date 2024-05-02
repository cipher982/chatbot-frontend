import React from 'react';
import './MessageList.css';

const MessageList = ({ messages }) => {
  return (
    <div className="chat-container">
      {messages.map((message, index) => (
        <div key={index} className={`message ${message.sender}`}>
          {message.text}
          {message.sender === 'system' && message.output && (
            <div className="tool-output">{message.output}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MessageList;