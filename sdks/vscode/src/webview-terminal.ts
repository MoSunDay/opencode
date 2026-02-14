import * as vscode from "vscode"

const VIEWTYPE = "opencode.webviewTerminal"

export class WebviewTerminal {
  static panel: vscode.WebviewPanel | undefined

  static async open(context: vscode.ExtensionContext, port: number) {
    const column = vscode.window.activeTextEditor ? vscode.ViewColumn.Beside : vscode.ViewColumn.One

    if (WebviewTerminal.panel) {
      WebviewTerminal.panel.reveal(column)
      WebviewTerminal.panel.webview.html = getHtml(port)
      return
    }

    const panel = vscode.window.createWebviewPanel(VIEWTYPE, "opencode", column, {
      enableScripts: true,
      retainContextWhenHidden: true,
    })

    panel.iconPath = {
      light: vscode.Uri.file(context.asAbsolutePath("images/button-dark.svg")),
      dark: vscode.Uri.file(context.asAbsolutePath("images/button-light.svg")),
    }

    panel.webview.html = getHtml(port)

    panel.onDidDispose(() => {
      WebviewTerminal.panel = undefined
    })

    WebviewTerminal.panel = panel
  }
}

function getHtml(port: number) {
  const serverUrl = `http://localhost:${port}`
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>opencode</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #1e1e1e; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #app { display: flex; width: 100%; height: 100%; }
    #sidebar { width: 280px; height: 100%; background: #252526; border-right: 1px solid #3c3c3c; display: flex; flex-direction: column; }
    #sidebar.hidden { display: none; }
    #sidebar-header { padding: 12px 16px; border-bottom: 1px solid #3c3c3c; display: flex; justify-content: space-between; align-items: center; }
    #sidebar-title { color: #cccccc; font-size: 13px; font-weight: 600; }
    #sidebar-refresh { background: none; border: none; color: #888; cursor: pointer; padding: 4px; border-radius: 4px; }
    #sidebar-refresh:hover { background: #3c3c3c; color: #fff; }
    #session-list { flex: 1; overflow-y: auto; padding: 8px 0; }
    .session-item { padding: 8px 16px; cursor: pointer; color: #cccccc; font-size: 13px; border-bottom: 1px solid #2d2d2d; }
    .session-item:hover { background: #2a2d2e; }
    .session-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .session-meta { font-size: 11px; color: #888; margin-top: 4px; display: flex; gap: 8px; }
    #sidebar-loading { padding: 16px; color: #888; font-size: 13px; text-align: center; }
    #sidebar-error { padding: 16px; color: #f44; font-size: 13px; text-align: center; }
    #terminal { flex: 1; height: 100%; }
    #toggle-sidebar { position: absolute; top: 8px; left: 8px; z-index: 100; background: #3c3c3c; border: none; color: #ccc; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; }
    #toggle-sidebar:hover { background: #4c4c4c; }
    .xterm { padding: 4px; }
    .loading { display: flex; align-items: center; justify-content: center; height: 100%; color: #888; font-family: monospace; }
  </style>
</head>
<body>
  <div id="app">
    <div id="sidebar">
      <div id="sidebar-header">
        <span id="sidebar-title">Sessions</span>
        <button id="sidebar-refresh" title="Refresh">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a5.99 5.99 0 0 0-5.27 3.12l1.06 1.06A4.5 4.5 0 1 1 3.5 8H2a6 6 0 1 0 6-6V0L4.5 3.5 8 7V4.5h1.5V7L7 4.5V2h1z" transform="rotate(-45 8 8)"/></svg>
        </button>
      </div>
      <div id="session-list"></div>
    </div>
    <div id="terminal"><div class="loading">Connecting...</div></div>
  </div>
  <button id="toggle-sidebar">☰</button>
  <script type="module">
    import { Terminal } from 'https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/+esm'
    import { FitAddon } from 'https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.10.0/+esm'
    import { WebLinksAddon } from 'https://cdn.jsdelivr.net/npm/@xterm/addon-web-links@0.11.0/+esm'

    const serverUrl = ${JSON.stringify(serverUrl)}
    const headers = { 'Content-Type': 'application/json' }

    function formatTime(ts) {
      if (!ts) return ''
      const d = new Date(ts)
      const now = new Date()
      const diff = now - d
      if (diff < 60000) return 'just now'
      if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'
      if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
      return d.toLocaleDateString()
    }

    async function loadSessions() {
      const listEl = document.getElementById('session-list')
      listEl.innerHTML = '<div id="sidebar-loading">Loading...</div>'
      try {
        const res = await fetch(serverUrl + '/session', { headers })
        if (!res.ok) throw new Error('Failed to load sessions')
        const sessions = await res.json()
        if (!sessions.length) {
          listEl.innerHTML = '<div id="sidebar-loading">No sessions</div>'
          return
        }
        listEl.innerHTML = sessions.map(s => 
          '<div class="session-item" data-id="' + s.id + '">' +
          '<div class="session-title">' + (s.title || 'Untitled') + '</div>' +
          '<div class="session-meta"><span>' + formatTime(s.time?.updated) + '</span></div>' +
          '</div>'
        ).join('')
        listEl.querySelectorAll('.session-item').forEach(el => {
          el.addEventListener('click', () => selectSession(el.dataset.id))
        })
      } catch (err) {
        listEl.innerHTML = '<div id="sidebar-error">Error: ' + err.message + '</div>'
      }
    }

    async function selectSession(sessionId) {
      try {
        const res = await fetch(serverUrl + '/tui/select-session', {
          method: 'POST',
          headers,
          body: JSON.stringify({ sessionID: sessionId })
        })
        if (!res.ok) throw new Error('Failed to select session')
      } catch (err) {
        console.error('Failed to select session:', err)
      }
    }

    document.getElementById('sidebar-refresh').addEventListener('click', loadSessions)
    document.getElementById('toggle-sidebar').addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar')
      sidebar.classList.toggle('hidden')
      setTimeout(() => window.dispatchEvent(new Event('resize')), 100)
    })

    loadSessions()

    async function main() {
      const container = document.getElementById('terminal')
      container.innerHTML = ''

      const term = new Terminal({
        cursorBlink: true,
        cursorStyle: 'bar',
        fontSize: 13,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: { background: '#1e1e1e', foreground: '#d4d4d4', cursor: '#d4d4d4', selectionBackground: 'rgba(212, 212, 212, 0.25)' },
        scrollback: 10000,
      })

      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)
      term.loadAddon(new WebLinksAddon())
      term.open(container)
      fitAddon.fit()

      window.addEventListener('resize', () => fitAddon.fit())

      const ptyRes = await fetch(serverUrl + '/pty', {
        method: 'POST',
        headers,
        body: JSON.stringify({ command: 'opencode', args: ['attach', serverUrl], title: 'opencode-vscode-webview' }),
      })

      if (!ptyRes.ok) {
        term.write('\\x1b[31mFailed to create PTY session\\x1b[0m\\r\\n')
        return
      }

      const pty = await ptyRes.json()
      const wsUrl = new URL(serverUrl + '/pty/' + pty.id + '/connect')
      wsUrl.protocol = 'ws:'

      const ws = new WebSocket(wsUrl)
      ws.binaryType = 'arraybuffer'

      ws.onopen = () => {
        fetch(serverUrl + '/pty/' + pty.id, { method: 'PUT', headers, body: JSON.stringify({ size: { cols: term.cols, rows: term.rows } }) })
      }

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          const bytes = new Uint8Array(event.data)
          if (bytes[0] === 0) return
        }
        term.write(typeof event.data === 'string' ? event.data : new Uint8Array(event.data))
      }

      ws.onclose = () => term.write('\\r\\n\\x1b[33mConnection closed\\x1b[0m\\r\\n')

      term.onData((data) => ws.readyState === WebSocket.OPEN && ws.send(data))

      term.onResize((size) => {
        if (ws.readyState !== WebSocket.OPEN) return
        fetch(serverUrl + '/pty/' + pty.id, { method: 'PUT', headers, body: JSON.stringify({ size: { cols: size.cols, rows: size.rows } }) })
      })

      term.focus()
    }

    main().catch((err) => {
      document.getElementById('terminal').innerHTML = '<div class="loading" style="color:#f44">Error: ' + err.message + '</div>'
    })
  </script>
</body>
</html>`
}
