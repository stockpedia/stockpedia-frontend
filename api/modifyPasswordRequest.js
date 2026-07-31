import { getServerUrl } from '../utils/function.js';
import { requestJson } from '../utils/request.js';

export const changePassword = async (id, password, passwordCheck) => {
    const result = requestJson(`${getServerUrl()}/users/${id}/password`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            password,
            passwordCheck
        }),
    });
    return result;
};
