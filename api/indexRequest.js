import { getServerUrl } from '../utils/function.js';
import { requestJson } from '../utils/request.js';

export const getPosts = (cursor, limit) => {
    const query = new URLSearchParams();
    if (cursor != null) query.append('cursor', cursor);
    query.append('limit', limit);

    const result = requestJson(
        `${getServerUrl()}/posts?${query.toString()}`,
        { credentials: 'include' },
    );
    return result;
};

export const searchPosts = (keyword, offset = 0, limit = 5, sort = 'recent') => {
    const query = new URLSearchParams({
        keyword,
        offset,
        limit,
        sort,
    });
    const result = requestJson(
        `${getServerUrl()}/v1/posts/search?${query.toString()}`,
        {
            credentials: 'include',
        },
    );
    return result;
};
