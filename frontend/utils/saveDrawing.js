import axios from 'axios';
import BASE_URL from './baseUrl';

// REST persistence does not broadcast; the shared canvas saves through STOMP instead.
export const saveDrawing = async (roomId, operation) => {
    const { data } = await axios.post(`${BASE_URL}/api/rooms/${encodeURIComponent(roomId)}/drawings`, operation, { timeout: 15000 });
    return data;
};
