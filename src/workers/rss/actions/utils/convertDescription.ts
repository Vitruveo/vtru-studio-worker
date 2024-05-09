import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';

const isDraftJSContent = (content: string): boolean => {
    try {
        const parsed = JSON.parse(content);

        return Object.prototype.hasOwnProperty.call(parsed, 'blocks');
    } catch (error) {
        return false;
    }
};

export const convertDescription = (description: string) => {
    try {
        const isDraftJS = isDraftJSContent(description);

        if (isDraftJS) {
            const rawContent = JSON.parse(description);
            const content = convertFromRaw(rawContent);
            const editorState = EditorState.createWithContent(content);

            return draftToHtml(convertToRaw(editorState.getCurrentContent()));
        }

        return description;
    } catch (error) {
        return description;
    }
};
