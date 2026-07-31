import CommentItem from '../component/comment/comment.js';
import Dialog from '../component/dialog/dialog.js';
import Header from '../component/header/header.js';
import {
    authCheck,
    getServerUrl,
    prependChild,
    padTo2Digits,
    resolveImageUrl,
} from '../utils/function.js';
import {
    getPost,
    deletePost,
    writeComment,
    getComments,
    likePost,
    unlikePost,
} from '../api/boardRequest.js';

const DEFAULT_PROFILE_IMAGE = '../public/image/profile/default.jpg';
const MAX_COMMENT_LENGTH = 1000;
const HTTP_NOT_AUTHORIZED = 401;
const HTTP_OK = 200;

const formatCount = value => {
    const count = Number(value);
    if (!Number.isFinite(count)) return value ?? '';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toLocaleString();
};

const setLikeButtonState = (button, isLiked) => {
    button.classList.toggle('is-active', isLiked);
    button.setAttribute('aria-pressed', isLiked ? 'true' : 'false');
};

const getQueryString = name => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
};

const getBoardDetail = async postId => {
    const { ok, data } = await getPost(postId);
    if (!ok) return new Error('게시글 정보를 가져오는데 실패하였습니다.');
    return data;
};

const setBoardDetail = data => {
    const titleElement = document.querySelector('.title');
    const createdAtElement = document.querySelector('.createdAt');
    const imgElement = document.querySelector('.img');
    const nicknameElement = document.querySelector('.nickname');

    titleElement.textContent = data.title;
    const date = new Date(data.createdAt);
    const formattedDate = `${date.getFullYear()}-${padTo2Digits(date.getMonth() + 1)}-${padTo2Digits(date.getDate())} ${padTo2Digits(date.getHours())}:${padTo2Digits(date.getMinutes())}:${padTo2Digits(date.getSeconds())}`;
    createdAtElement.textContent = formattedDate;

    imgElement.src = resolveImageUrl(
        data.author ? data.author.profileImageUrl : null,
        DEFAULT_PROFILE_IMAGE,
    );

    nicknameElement.textContent = data.author ? data.author.nickname : '';

    const contentImgElement = document.querySelector('.contentImg');
    if (data.imageUrls && data.imageUrls.length > 0) {
        data.imageUrls.forEach(url => {
            const img = document.createElement('img');
            img.src = resolveImageUrl(url);
            contentImgElement.appendChild(img);
        });
    }

    const contentElement = document.querySelector('.content');
    contentElement.textContent = data.content;

    const likeButtonElement = document.querySelector('.likeButton');
    const likeCountElement = likeButtonElement.querySelector('h3');
    let isLiked = Boolean(data.isLiked);
    let isLikeLoading = false;

    likeCountElement.textContent = formatCount(data.likeCount);
    setLikeButtonState(likeButtonElement, isLiked);

    likeButtonElement.addEventListener('click', async () => {
        if (isLikeLoading) return;
        isLikeLoading = true;

        try {
            if (!isLiked) {
                const { ok, status, code, data: likeData } = await likePost(
                    data.postId,
                );
                if (ok) {
                    isLiked = true;
                    setLikeButtonState(likeButtonElement, isLiked);
                    if (likeData && likeData.likeCount !== undefined) {
                        likeCountElement.textContent = formatCount(
                            likeData.likeCount,
                        );
                    }
                } else if (status === 409 && code === 'POST_ALREADY_LIKED') {
                    isLiked = true;
                    setLikeButtonState(likeButtonElement, isLiked);
                } else if (status === HTTP_NOT_AUTHORIZED) {
                    window.location.href = '/html/login.html';
                } else {
                    Dialog('좋아요 실패', '좋아요 처리에 실패하였습니다.');
                }
            } else {
                const { ok, status, code, data: likeData } = await unlikePost(
                    data.postId,
                );
                if (ok) {
                    isLiked = false;
                    setLikeButtonState(likeButtonElement, isLiked);
                    if (likeData && likeData.likeCount !== undefined) {
                        likeCountElement.textContent = formatCount(
                            likeData.likeCount,
                        );
                    }
                } else if (status === 409 && code === 'POST_ALREADY_UNLIKED') {
                    isLiked = false;
                    setLikeButtonState(likeButtonElement, isLiked);
                } else if (status === HTTP_NOT_AUTHORIZED) {
                    window.location.href = '/html/login.html';
                } else {
                    Dialog('좋아요 취소 실패', '좋아요 취소에 실패하였습니다.');
                }
            }
        } finally {
            isLikeLoading = false;
        }
    });

    const viewCountElement = document.querySelector('.viewCount h3');
    viewCountElement.textContent = formatCount(data.viewCount);

    const commentCountElement = document.querySelector('.commentCount h3');
    commentCountElement.textContent = data.commentCount.toLocaleString();
};

