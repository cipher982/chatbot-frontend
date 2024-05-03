import axios from "axios";



const apiUtils = {
  sendMessage: async (input) => {
    try {
      const response = await axios.post(process.env.FASTAPI_ADDR, { input });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
};

export default apiUtils