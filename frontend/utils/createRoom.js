import axios from 'axios';
import BASE_URL from './baseUrl';

export const createRoom = async (roomName, displayName) => {
    const { data } = await axios.post(`${BASE_URL}/api/rooms`, {
        roomName: roomName.trim(),
        displayName: displayName.trim()
    }, { timeout: 15000 });
    return data;
};
