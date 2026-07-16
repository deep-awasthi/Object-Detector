import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { chatApi } from '../api/client'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface Conversation {
  id: string; title: string; model: string; pinned: boolean; updatedAt: string; createdAt: string
}
interface Message {
  id: string; role: 'USER' | 'ASSISTANT' | 'SYSTEM'; content: string; createdAt: string; latencyMs?: number; tokenCount?: number
}

export default function ChatPage() {
  const qc = useQueryClient()
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamBuffer, setStreamBuffer] = useState('')
  const [selectedModel, setSelectedModel] = useState('qwen2.5:latest')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const { data: convData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.listConversations(0, 50).then(r => r.data),
  })

  const { data: messagesData } = useQuery({
    queryKey: ['messages', activeConvId],
    queryFn: () => chatApi.getMessages(activeConvId!).then(r => r.data),
    enabled: !!activeConvId,
  })

  const createConvMutation = useMutation({
    mutationFn: () => chatApi.createConversation('New Conversation', selectedModel).then(r => r.data),
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setActiveConvId(conv.id)
    },
  })

  const deleteConvMutation = useMutation({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setActiveConvId(null)
    },
  })

  const pinMutation = useMutation({
    mutationFn: (id: string) => chatApi.togglePin(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesData, streamBuffer])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || streaming) return
    if (!activeConvId) {
      const conv = await createConvMutation.mutateAsync()
      setActiveConvId(conv.id)
    }

    const convId = activeConvId!
    const message = input.trim()
    setInput('')
    setStreaming(true)
    setStreamBuffer('')

    try {
      abortRef.current = new AbortController()
      const response = await chatApi.streamMessage(convId, message, selectedModel)

      if (!response.ok) throw new Error('Stream failed')

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setStreamBuffer(prev => prev + chunk)
      }

      qc.invalidateQueries({ queryKey: ['messages', convId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Failed to send message')
      }
    } finally {
      setStreaming(false)
      setStreamBuffer('')
      inputRef.current?.focus()
    }
  }, [input, streaming, activeConvId, selectedModel])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const stopGeneration = () => {
    abortRef.current?.abort()
    setStreaming(false)
    setStreamBuffer('')
  }

  const conversations: Conversation[] = convData?.content || []
  const messages: Message[] = messagesData || []

  const filteredConvs = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const pinnedConvs = filteredConvs.filter(c => c.pinned)
  const unpinnedConvs = filteredConvs.filter(c => !c.pinned)

  return (
    <div style={styles.page}>
      {/* Conversation List */}
      <div style={styles.convList}>
        <div style={styles.convHeader}>
          <input
            className="input"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ fontSize: 13 }}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={() => createConvMutation.mutate()}
            style={{ flexShrink: 0, padding: '8px 12px' }}
            title="New chat"
          >
            <PlusIcon />
          </button>
        </div>

        <div style={styles.convItems}>
          {pinnedConvs.length > 0 && (
            <>
              <div style={styles.sectionLabel}>📌 Pinned</div>
              {pinnedConvs.map(c => <ConvItem key={c.id} conv={c} active={c.id === activeConvId} onSelect={setActiveConvId} onDelete={id => deleteConvMutation.mutate(id)} onPin={id => pinMutation.mutate(id)} />)}
            </>
          )}
          {unpinnedConvs.length > 0 && (
            <>
              {pinnedConvs.length > 0 && <div style={styles.sectionLabel}>Recent</div>}
              {unpinnedConvs.map(c => <ConvItem key={c.id} conv={c} active={c.id === activeConvId} onSelect={setActiveConvId} onDelete={id => deleteConvMutation.mutate(id)} onPin={id => pinMutation.mutate(id)} />)}
            </>
          )}
          {conversations.length === 0 && (
            <div style={styles.emptyState}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                No conversations yet.<br />Start chatting!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={styles.chatArea}>
        {!activeConvId ? (
          <div style={styles.welcome}>
            <div style={styles.welcomeIcon}>🤖</div>
            <h2 className="gradient-text" style={{ fontSize: 28, fontWeight: 700 }}>Your AI Clone</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 400, textAlign: 'center', marginTop: 8 }}>
              Start a conversation and let your personalized AI respond exactly like you would.
            </p>
            <button
              className="btn btn-primary btn-lg"
              style={{ marginTop: 24 }}
              onClick={() => createConvMutation.mutate()}
            >
              <PlusIcon /> New Conversation
            </button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div style={styles.messages}>
              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {streaming && streamBuffer && (
                <MessageBubble
                  message={{ id: 'stream', role: 'ASSISTANT', content: streamBuffer, createdAt: new Date().toISOString() }}
                  isStreaming
                />
              )}
              {streaming && !streamBuffer && (
                <div style={styles.typingIndicator}>
                  <div style={styles.typingBubble}>
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={styles.inputArea} className="glass">
              <div style={styles.modelSelect}>
                <select
                  style={styles.select}
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                >
                  <option value="qwen2.5:latest">Qwen 2.5</option>
                  <option value="gemma3:4b">Gemma 3</option>
                  <option value="llama3.2:latest">Llama 3.2</option>
                </select>
              </div>
              <div style={styles.inputRow}>
                <textarea
                  ref={inputRef}
                  className="input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message your AI clone... (Enter to send, Shift+Enter for newline)"
                  rows={1}
                  style={{ resize: 'none', flex: 1, minHeight: 44, maxHeight: 200, overflowY: 'auto', fontFamily: 'var(--font-sans)' }}
                  disabled={streaming}
                />
                {streaming ? (
                  <button className="btn btn-danger" onClick={stopGeneration} style={{ flexShrink: 0 }}>
                    <StopIcon /> Stop
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    style={{ flexShrink: 0 }}
                  >
                    <SendIcon />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ConvItem({ conv, active, onSelect, onDelete, onPin }: {
  conv: Conversation; active: boolean; onSelect: (id: string) => void
  onDelete: (id: string) => void; onPin: (id: string) => void
}) {

  return (
    <div
      style={{ ...styles.convItem, ...(active ? styles.convItemActive : {}) }}
      onClick={() => onSelect(conv.id)}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={styles.convTitle}>{conv.title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onPin(conv.id)} title="Pin">
          📌
        </button>
        <button className="btn btn-danger btn-icon btn-sm" onClick={() => onDelete(conv.id)} title="Delete">
          🗑
        </button>
      </div>
    </div>
  )
}

function MessageBubble({ message, isStreaming }: { message: Message; isStreaming?: boolean }) {
  const isUser = message.role === 'USER'
  const [copied, setCopied] = useState(false)

  const copyContent = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ ...styles.messageBubble, ...(isUser ? styles.userBubble : styles.assistantBubble) }}>
      <div style={styles.messageAvatar}>
        {isUser ? '👤' : '🤖'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...styles.messageContent, ...(isUser ? styles.userContent : styles.assistantContent) }}>
          {isUser ? (
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter style={vscDarkPlus as any} language={match[1]} PreTag="div" {...props}>
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>{children}</code>
                  )
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
          {isStreaming && <span style={styles.cursor}>▊</span>}
        </div>
        <div style={styles.messageMeta}>
          {message.latencyMs && <span>{(message.latencyMs / 1000).toFixed(1)}s</span>}
          {message.tokenCount && <span>{message.tokenCount} tokens</span>}
          <button
            className="btn btn-ghost btn-icon btn-sm"
            style={{ fontSize: 11, padding: '2px 6px' }}
            onClick={copyContent}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function SendIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> }
function StopIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> }

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', height: '100%', overflow: 'hidden' },
  convList: { width: 260, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', flexShrink: 0, background: 'var(--bg-secondary)' },
  convHeader: { padding: '12px 12px 8px', display: 'flex', gap: 8, borderBottom: '1px solid var(--border-color)' },
  convItems: { flex: 1, overflowY: 'auto', padding: '8px 6px' },
  sectionLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '6px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  emptyState: { padding: 20 },
  convItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s ease' },
  convItemActive: { background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' },
  convTitle: { fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' },
  welcome: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 },
  welcomeIcon: { fontSize: 64, marginBottom: 16 },
  messages: { flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 },
  typingIndicator: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  typingBubble: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 6, alignItems: 'center' },
  messageBubble: { display: 'flex', gap: 10, alignItems: 'flex-start', animation: 'fadeIn 0.2s ease' },
  userBubble: { flexDirection: 'row-reverse' },
  assistantBubble: { flexDirection: 'row' },
  messageAvatar: { width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
  messageContent: { maxWidth: '80%', borderRadius: 12, padding: '10px 14px', fontSize: 14, lineHeight: 1.6 },
  userContent: { background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: 'white' },
  assistantContent: { background: 'var(--bg-card)', border: '1px solid var(--border-color)' },
  messageMeta: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, fontSize: 11, color: 'var(--text-muted)' },
  cursor: { display: 'inline-block', marginLeft: 2, animation: 'pulse 1s infinite' },
  inputArea: { padding: 16, borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 8 },
  modelSelect: { display: 'flex', alignItems: 'center', gap: 8 },
  select: { background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-secondary)', padding: '4px 10px', fontSize: 12, cursor: 'pointer', outline: 'none' },
  inputRow: { display: 'flex', gap: 8, alignItems: 'flex-end' },
}
