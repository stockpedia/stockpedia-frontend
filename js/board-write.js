import Dialog from '../component/dialog/dialog.js';
import Header from '../component/header/header.js';
import {
    authCheck,
    getQueryString,
    getServerUrl,
    prependChild,
    resolveImageUrl,
} from '../utils/function.js';
import {
    createPost,
    fileUpload,
    updatePost,
    getBoardItem,
} from '../api/board-writeRequest.js';

const HTTP_OK = 200;
const HTTP_CREATED = 201;

const MAX_TITLE_LENGTH = 26;
const MAX_CONTENT_LENGTH = 1500;

const DEFAULT_PROFILE_IMAGE = '../public/image/profile/default.jpg';

const submitButton = document.querySelector('#submit');
const titleInput = document.querySelector('#title');
const contentInput = document.querySelector('#content');
const imageInput = document.querySelector('#image');
const imagePreviewText = document.getElementById('imagePreviewText');
const contentHelpElement = document.querySelector(
    '.inputBox p[name="content"]',
);

const boardWrite = {
    title: '',
    content: '',
};

let uploadFiles = [];

let isModifyMode = false;
let modifyData = {};

const observeSignupData = () => {
    const { title, content } = boardWrite;
    if (!title || !content || title === '' || content === '') {
        submitButton.disabled = true;
        submitButton.style.backgroundColor = '#ACA0EB';
    } else {
        submitButton.disabled = false;
        submitButton.style.backgroundColor = '#7F6AEE';
    }
};

const getBoardData = () => {
    return {
        title: boardWrite.title,
        content: boardWrite.content,
        uploadFiles: uploadFiles,
    };
};

const addBoard = async () => {
    const boardData = getBoardData();

    if (!boardData) return Dialog('게시글', '게시글을 입력해주세요.');

    if (boardData.title.length > MAX_TITLE_LENGTH)
        return Dialog('게시글', '제목은 26자 이하로 입력해주세요.');

    if (!isModifyMode) {
        const { ok, status, data } = await createPost(boardData);
        if (!ok) throw new Error('서버 응답 오류');

        if (status === HTTP_CREATED) {
            window.location.href = `/html/board.html?id=${data.id}`;
        } else {
            contentHelpElement.textContent = '제목, 내용을 모두 작성해주세요.';
        }
    } else {
        const postId = getQueryString('postId');
        const { ok, status } = await updatePost(postId, boardData);
        if (!ok) throw new Error('서버 응답 오류');

        if (status === HTTP_OK) {
            window.location.href = `/html/board.html?id=${postId}`;
        } else {
            Dialog('게시글', '게시글 수정 실패');
        }
    }
};

const updatePreviewText = () => {
    if (!imagePreviewText) return;
    if (uploadFiles.length === 0) {
        imagePreviewText.style.display = 'none';
        return;
    }
    imagePreviewText.innerHTML =
        `이미지 ${uploadFiles.length}개 첨부됨` +
        `<span class="deleteFile">X</span>`;
    imagePreviewText.style.display = 'block';
};

const changeEventHandler = async (event, uid) => {
    if (uid == 'title') {
        const value = event.target.value;
        const helperElement = contentHelpElement;
        if (!value || value == '') {
            boardWrite[uid] = '';
            helperElement.textContent = '제목을 입력해주세요.';
        } else if (value.length > MAX_TITLE_LENGTH) {
            helperElement.textContent = '제목은 26자 이하로 입력해주세요.';
            titleInput.value = value.substring(0, MAX_TITLE_LENGTH);
            boardWrite[uid] = value.substring(0, MAX_TITLE_LENGTH);
        } else {
            boardWrite[uid] = value;
            helperElement.textContent = '';
        }
    } else if (uid == 'content') {
        const value = event.target.value;
        const helperElement = contentHelpElement;
        if (!value || value == '') {
            boardWrite[uid] = '';
            helperElement.textContent = '내용을 입력해주세요.';
        } else if (value.length > MAX_CONTENT_LENGTH) {
            helperElement.textContent = '내용은 1500자 이하로 입력해주세요.';
            contentInput.value = value.substring(0, MAX_CONTENT_LENGTH);
            boardWrite[uid] = value.substring(0, MAX_CONTENT_LENGTH);
        } else {
            boardWrite[uid] = value;
            helperElement.textContent = '';
        }
    } else if (uid == 'image') {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        for (const file of files) {
            formData.append('file', file);
        }

        try {
            const { ok, data } = await fileUpload(formData);
            if (!ok) throw new Error('서버 응답 오류');

            const uploaded = Array.isArray(data) ? data : [data];
            uploadFiles = uploadFiles.concat(uploaded);
            updatePreviewText();
        } catch (error) {
            console.error('업로드 중 오류 발생:', error);
        }
    } else if (uid === 'imagePreviewText') {
        uploadFiles = [];
        imageInput.value = '';
        imagePreviewText.style.display = 'none';
    }

    observeSignupData();
};

const getBoardModifyData = async postId => {
    const { ok, data } = await getBoardItem(postId);
    if (!ok) throw new Error('서버 응답 오류');
    return data;
};

const checkModifyMode = () => {
    const postId = getQueryString('postId');
    if (!postId) return false;
    return postId;
};

const addEvent = () => {
    submitButton.addEventListener('click', addBoard);
    titleInput.addEventListener('input', event =>
        changeEventHandler(event, 'title'),
    );
    contentInput.addEventListener('input', event =>
        changeEventHandler(event, 'content'),
    );
    imageInput.addEventListener('change', event =>
        changeEventHandler(event, 'image'),
    );
    if (imagePreviewText !== null) {
        imagePreviewText.addEventListener('click', event =>
            changeEventHandler(event, 'imagePreviewText'),
        );
    }
};

const setModifyData = data => {
    titleInput.value = data.title;
    contentInput.value = data.content;

    boardWrite.title = data.title;
    boardWrite.content = data.content;

    observeSignupData();
};

const init = async () => {
    addEvent();

    const dataResponse = await authCheck();
    const data = await dataResponse.json();
    const modifyId = checkModifyMode();

    const profileImage = resolveImageUrl(
        data.data.profileImageUrl,
        DEFAULT_PROFILE_IMAGE,
    );

    prependChild(document.body, Header('커뮤니티', 1, profileImage));

    if (modifyId) {
        isModifyMode = true;

        const stored = sessionStorage.getItem('modifyData');
        if (stored) {
            modifyData = JSON.parse(stored);
            sessionStorage.removeItem('modifyData');
        } else {
            modifyData = await getBoardModifyData(modifyId);
        }

        if (!modifyData.isMine) {
            Dialog('권한 없음', '권한이 없습니다.', () => {
                window.location.href = '/';
            });
        } else {
            setModifyData(modifyData);
        }
    }
};

init();