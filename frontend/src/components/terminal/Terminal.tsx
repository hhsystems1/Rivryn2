import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { wsUrl } from '../../config/runtime';

interface TerminalProps {
  sessionId: string;
}

export function Terminal({ sessionId }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      fontSize: 14,
      theme: {
        background: '#1e293b',
        foreground: '#e2e8f0'
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(terminalRef.current);
    
    // Delay fit until container has dimensions
    requestAnimationFrame(() => {
      fitAddon.fit();
    });

    const ws = new WebSocket(wsUrl(`/ws/terminal?session=${encodeURIComponent(sessionId)}`));
    wsRef.current = ws;

    ws.onopen = () => {
      term.writeln('\r\n🚀 Connected to terminal\r\n');
    };

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      term.writeln('\r\n⚠️ Terminal connection failed. Is backend running?\r\n');
    };

    ws.onclose = () => {
      term.writeln('\r\n\r\nTerminal disconnected.\r\n');
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    xtermRef.current = term;

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      term.dispose();
    };
  }, [sessionId]);

  return (
    <div className="h-full bg-slate-800 border-t border-slate-700 flex flex-col">
      <div className="px-3 py-1 text-xs text-slate-400 border-b border-slate-700">
        Terminal
      </div>
      <div ref={terminalRef} className="flex-1" />
    </div>
  );
}
