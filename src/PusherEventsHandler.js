import { useRef, useEffect } from 'react';
import Pusher from 'pusher-js';
import dotenv from 'dotenv';

dotenv.config();


const PusherEventsHandler = ({setMessages}) => {
  useEffect(() => {
    const pusher = new Pusher(process.env.PUSHER_APP_ID, {
      appId: process.env.PUSHER_APP_ID,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
    });
    const channel = pusher.subscribe(process.env.PUSHER_CHANNEL);

    // pusherRef.current = pusher;
    // channelRef.current = channel;

    // Listen for events
    channel.bind("zoe-chat-status-test", (data) => {
      const { action, output, name, chunk_index } = data;
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
            return [...prevMessages, { text: output, sender: "bot", chunk_index }];
          }
        });
      }

      if (action === "tool_start") {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: `Calling tool: ${data.name}`, sender: "system", toolName: data.name },
        ]);
      }

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

      if (action === "router_start") {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: `Routing query`, sender: "system" },
        ]);
      }

      if (action === "router_end") {
        setMessages((prevMessages) => {
          const routerStartIndex = prevMessages.findIndex(
            (msg) => msg.sender === "system" && msg.text === "Routing query"
          );
          if (routerStartIndex !== -1) {
            return [
              ...prevMessages.slice(0, routerStartIndex),
              { text: `Agent selected: ${output}`, sender: "system" },
              ...prevMessages.slice(routerStartIndex + 1),
            ];
          } else {
            return [...prevMessages, { text: `Agent selected: ${output}`, sender: "system" }];
          }
        });
      }

      if (action === "agent_finish") {
        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          if (lastMessage && lastMessage.sender === "bot") {
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

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [setMessages]);

  return null;
};

export default PusherEventsHandler;