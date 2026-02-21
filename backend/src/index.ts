import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { errorHandler } from './api/middleware/errorHandler';
import { agentRoutes } from './api/routes/agents';
import { buildJobRoutes } from './api/routes/build-jobs';
import { fileRoutes } from './api/routes/files';
import { healthRoutes } from './api/routes/health';
import { terminalRoutes } from './api/routes/terminal';
import { projectRoutes } from './api/routes/projects';
import { TerminalSessionManager } from './sandbox/session-manager';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/terminal' });

const terminalManager = new TerminalSessionManager();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/build-jobs', buildJobRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/terminal', terminalRoutes);
app.use('/api/projects', projectRoutes);

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const sessionId = url.searchParams.get('session') || 'default';
  terminalManager.handleConnection(ws, sessionId);
});

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`RivRyn backend running on port ${PORT}`);
});
