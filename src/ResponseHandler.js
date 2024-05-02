const ResponseHandler = (response, setMessages) => {
  try {
    setMessages((prevMessages) => [...prevMessages, { text: response.output, sender: 'bot' }]);
  } catch (error) {
    console.error('Error handling response:', error);
  }
};