import rug from 'random-username-generator'

export const generateRandomUsername = () => {
    return rug.generate();
}

export const apiErrorMessage = (error, fallback) => {
    if (error.response && error.response.data && error.response.data.detail) {
        return error.response.data.detail;
    }
    if (error.response && error.response.status === 404) return 'Room not found.';
    return fallback || 'Cannot reach the server. Check the API URL and try again.';
};