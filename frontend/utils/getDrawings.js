import axios from 'axios';
import BASE_URL from './baseUrl';

export const getDrawings = async (roomId) => {
    const { data } = await axios.get(`${BASE_URL}/api/rooms/${encodeURIComponent(roomId)}/drawings`, { timeout: 15000 });
    return data;
};
