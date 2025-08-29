import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";

export interface Mention {
  id: string;
  name: string;
  userId: string;
}

export interface PointBalloon {
  id: string;
  value: number;
}

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string, mentions: Mention[], points: PointBalloon[]) => void;
  onMentionTrigger?: (query: string, position: number) => void;
  onPointTrigger?: (query: string, position: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  mentions?: Mention[];
  points?: PointBalloon[];
}

export interface RichTextEditorRef {
  focus: () => void;
  insertMention: (mention: Mention) => void;
  insertPoint: (point: PointBalloon) => void;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ value, onChange, onMentionTrigger, onPointTrigger, placeholder, className, disabled, mentions = [], points = [] }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [currentMentions, setCurrentMentions] = useState<Mention[]>(mentions);
    const [currentPoints, setCurrentPoints] = useState<PointBalloon[]>(points);

    useImperativeHandle(ref, () => ({
      focus: () => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      },
      insertMention: (mention: Mention) => {
        insertMentionAtCursor(mention);
      },
      insertPoint: (point: PointBalloon) => {
        insertPointAtCursor(point);
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

    const createPointSpan = (point: PointBalloon): string => {
      return `<span class="point-balloon" data-point-id="${point.id}" data-point-value="${point.value}" contenteditable="false">+${point.value}</span>`;
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

    const extractPointsFromHTML = (html: string): PointBalloon[] => {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const pointElements = temp.querySelectorAll('.point-balloon');
      
      return Array.from(pointElements).map(el => ({
        id: el.getAttribute('data-point-id') || '',
        value: parseInt(el.getAttribute('data-point-value') || '0', 10)
      }));
    };

    const handleInput = () => {
      if (!editorRef.current || isComposing) return;

      const html = editorRef.current.innerHTML;
      const plainText = getPlainText(html);
      const extractedMentions = extractMentionsFromHTML(html);
      const extractedPoints = extractPointsFromHTML(html);
      
      setCurrentMentions(extractedMentions);
      setCurrentPoints(extractedPoints);
      onChange(plainText, extractedMentions, extractedPoints);

      // Check for @ and + triggers
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        
        if (textNode.nodeType === Node.TEXT_NODE) {
          const textContent = textNode.textContent || '';
          const cursorPos = range.startOffset;
          const textUpToCursor = textContent.slice(0, cursorPos);
          
          // Check for @ trigger (mentions)
          const atIndex = textUpToCursor.lastIndexOf('@');
          if (atIndex !== -1 && (atIndex === 0 || textContent[atIndex - 1] === ' ')) {
            const query = textUpToCursor.slice(atIndex + 1);
            if (!query.includes(' ')) {
              onMentionTrigger?.(query.toLowerCase(), atIndex);
              return;
            }
          }
          
          // Check for + trigger (points)
          const plusIndex = textUpToCursor.lastIndexOf('+');
          if (plusIndex !== -1 && (plusIndex === 0 || textContent[plusIndex - 1] === ' ')) {
            const query = textUpToCursor.slice(plusIndex + 1);
            if (!query.includes(' ')) {
              onPointTrigger?.(query, plusIndex);
              return;
            }
          }
        }
      }
      
      onMentionTrigger?.('', -1);
      onPointTrigger?.('', -1);
    };

    const insertMentionAtCursor = (mention: Mention) => {
      insertBalloonAtCursor('@', mention.name, 'mention-balloon', {
        'data-mention-id': mention.id,
        'data-mention-user-id': mention.userId
      });
    };

    const insertPointAtCursor = (point: PointBalloon) => {
      insertBalloonAtCursor('+', `+${point.value}`, 'point-balloon', {
        'data-point-id': point.id,
        'data-point-value': point.value.toString()
      });
    };

    const insertBalloonAtCursor = (trigger: string, displayText: string, className: string, attributes: Record<string, string>) => {
      if (!editorRef.current) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        // If no selection, append to the end
        insertBalloonAtEnd(displayText, className, attributes);
        return;
      }

      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      
      if (textNode.nodeType === Node.TEXT_NODE) {
        const textContent = textNode.textContent || '';
        const cursorPos = range.startOffset;
        const textUpToCursor = textContent.slice(0, cursorPos);
        const triggerIndex = textUpToCursor.lastIndexOf(trigger);
        
        if (triggerIndex !== -1) {
          // Remove the trigger and query text
          const beforeTrigger = textContent.slice(0, triggerIndex);
          const afterCursor = textContent.slice(cursorPos);
          
          // Create new text node with the text before trigger
          if (beforeTrigger) {
            textNode.textContent = beforeTrigger;
          } else {
            textNode.parentNode?.removeChild(textNode);
          }
          
          // Create balloon span
          const balloonSpan = document.createElement('span');
          balloonSpan.className = className;
          balloonSpan.setAttribute('contenteditable', 'false');
          balloonSpan.textContent = displayText;
          
          // Set custom attributes
          Object.entries(attributes).forEach(([key, value]) => {
            balloonSpan.setAttribute(key, value);
          });
          
          // Insert balloon span
          const parentNode = textNode.parentNode || editorRef.current;
          if (beforeTrigger) {
            parentNode.insertBefore(balloonSpan, textNode.nextSibling);
          } else {
            parentNode.appendChild(balloonSpan);
          }
          
          // Add space after balloon
          const spaceNode = document.createTextNode(' ');
          parentNode.insertBefore(spaceNode, balloonSpan.nextSibling);
          
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
        } else {
          // No trigger found, insert at cursor position
          insertBalloonDirectlyAtCursor(displayText, className, attributes);
        }
      } else {
        // Not in text node, insert at cursor
        insertBalloonDirectlyAtCursor(displayText, className, attributes);
      }
    };

    const insertBalloonDirectlyAtCursor = (displayText: string, className: string, attributes: Record<string, string>) => {
      if (!editorRef.current) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        insertBalloonAtEnd(displayText, className, attributes);
        return;
      }

      const range = selection.getRangeAt(0);
      
      // Create balloon span
      const balloonSpan = document.createElement('span');
      balloonSpan.className = className;
      balloonSpan.setAttribute('contenteditable', 'false');
      balloonSpan.textContent = displayText;
      
      // Set custom attributes
      Object.entries(attributes).forEach(([key, value]) => {
        balloonSpan.setAttribute(key, value);
      });
      
      // Insert balloon at cursor
      range.deleteContents();
      range.insertNode(balloonSpan);
      
      // Add space after balloon
      const spaceNode = document.createTextNode(' ');
      range.setStartAfter(balloonSpan);
      range.insertNode(spaceNode);
      
      // Set cursor after the space
      range.setStartAfter(spaceNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Trigger input event to update state
      setTimeout(() => handleInput(), 0);
    };

    const insertBalloonAtEnd = (displayText: string, className: string, attributes: Record<string, string>) => {
      if (!editorRef.current) return;

      // Create balloon span
      const balloonSpan = document.createElement('span');
      balloonSpan.className = className;
      balloonSpan.setAttribute('contenteditable', 'false');
      balloonSpan.textContent = displayText;
      
      // Set custom attributes
      Object.entries(attributes).forEach(([key, value]) => {
        balloonSpan.setAttribute(key, value);
      });
      
      // Append to editor
      editorRef.current.appendChild(balloonSpan);
      
      // Add space after balloon
      const spaceNode = document.createTextNode(' ');
      editorRef.current.appendChild(spaceNode);
      
      // Set cursor after the space
      const range = document.createRange();
      const selection = window.getSelection();
      range.setStartAfter(spaceNode);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Trigger input event to update state
      setTimeout(() => handleInput(), 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Handle backspace on mention and point balloons
      if (e.key === 'Backspace') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const startContainer = range.startContainer;
          
          // If cursor is right after a balloon, delete the entire balloon
          if (startContainer.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
            const prevSibling = startContainer.previousSibling;
            if (prevSibling && prevSibling.nodeType === Node.ELEMENT_NODE) {
              const element = prevSibling as Element;
              if (element.classList.contains('mention-balloon') || element.classList.contains('point-balloon')) {
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

            .point-balloon {
              background: hsl(142 76% 36%);
              color: hsl(355 7% 97%);
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 0.875rem;
              font-weight: 600;
              display: inline-block;
              margin: 0 2px;
              cursor: default;
              user-select: none;
            }
            
            .point-balloon:hover {
              background: hsl(142 76% 30%);
            }
          `
        }} />
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";