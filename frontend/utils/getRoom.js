import axios from 'axios';
import BASE_URL from './baseUrl';

export const getRoom = async (id) => {
    const { data } = await axios.get(`${BASE_URL}/api/rooms/${encodeURIComponent(id.trim().toUpperCase())}`, { timeout: 15000 });
    return data;
};
