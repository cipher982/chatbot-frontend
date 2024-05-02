import React from 'react';
import './InputContainer.css';

const InputContainer = ({ input, setInput, sendMessage, loading }) => {
  return (
    <div className="input-container">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.keyCode === 13) {
            sendMessage();
          }
        }}
        placeholder="Type your message..."
      />
      <button onClick={sendMessage} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
};

export default InputContainer;