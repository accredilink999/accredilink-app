'use client'
import { useState } from 'react'
import { Download, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react'

// Rich markdown renderer for forum posts
// Supports: # ## ### headings, --- dividers, - bullets, 1. numbered lists,
// **bold**, *italic*, [links](url), ![images](url), ```code```, > quotes,
// @mentions, [file:name](url) attachments

const SECTION_COLORS = [
  { bg: 'bg-teal-50', border: 'border-teal-500', text: 'text-teal-800', accent: 'bg-teal-500' },
  { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-800', accent: 'bg-blue-500' },
  { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-800', accent: 'bg-purple-500' },
  { bg: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-800', accent: 'bg-rose-500' },
  { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-800', accent: 'bg-amber-500' },
  { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-800', accent: 'bg-green-500' },
  { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-800', accent: 'bg-indigo-500' },
  { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-800', accent: 'bg-orange-500' },
  { bg: 'bg-cyan-50', border: 'border-cyan-500', text: 'text-cyan-800', accent: 'bg-cyan-500' },
  { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-800', accent: 'bg-pink-500' },
]

function parseContent(text) {
  if (!text) return []
  const lines = text.split('\n')
  const raw = []
  let inCodeBlock = false
  let codeLines = []
  let codeLang = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        raw.push({ type: 'code', content: codeLines.join('\n'), lang: codeLang })
        codeLines = []
        codeLang = ''
        inCodeBlock = false
      } else {
        inCodeBlock = true
        codeLang = line.slice(3).trim()
      }
      continue
    }
    if (inCodeBlock) { codeLines.push(line); continue }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      raw.push({ type: 'hr' })
      continue
    }

    // Headings
    const h1Match = line.match(/^# (.+)$/)
    if (h1Match) { raw.push({ type: 'h1', content: h1Match[1] }); continue }

    const h2Match = line.match(/^## (.+)$/)
    if (h2Match) { raw.push({ type: 'h2', content: h2Match[1] }); continue }

    const h3Match = line.match(/^### (.+)$/)
    if (h3Match) { raw.push({ type: 'h3', content: h3Match[1] }); continue }

    // Blockquotes
    if (line.startsWith('> ')) {
      raw.push({ type: 'quote', content: line.slice(2) })
      continue
    }

    // Unordered list items
    const ulMatch = line.match(/^[-*] (.+)$/)
    if (ulMatch) { raw.push({ type: 'li', content: ulMatch[1] }); continue }

    // Ordered list items
    const olMatch = line.match(/^\d+\. (.+)$/)
    if (olMatch) { raw.push({ type: 'oli', content: olMatch[1] }); continue }

    // File attachment links [file:filename](url)
    const fileMatch = line.match(/^\[file:(.+?)\]\((.+?)\)$/)
    if (fileMatch) { raw.push({ type: 'file', name: fileMatch[1], url: fileMatch[2] }); continue }

    // Image only line ![alt](url)
    const imgMatch = line.match(/^!\[(.+?)\]\((.+?)\)$/)
    if (imgMatch) { raw.push({ type: 'image', alt: imgMatch[1], url: imgMatch[2] }); continue }

    // Regular text
    raw.push({ type: 'text', content: line })
  }

  if (inCodeBlock && codeLines.length > 0) {
    raw.push({ type: 'code', content: codeLines.join('\n'), lang: codeLang })
  }

  // Group consecutive list items into lists
  const elements = []
  let i = 0
  while (i < raw.length) {
    if (raw[i].type === 'li') {
      const items = []
      while (i < raw.length && raw[i].type === 'li') { items.push(raw[i].content); i++ }
      elements.push({ type: 'ul', items })
    } else if (raw[i].type === 'oli') {
      const items = []
      while (i < raw.length && raw[i].type === 'oli') { items.push(raw[i].content); i++ }
      elements.push({ type: 'ol', items })
    } else {
      elements.push(raw[i])
      i++
    }
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
      parts.push(<strong key={key++} className="font-semibold text-slate-800">{match[2]}</strong>)
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
      const isInternal = match[3].startsWith('/')
      parts.push(
        <a key={key++} href={match[3]} target={isInternal ? '_self' : '_blank'} rel={isInternal ? undefined : 'noopener noreferrer'} className="text-teal-600 hover:text-teal-700 underline inline-flex items-center gap-0.5 font-medium">
          {match[2]}
          {!isInternal && <ExternalLink className="w-3 h-3" />}
        </a>
      )
      remaining = match[4]
      continue
    }

    // @mentions
    match = remaining.match(/^(.*?)@([a-z0-9_-]+)/i)
    if (match) {
      if (match[1]) parts.push(<span key={key++}>{renderInlineMarkdown(match[1])}</span>)
      parts.push(
        <a key={key++} href={`/forum/profile/${match[2].toLowerCase()}`} className="text-teal-600 font-semibold hover:underline bg-teal-50 px-1 rounded">
          @{match[2]}
        </a>
      )
      remaining = remaining.slice(match[0].length)
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
  let h2Index = 0

  return (
    <div className="text-sm text-slate-700 leading-relaxed space-y-2">
      {elements.map((el, i) => {
        switch (el.type) {
          case 'h1':
            return (
              <div key={i} className="mt-6 mb-4 first:mt-0">
                <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-5 py-3 rounded-xl text-lg font-bold shadow-sm">
                  {renderInlineMarkdown(el.content)}
                </div>
              </div>
            )
          case 'h2': {
            const color = SECTION_COLORS[h2Index++ % SECTION_COLORS.length]
            return (
              <div key={i} className={`mt-5 mb-3 ${color.bg} border-l-4 ${color.border} rounded-r-lg px-4 py-2.5`}>
                <h2 className={`text-base font-bold ${color.text} tracking-tight`}>
                  {renderInlineMarkdown(el.content)}
                </h2>
              </div>
            )
          }
          case 'h3':
            return (
              <div key={i} className="mt-4 mb-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                  {renderInlineMarkdown(el.content)}
                </h3>
              </div>
            )
          case 'hr':
            return (
              <div key={i} className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
              </div>
            )
          case 'ul':
            return (
              <ul key={i} className="space-y-1.5 pl-1 my-2">
                {el.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                    <span className="flex-1">{renderInlineMarkdown(item)}</span>
                  </li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={i} className="space-y-1.5 pl-1 my-2">
                {el.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 min-w-[20px] h-5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{j + 1}</span>
                    <span className="flex-1">{renderInlineMarkdown(item)}</span>
                  </li>
                ))}
              </ol>
            )
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
