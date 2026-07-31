import { getServerUrl } from '../utils/function.js';
import { requestJson } from '../utils/request.js';

export const getPost = postId => {
    const result = requestJson(`${getServerUrl()}/posts/${postId}`, {
        credentials: 'include',
    });
    return result;
};

export const deletePost = async postId => {
    const result = await requestJson(`${getServerUrl()}/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    return result;
};

export const writeComment = async (pageId, comment) => {
    const result = await requestJson(`${getServerUrl()}/posts/${pageId}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: comment }),
    });
    return result;
};

export const getComments = async (postId, cursor = null) => {
    const query = new URLSearchParams();
    if (cursor != null) query.append('cursor', cursor);

    const qs = query.toString();
    const url = qs
        ? `${getServerUrl()}/posts/${postId}/comments?${qs}`
        : `${getServerUrl()}/posts/${postId}/comments`;

    const result = await requestJson(url, {
        credentials: 'include',
    });
    return result;
};

export const likePost = async postId => {
    const result = await requestJson(`${getServerUrl()}/posts/${postId}/likes`, {
        method: 'POST',
        credentials: 'include',
    });
    return result;
};

export const unlikePost = async postId => {
    const result = await requestJson(`${getServerUrl()}/posts/${postId}/likes`, {
        method: 'DELETE',
        credentials: 'include',
    });
    return result;
};