import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Pusher from "pusher-js";
import "./ChatInterface.css";

const ChatInterface = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const pusherRef = useRef(null);
    const channelRef = useRef(null);
    const chatContainerRef = useRef(null);


    useEffect(() => {
        // Initialize Pusher client
        const pusher = new Pusher("f6c670f4a57002cf5390", {
            appId: "1794274",
            secret: "87e3fe68cde83b383a54",
            cluster: "us2",
        });
        const channel = pusher.subscribe("omnisearch");

        // Listen for 'llm_token' events
        channel.bind("zoe-chat-status-test", (data) => {
            const { action, output, chunk_index } = data;
            if (action === "llm_token") {
                setMessages((prevMessages) => {
                    const lastMessage = prevMessages[prevMessages.length - 1];
                    if (lastMessage && lastMessage.sender === "bot") {
                        // Append the new token to the existing bot message
                        return [
                            ...prevMessages.slice(0, -1),
                            {
                                ...lastMessage,
                                text: lastMessage.text + output,
                                chunk_index,
                            },
                        ];
                    } else {
                        // Create a new bot message
                        return [
                            ...prevMessages,
                            { text: output, sender: "bot", chunk_index },
                        ];
                    }
                });
            }
        });

        // Listen for 'tool_start' events
        channel.bind("zoe-chat-status-test", (data) => {
            const { action, name } = data;
            if (action === "tool_start") {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { text: `Calling tool: ${name}`, sender: "system", toolName: name },
                ]);
            }
        });

        // Listen for 'tool_end' events
        channel.bind("zoe-chat-status-test", (data) => {
            const { action, output, name } = data;
            if (action === "tool_end") {
                setMessages((prevMessages) => {
                    const toolStartIndex = prevMessages.findIndex(
                        (msg) => msg.sender === "system" && msg.toolName === name
                    );
                    if (toolStartIndex !== -1) {
                        // Replace the tool start message with the tool output
                        return [
                            ...prevMessages.slice(0, toolStartIndex),
                            { text: `Tool output for ${name}:`, sender: "system", output },
                            ...prevMessages.slice(toolStartIndex + 1),
                        ];
                    } else {
                        // If tool start message is not found, append the tool output
                        return [...prevMessages, { text: `Tool output for ${name}:`, sender: "system", output }];
                    }
                });
            }
        });

        // Listen for 'router_start' events
        channel.bind("zoe-chat-status-test", (data) => {
            const { action } = data;
            if (action === "router_start") {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { text: `Routing query`, sender: "system" },
                ]);
            }
        });

        // Listen for 'router_end' events
        channel.bind("zoe-chat-status-test", (data) => {
            const { action, output } = data;
            if (action === "router_end") {
                setMessages((prevMessages) => {
                    const routerStartIndex = prevMessages.findIndex(
                        (msg) => msg.sender === "system" && msg.text === "Routing query"
                    );
                    if (routerStartIndex !== -1) {
                        // Replace the "Routing query" message with the output
                        return [
                            ...prevMessages.slice(0, routerStartIndex),
                            { text: `Agent selected: ${output}`, sender: "system" },
                            ...prevMessages.slice(routerStartIndex + 1),
                        ];
                    } else {
                        // If "Routing query" message is not found, append the output
                        return [...prevMessages, { text: `Agent selected: ${output}`, sender: "system" }];
                    }
                });
            }
        });

        // Listen for 'agent_finish' events
        channel.bind("zoe-chat-status-test", (data) => {
            const { action } = data;
            if (action === "agent_finish") {
                setMessages((prevMessages) => {
                    const lastMessage = prevMessages[prevMessages.length - 1];
                    if (lastMessage && lastMessage.sender === "bot") {
                        // Mark the last bot message as final
                        return [
                            ...prevMessages.slice(0, -1),
                            {
                                ...lastMessage,
                                final: true,
                            },
                        ];
                    }
                    return prevMessages;
                });
            }
        });

        pusherRef.current = pusher;
        channelRef.current = channel;

        // Clean up the Pusher client and channel when the component unmounts
        return () => {
            channel.unbind_all();
            channel.unsubscribe();
            pusher.disconnect();
        };
    }, []);

    useEffect(() => {
        // Scroll to the bottom of the chat container when messages change
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async () => {
        try {
            setMessages([...messages, { text: input, sender: "user" }]);
            setInput("");
            setLoading(true);
            await axios.post("http://localhost:8001/chat", { input });
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-interface">
            <div className="chat-container" ref={chatContainerRef}>
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.sender}`}>
                        {message.text}
                        {message.sender === "system" && message.output && (
                            <div className="tool-output">{message.output}</div>
                        )}
                    </div>
                ))}
            </div>
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
                    {loading ? "Sending..." : "Send"}
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;