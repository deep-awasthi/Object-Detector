'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import styles from './LexicalEditor.module.css'

interface LexicalEditorProps {
  initialContent?: string
  onChange?: (html: string, json: unknown) => void
}

export function LexicalEditor({ initialContent = '', onChange }: LexicalEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (editorRef.current && !isReady) {
      editorRef.current.contentEditable = 'true'
      if (initialContent) {
        editorRef.current.innerHTML = initialContent
      } else {
        editorRef.current.innerHTML = '<p><br></p>'
      }
      setIsReady(true)
    }
  }, [initialContent, isReady])

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }, [])

  const handleInput = useCallback(() => {
    if (editorRef.current && onChange) {
      const html = editorRef.current.innerHTML
      const json = { root: { children: [], type: 'root' } }
      onChange(html, json)
    }
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'b': e.preventDefault(); execCommand('bold'); break
        case 'i': e.preventDefault(); execCommand('italic'); break
        case 'u': e.preventDefault(); execCommand('underline'); break
      }
    }
  }, [execCommand])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')

    if (html) {
      const sanitized = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '')
      document.execCommand('insertHTML', false, sanitized)
    } else {
      document.execCommand('insertText', false, text)
    }
    handleInput()
  }, [handleInput])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = () => {
          const img = `<img src="${reader.result}" alt="${file.name}" style="max-width:100%;border-radius:8px;" />`
          execCommand('insertHTML', img)
          handleInput()
        }
        reader.readAsDataURL(file)
      }
    }
  }, [execCommand, handleInput])

  return (
    <div className={styles.editorWrapper}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <button onClick={() => execCommand('formatBlock', 'h1')} className={styles.toolBtn} title="Heading 1">H1</button>
          <button onClick={() => execCommand('formatBlock', 'h2')} className={styles.toolBtn} title="Heading 2">H2</button>
          <button onClick={() => execCommand('formatBlock', 'h3')} className={styles.toolBtn} title="Heading 3">H3</button>
          <button onClick={() => execCommand('formatBlock', 'p')} className={styles.toolBtn} title="Paragraph">P</button>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <button onClick={() => execCommand('bold')} className={styles.toolBtn} title="Bold (Ctrl+B)"><strong>B</strong></button>
          <button onClick={() => execCommand('italic')} className={styles.toolBtn} title="Italic (Ctrl+I)"><em>I</em></button>
          <button onClick={() => execCommand('underline')} className={styles.toolBtn} title="Underline (Ctrl+U)"><u>U</u></button>
          <button onClick={() => execCommand('strikeThrough')} className={styles.toolBtn} title="Strikethrough"><s>S</s></button>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <button onClick={() => execCommand('insertUnorderedList')} className={styles.toolBtn} title="Bullet List">• List</button>
          <button onClick={() => execCommand('insertOrderedList')} className={styles.toolBtn} title="Numbered List">1. List</button>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <button onClick={() => {
            const url = prompt('Enter link URL:')
            if (url) execCommand('createLink', url)
          }} className={styles.toolBtn} title="Link">🔗</button>
          <button onClick={() => {
            const url = prompt('Enter image URL:')
            if (url) execCommand('insertHTML', `<img src="${url}" alt="Image" style="max-width:100%;border-radius:8px;" />`)
          }} className={styles.toolBtn} title="Image">🖼</button>
          <button onClick={() => {
            const code = prompt('Enter inline code:')
            if (code) execCommand('insertHTML', `<code style="background:var(--color-code-bg);padding:2px 6px;border-radius:4px;font-family:monospace;">${code}</code>`)
          }} className={styles.toolBtn} title="Inline Code">&lt;/&gt;</button>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <button onClick={() => execCommand('formatBlock', 'blockquote')} className={styles.toolBtn} title="Quote">❝</button>
          <button onClick={() => execCommand('insertHorizontalRule')} className={styles.toolBtn} title="Horizontal Rule">—</button>
          <button onClick={() => {
            const lang = prompt('Enter language (e.g., javascript, python):')
            if (lang) {
              const code = prompt('Enter code:')
              if (code) execCommand('insertHTML', `<pre style="background:var(--color-code-bg);padding:1rem;border-radius:8px;overflow-x:auto;"><code class="language-${lang}">${code}</code></pre>`)
            }
          }} className={styles.toolBtn} title="Code Block">{ }</button>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <button onClick={() => execCommand('justifyLeft')} className={styles.toolBtn} title="Align Left">⫷</button>
          <button onClick={() => execCommand('justifyCenter')} className={styles.toolBtn} title="Align Center">⫿</button>
          <button onClick={() => execCommand('justifyRight')} className={styles.toolBtn} title="Align Right">⫸</button>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <button onClick={() => execCommand('undo')} className={styles.toolBtn} title="Undo (Ctrl+Z)">↩</button>
          <button onClick={() => execCommand('redo')} className={styles.toolBtn} title="Redo (Ctrl+Y)">↪</button>
        </div>
      </div>

      <div
        ref={editorRef}
        className={styles.content}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        suppressContentEditableWarning
        data-placeholder="Start writing your article..."
      />
    </div>
  )
}
