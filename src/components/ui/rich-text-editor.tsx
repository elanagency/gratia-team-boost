import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";

export interface Mention {
  id: string;
  name: string;
  userId: string;
}

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string, mentions: Mention[]) => void;
  onMentionTrigger?: (query: string, position: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  mentions?: Mention[];
}

export interface RichTextEditorRef {
  focus: () => void;
  insertMention: (mention: Mention) => void;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ value, onChange, onMentionTrigger, placeholder, className, disabled, mentions = [] }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [currentMentions, setCurrentMentions] = useState<Mention[]>(mentions);

    useImperativeHandle(ref, () => ({
      focus: () => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      },
      insertMention: (mention: Mention) => {
        insertMentionAtCursor(mention);
      }
    }));

    const getPlainText = (html: string): string => {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      return temp.textContent || temp.innerText || '';
    };

    const createMentionSpan = (mention: Mention): string => {
      return `<span class="mention-balloon" data-mention-id="${mention.id}" data-mention-user-id="${mention.userId}" contenteditable="false">${mention.name}</span>`;
    };

    const extractMentionsFromHTML = (html: string): Mention[] => {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const mentionElements = temp.querySelectorAll('.mention-balloon');
      
      return Array.from(mentionElements).map(el => ({
        id: el.getAttribute('data-mention-id') || '',
        name: el.textContent || '',
        userId: el.getAttribute('data-mention-user-id') || ''
      }));
    };

    const handleInput = () => {
      if (!editorRef.current || isComposing) return;

      const html = editorRef.current.innerHTML;
      const plainText = getPlainText(html);
      const extractedMentions = extractMentionsFromHTML(html);
      
      setCurrentMentions(extractedMentions);
      onChange(plainText, extractedMentions);

      // Check for @ trigger
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        
        if (textNode.nodeType === Node.TEXT_NODE) {
          const textContent = textNode.textContent || '';
          const cursorPos = range.startOffset;
          const textUpToCursor = textContent.slice(0, cursorPos);
          const atIndex = textUpToCursor.lastIndexOf('@');
          
          if (atIndex !== -1 && (atIndex === 0 || textContent[atIndex - 1] === ' ')) {
            const query = textUpToCursor.slice(atIndex + 1);
            if (!query.includes(' ')) {
              onMentionTrigger?.(query.toLowerCase(), atIndex);
              return;
            }
          }
        }
      }
      
      onMentionTrigger?.('', -1);
    };

    const insertMentionAtCursor = (mention: Mention) => {
      if (!editorRef.current) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      
      if (textNode.nodeType === Node.TEXT_NODE) {
        const textContent = textNode.textContent || '';
        const cursorPos = range.startOffset;
        const textUpToCursor = textContent.slice(0, cursorPos);
        const atIndex = textUpToCursor.lastIndexOf('@');
        
        if (atIndex !== -1) {
          // Remove the @ and query text
          const beforeAt = textContent.slice(0, atIndex);
          const afterCursor = textContent.slice(cursorPos);
          
          // Create new text node with the text before @
          if (beforeAt) {
            textNode.textContent = beforeAt;
          } else {
            textNode.parentNode?.removeChild(textNode);
          }
          
          // Create mention span
          const mentionSpan = document.createElement('span');
          mentionSpan.className = 'mention-balloon';
          mentionSpan.setAttribute('data-mention-id', mention.id);
          mentionSpan.setAttribute('data-mention-user-id', mention.userId);
          mentionSpan.setAttribute('contenteditable', 'false');
          mentionSpan.textContent = mention.name;
          
          // Insert mention span
          const parentNode = textNode.parentNode || editorRef.current;
          if (beforeAt) {
            parentNode.insertBefore(mentionSpan, textNode.nextSibling);
          } else {
            parentNode.appendChild(mentionSpan);
          }
          
          // Add space after mention
          const spaceNode = document.createTextNode(' ');
          parentNode.insertBefore(spaceNode, mentionSpan.nextSibling);
          
          // Add remaining text if any
          if (afterCursor) {
            const remainingTextNode = document.createTextNode(afterCursor);
            parentNode.insertBefore(remainingTextNode, spaceNode.nextSibling);
          }
          
          // Set cursor after the space
          const newRange = document.createRange();
          newRange.setStartAfter(spaceNode);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          
          // Trigger input event to update state
          setTimeout(() => handleInput(), 0);
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Handle backspace on mention balloons
      if (e.key === 'Backspace') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const startContainer = range.startContainer;
          
          // If cursor is right after a mention balloon, delete the entire balloon
          if (startContainer.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
            const prevSibling = startContainer.previousSibling;
            if (prevSibling && prevSibling.nodeType === Node.ELEMENT_NODE) {
              const element = prevSibling as Element;
              if (element.classList.contains('mention-balloon')) {
                e.preventDefault();
                element.remove();
                setTimeout(() => handleInput(), 0);
                return;
              }
            }
          }
        }
      }
    };

    // Update editor content when value changes externally
    useEffect(() => {
      if (editorRef.current) {
        const currentText = getPlainText(editorRef.current.innerHTML);
        if (currentText !== value && !isComposing) {
          editorRef.current.innerHTML = value;
        }
      }
    }, [value, isComposing]);

    return (
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          className={cn(
            "w-full min-h-[100px] p-3 bg-transparent border-0 resize-none focus:outline-none text-sm",
            "placeholder:text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          style={{
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap'
          }}
          suppressContentEditableWarning={true}
        />
        
        {/* Placeholder */}
        {!value && placeholder && (
          <div className="absolute top-3 left-3 text-sm text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
        
        <style dangerouslySetInnerHTML={{
          __html: `
            .mention-balloon {
              background: hsl(var(--accent));
              color: hsl(var(--accent-foreground));
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 0.875rem;
              font-weight: 500;
              display: inline-block;
              margin: 0 2px;
              cursor: default;
              user-select: none;
            }
            
            .mention-balloon:hover {
              background: hsl(var(--accent) / 0.8);
            }
          `
        }} />
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";