import React, { useState, useEffect } from 'react';
import MessageList from './MessageList';
import InputContainer from './InputContainer';
import PusherEventsHandler from './PusherEventsHandler';
import ResponseHandler from './ResponseHandler';
import apiUtils from './utils/api-utils';
import './ChatInterface.css';

const ChatInterface = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [usePusherEvents, setUsePusherEvents] = useState(false);
    const [response, setResponse] = useState(null);


    useEffect(() => {
        if (usePusherEvents) {
            PusherEventsHandler(setMessages);
        }
    }, [usePusherEvents]);


    const sendMessage = async () => {
        console.log('SendMessage called');
        try {
            setLoading(true);
            const response = await apiUtils.sendMessage(input);
            setMessages([...messages, { text: input, sender: 'user' }]);
            setInput('');
            if (!usePusherEvents) {
                ResponseHandler(response, setMessages);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-interface">
            <MessageList messages={messages} />
            <InputContainer
                input={input}
                setInput={setInput}
                sendMessage={sendMessage}
                loading={loading}
            />
            {usePusherEvents && <PusherEventsHandler setMessages={setMessages} />}
        </div>
    );
};

export default ChatInterface;