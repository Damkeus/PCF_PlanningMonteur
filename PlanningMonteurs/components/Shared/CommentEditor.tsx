import * as React from "react";
import { QUICK_COMMENT_TAGS } from "./constants";

interface CommentEditorProps {
    value: string;
    onSave: (value: string) => void;
    onCancel: () => void;
}

/**
 * Inline micro-editor for comments with quick-tag chips.
 */
const CommentEditor: React.FC<CommentEditorProps> = ({ value, onSave, onCancel }) => {
    const [text, setText] = React.useState(value || "");
    const inputRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSave(text.trim());
        } else if (e.key === "Escape") {
            onCancel();
        }
    };

    const handleTagClick = (tag: string) => {
        const newText = text ? `${text} ${tag}` : tag;
        setText(newText);
        inputRef.current?.focus();
    };

    const handleBlur = (e: React.FocusEvent) => {
        // Don't close if clicking on a tag chip
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (relatedTarget?.classList.contains("pm-comment-tag")) return;
        onSave(text.trim());
    };

    return (
        <div className="pm-comment-editor" onMouseDown={e => e.stopPropagation()}>
            <div className="pm-comment-tags">
                {QUICK_COMMENT_TAGS.map((tag) => (
                    <button
                        key={tag}
                        className="pm-comment-tag"
                        onClick={() => handleTagClick(tag)}
                        tabIndex={0}
                        type="button"
                    >
                        {tag}
                    </button>
                ))}
            </div>
            <textarea
                ref={inputRef}
                className="pm-comment-input"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                rows={2}
                placeholder="Ajouter un commentaire..."
            />
            <div className="pm-comment-actions">
                <button className="pm-comment-save" onClick={() => onSave(text.trim())} type="button">
                    ✓
                </button>
                <button className="pm-comment-cancel" onClick={onCancel} type="button">
                    ✕
                </button>
            </div>
        </div>
    );
};

export default CommentEditor;
