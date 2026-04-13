'use client'
import { useState } from 'react'
import { Download, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react'

// Simple markdown-like renderer for forum posts
// Supports: **bold**, *italic*, [links](url), ![images](url), ```code```, > quotes
// Also renders uploaded file links as download cards

function parseContent(text) {
  if (!text) return []
  const lines = text.split('\n')
  const elements = []
  let inCodeBlock = false
  let codeLines = []
  let codeLang = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push({ type: 'code', content: codeLines.join('\n'), lang: codeLang })
        codeLines = []
        codeLang = ''
        inCodeBlock = false
      } else {
        inCodeBlock = true
        codeLang = line.slice(3).trim()
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    // Blockquotes
    if (line.startsWith('> ')) {
      elements.push({ type: 'quote', content: line.slice(2) })
      continue
    }

    // File attachment links [file:filename](url)
    const fileMatch = line.match(/^\[file:(.+?)\]\((.+?)\)$/)
    if (fileMatch) {
      elements.push({ type: 'file', name: fileMatch[1], url: fileMatch[2] })
      continue
    }

    // Image only line ![alt](url)
    const imgOnlyMatch = line.match(/^!\[(.+?)\]\((.+?)\)$/)
    if (imgOnlyMatch) {
      elements.push({ type: 'image', alt: imgOnlyMatch[1], url: imgOnlyMatch[2] })
      continue
    }

    // Regular text
    elements.push({ type: 'text', content: line })
  }

  if (inCodeBlock && codeLines.length > 0) {
    elements.push({ type: 'code', content: codeLines.join('\n'), lang: codeLang })
  }

  return elements
}

function renderInlineMarkdown(text) {
  if (!text) return text
  const parts = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Inline code `code`
    let match = remaining.match(/^(.*?)`(.+?)`(.*)$/)
    if (match) {
      if (match[1]) parts.push(<span key={key++}>{renderInlineMarkdown(match[1])}</span>)
      parts.push(<code key={key++} className="px-1.5 py-0.5 bg-slate-100 text-teal-700 rounded text-xs font-mono">{match[2]}</code>)
      remaining = match[3]
      continue
    }

    // Bold **text**
    match = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)$/)
    if (match) {
      if (match[1]) parts.push(<span key={key++}>{renderInlineMarkdown(match[1])}</span>)
      parts.push(<strong key={key++} className="font-semibold">{match[2]}</strong>)
      remaining = match[3]
      continue
    }

    // Italic *text*
    match = remaining.match(/^(.*?)\*(.+?)\*(.*)$/)
    if (match) {
      if (match[1]) parts.push(<span key={key++}>{renderInlineMarkdown(match[1])}</span>)
      parts.push(<em key={key++}>{match[2]}</em>)
      remaining = match[3]
      continue
    }

    // Inline images ![alt](url)
    match = remaining.match(/^(.*?)!\[(.+?)\]\((.+?)\)(.*)$/)
    if (match) {
      if (match[1]) parts.push(<span key={key++}>{renderInlineMarkdown(match[1])}</span>)
      parts.push(<img key={key++} src={match[3]} alt={match[2]} className="inline-block max-h-64 rounded-lg" />)
      remaining = match[4]
      continue
    }

    // Links [text](url)
    match = remaining.match(/^(.*?)\[(.+?)\]\((.+?)\)(.*)$/)
    if (match) {
      if (match[1]) parts.push(<span key={key++}>{renderInlineMarkdown(match[1])}</span>)
      parts.push(
        <a key={key++} href={match[3]} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 underline inline-flex items-center gap-0.5">
          {match[2]}
          <ExternalLink className="w-3 h-3" />
        </a>
      )
      remaining = match[4]
      continue
    }

    // Plain URL detection
    match = remaining.match(/^(.*?)(https?:\/\/[^\s<>]+)(.*)$/)
    if (match) {
      if (match[1]) parts.push(<span key={key++}>{match[1]}</span>)
      parts.push(
        <a key={key++} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 underline inline-flex items-center gap-0.5 break-all">
          {match[2].length > 60 ? match[2].slice(0, 60) + '...' : match[2]}
          <ExternalLink className="w-3 h-3" />
        </a>
      )
      remaining = match[3]
      continue
    }

    // No more matches
    parts.push(<span key={key++}>{remaining}</span>)
    break
  }

  return parts.length === 1 ? parts[0] : parts
}

export default function RichContent({ content }) {
  const elements = parseContent(content)
  const [expandedImages, setExpandedImages] = useState({})

  return (
    <div className="text-sm text-slate-700 leading-relaxed space-y-2">
      {elements.map((el, i) => {
        switch (el.type) {
          case 'code':
            return (
              <pre key={i} className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto">
                {el.lang && <div className="text-slate-500 text-[10px] mb-2 uppercase tracking-wider">{el.lang}</div>}
                <code>{el.content}</code>
              </pre>
            )
          case 'quote':
            return (
              <blockquote key={i} className="border-l-3 border-teal-400 pl-4 py-1 text-slate-600 italic bg-teal-50/50 rounded-r-lg pr-3">
                {renderInlineMarkdown(el.content)}
              </blockquote>
            )
          case 'image':
            return (
              <div key={i} className="my-2">
                <img
                  src={el.url}
                  alt={el.alt}
                  className="max-w-full max-h-96 rounded-xl border border-slate-200 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setExpandedImages(prev => ({ ...prev, [i]: !prev[i] }))}
                />
                {expandedImages[i] && (
                  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setExpandedImages(prev => ({ ...prev, [i]: false }))}>
                    <img src={el.url} alt={el.alt} className="max-w-full max-h-full rounded-lg" />
                  </div>
                )}
              </div>
            )
          case 'file':
            return (
              <a
                key={i}
                href={el.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors group"
              >
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{el.name}</p>
                  <p className="text-[10px] text-slate-400">Click to download</p>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
              </a>
            )
          case 'text':
            if (!el.content.trim()) return <div key={i} className="h-2" />
            return <p key={i}>{renderInlineMarkdown(el.content)}</p>
          default:
            return null
        }
      })}
    </div>
  )
}
