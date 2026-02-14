import { Hono } from "hono"
import { html } from "hono/html"
import type { HtmlEscapedString } from "hono/utils/html"
import { lazy } from "../../util/lazy"
import { Server } from "../server"

const terminalPage = (serverUrl: string, password?: string): HtmlEscapedString =>
  html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>opencode - Terminal</title>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css"
        />
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html,
          body {
            width: 100%;
            height: 100%;
            background: #1a1a1a;
            overflow: hidden;
          }
          #terminal {
            width: 100%;
            height: 100%;
          }
          .xterm {
            padding: 8px;
          }
          .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #888;
            font-family: monospace;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div id="terminal"><div class="loading">Connecting...</div></div>
        <script type="module">
          import { Terminal } from "https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/+esm"
          import { FitAddon } from "https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.10.0/+esm"
          import { WebLinksAddon } from "https://cdn.jsdelivr.net/npm/@xterm/addon-web-links@0.11.0/+esm"

          const serverUrl = ${JSON.stringify(serverUrl)}
          const password = ${JSON.stringify(password || "")}

          async function main() {
            const container = document.getElementById("terminal")
            container.innerHTML = ""

            const term = new Terminal({
              cursorBlink: true,
              cursorStyle: "bar",
              fontSize: 14,
              fontFamily: 'Menlo, Monaco, "Courier New", monospace',
              theme: {
                background: "#1a1a1a",
                foreground: "#d4d4d4",
                cursor: "#d4d4d4",
                selectionBackground: "rgba(212, 212, 212, 0.25)",
              },
              scrollback: 10000,
            })

            const fitAddon = new FitAddon()
            const webLinksAddon = new WebLinksAddon()
            term.loadAddon(fitAddon)
            term.loadAddon(webLinksAddon)
            term.open(container)
            fitAddon.fit()

            window.addEventListener("resize", () => fitAddon.fit())

            const headers = { "Content-Type": "application/json" }
            if (password) {
              headers["Authorization"] = "Basic " + btoa("opencode:" + password)
            }

            const ptyRes = await fetch(serverUrl + "/pty", {
              method: "POST",
              headers,
              body: JSON.stringify({
                command: "opencode",
                args: ["attach", serverUrl],
                title: "opencode-browser-tui",
              }),
            })

            if (!ptyRes.ok) {
              term.write("\\x1b[31mFailed to create PTY session\\x1b[0m\\r\\n")
              return
            }

            const pty = await ptyRes.json()
            const wsUrl = new URL(serverUrl + "/pty/" + pty.id + "/connect")
            wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:"
            if (password) {
              wsUrl.username = "opencode"
              wsUrl.password = password
            }

            const ws = new WebSocket(wsUrl)
            ws.binaryType = "arraybuffer"

            ws.onopen = () => {
              const size = { cols: term.cols, rows: term.rows }
              fetch(serverUrl + "/pty/" + pty.id, {
                method: "PUT",
                headers,
                body: JSON.stringify({ size }),
              })
            }

            ws.onmessage = (event) => {
              if (event.data instanceof ArrayBuffer) {
                const bytes = new Uint8Array(event.data)
                if (bytes[0] === 0) return
              }
              term.write(typeof event.data === "string" ? event.data : new Uint8Array(event.data))
            }

            ws.onclose = () => {
              term.write("\\r\\n\\x1b[33mConnection closed\\x1b[0m\\r\\n")
            }

            term.onData((data) => ws.readyState === WebSocket.OPEN && ws.send(data))

            term.onResize((size) => {
              if (ws.readyState !== WebSocket.OPEN) return
              fetch(serverUrl + "/pty/" + pty.id, {
                method: "PUT",
                headers,
                body: JSON.stringify({ size: { cols: size.cols, rows: size.rows } }),
              })
            })

            term.focus()
          }

          main().catch((err) => {
            document.getElementById("terminal").innerHTML =
              '<div class="loading" style="color:#f44">Error: ' + err.message + "</div>"
          })
        </script>
      </body>
    </html>` as HtmlEscapedString

export const TerminalRoutes = lazy(() =>
  new Hono().get("/", async (c) => {
    const url = Server.url()
    const serverUrl = `${url.protocol}//${url.host}`
    const password = process.env.OPENCODE_SERVER_PASSWORD
    return c.html(terminalPage(serverUrl, password))
  }),
)

