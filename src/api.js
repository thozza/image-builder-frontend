import axios from 'axios';
import {
    IMAGE_BUILDER_API,
} from './constants';

const postHeaders = { headers: { 'Content-Type': 'application/json' }};

async function composeImage(body) {
    let path = '/compose';
    const request = await axios.post(IMAGE_BUILDER_API.concat(path), body, postHeaders);
    return request.data;
}

async function getComposeStatus(id) {
    let path = '/composes/' + id;
    const request = await axios.get(IMAGE_BUILDER_API.concat(path));
    return request.data;
}

async function getVersion() {
    let path = '/version';
    const request = await axios.get(IMAGE_BUILDER_API.concat(path));
    return request.data;
}

export default {
    composeImage,
    getComposeStatus,
    getVersion,
};