const setBoardModify = data => {
    if (data.isMine) {
        const modifyElement = document.querySelector('.hidden');
        modifyElement.classList.remove('hidden');

        const deleteBtnElement = document.querySelector('#deleteBtn');
        const postId = getQueryString('id');
        deleteBtnElement.addEventListener('click', () => {
            Dialog(
                '게시글을 삭제하시겠습니까?',
                '삭제한 내용은 복구 할 수 없습니다.',
                async () => {
                    const { ok } = await deletePost(postId);
                    if (ok) {
                        window.location.href = '/';
                    } else {
                        Dialog('삭제 실패', '게시글 삭제에 실패하였습니다.');
                    }
                },
            );
        });

        const modifyBtnElement = document.querySelector('#modifyBtn');
        modifyBtnElement.addEventListener('click', () => {
            // 수정 페이지에서 재조회 없이 폼을 채우도록 데이터를 넘김 (조회수 증가 방지)
            sessionStorage.setItem('modifyData', JSON.stringify(data));
            window.location.href = `/html/board-modify.html?postId=${data.postId}`;
        });
    }
};

let commentCursor = null;
let isCommentLoading = false;

const getBoardComment = async (id, cursor = null) => {
    const { ok, status, data } = await getComments(id, cursor);
    if (!ok || status !== HTTP_OK || !data) {
        return { posts: [], nextCursor: null, hasNext: false };
    }
    return {
        posts: Array.isArray(data.posts) ? data.posts : [],
        nextCursor: data.nextCursor,
        hasNext: data.hasNext,
    };
};

const setBoardComment = posts => {
    const commentListElement = document.querySelector('.commentList');
    const postId = getQueryString('id');
    if (commentListElement && Array.isArray(posts)) {
        posts.forEach(comment => {
            const item = CommentItem(comment, postId);
            commentListElement.appendChild(item);
        });
    }
};

const getMoreButton = () => document.querySelector('#commentMoreBtn');

const updateMoreButton = hasNext => {
    let btn = getMoreButton();
    if (hasNext) {
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'commentMoreBtn';
            btn.className = 'commentMoreBtn';
            btn.textContent = '댓글 더보기';
            btn.addEventListener('click', loadMoreComments);
            const commentListElement = document.querySelector('.commentList');
            commentListElement.insertAdjacentElement('afterend', btn);
        }
        btn.style.display = 'block';
    } else if (btn) {
        btn.remove();
    }
};

const loadMoreComments = async () => {
    if (isCommentLoading || commentCursor === null) return;
    isCommentLoading = true;
    try {
        const pageId = getQueryString('id');
        const { posts, nextCursor, hasNext } = await getBoardComment(
            pageId,
            commentCursor,
        );
        setBoardComment(posts);
        commentCursor = nextCursor;
        updateMoreButton(hasNext);
    } finally {
        isCommentLoading = false;
    }
};

const loadFirstComments = async () => {
    const pageId = getQueryString('id');
    const commentListElement = document.querySelector('.commentList');
    commentListElement.innerHTML = '';
    const { posts, nextCursor, hasNext } = await getBoardComment(pageId, null);
    setBoardComment(posts);
    commentCursor = nextCursor;
    updateMoreButton(hasNext);
};

const addComment = async () => {
    const comment = document.querySelector('textarea').value;
    const pageId = getQueryString('id');

    const { ok } = await writeComment(pageId, comment);

    if (ok) {
        window.location.reload();
    } else {
        Dialog('댓글 등록 실패', '댓글 등록에 실패하였습니다.');
    }
};

const inputComment = async () => {
    const textareaElement = document.querySelector(
        '.commentInputWrap textarea',
    );
    const commentBtnElement = document.querySelector('.commentInputBtn');

    if (textareaElement.value.length > MAX_COMMENT_LENGTH) {
        textareaElement.value = textareaElement.value.substring(
            0,
            MAX_COMMENT_LENGTH,
        );
    }
    if (textareaElement.value === '') {
        commentBtnElement.disabled = true;
        commentBtnElement.style.backgroundColor = '#ACA0EB';
    } else {
        commentBtnElement.disabled = false;
        commentBtnElement.style.backgroundColor = '#7F6AEE';
    }
};

const init = async () => {
    try {
        const response = await authCheck();
        const myInfoResult = await response.json();
        if (response.status !== HTTP_OK) {
            throw new Error('사용자 정보를 불러오는데 실패하였습니다.');
        }

        const myInfo = myInfoResult.data;
        const commentBtnElement = document.querySelector('.commentInputBtn');
        const textareaElement = document.querySelector(
            '.commentInputWrap textarea',
        );
        textareaElement.addEventListener('input', inputComment);
        commentBtnElement.addEventListener('click', addComment);
        commentBtnElement.disabled = true;

        const profileImage = resolveImageUrl(
            myInfo.profileImageUrl,
            DEFAULT_PROFILE_IMAGE,
        );

        prependChild(document.body, Header('커뮤니티', 2, profileImage));

        const pageId = getQueryString('id');
        const pageData = await getBoardDetail(pageId);

        setBoardModify(pageData);
        setBoardDetail(pageData);

        loadFirstComments();
    } catch (error) {
        console.error(error);
    }
};

init();