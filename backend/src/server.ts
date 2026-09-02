import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local','.env'] });

import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import bodyParser from 'body-parser';
import cors from 'cors';
import sequelize from './db';
import scanRoutes from './routes/scans';
import authRoutes from './routes/auth';
import healthRoutes from './routes/health';
import organizationsRoutes from './routes/organizations';
import checkpointsRoutes from './routes/checkpoints';
import patrollersRoutes from './routes/patrollers';
import locationsRoutes from './routes/locations';
import shiftsRoutes from './routes/shifts';
import incidentsRoutes from './routes/incidents';
import auditLogRoutes from './routes/auditLog';
import publicPortalRoutes from './routes/publicPortal';

import {authenticateJWT} from "./routes/authMiddleware";
import {verifyToken} from "./services/authService";
import {registerClient} from "./services/realtime";


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
// Raised from the 100kb default — incident reports carry a base64-encoded photo.
app.use(bodyParser.json({ limit: '10mb' }));

app.use('/health', healthRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/public', publicPortalRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/checkpoints', authenticateJWT, checkpointsRoutes);
app.use('/api/patrollers', authenticateJWT, patrollersRoutes);
app.use('/api/locations', authenticateJWT, locationsRoutes);
app.use('/api/shifts', authenticateJWT, shiftsRoutes);
app.use('/api/incidents', authenticateJWT, incidentsRoutes);
app.use('/api/audit-log', authenticateJWT, auditLogRoutes);
app.use('/api', authenticateJWT, organizationsRoutes);

wss.on('connection', (ws, req) => {
    // Native browser WebSocket can't set headers, so the JWT travels as a query param.
    const url = new URL(req.url ?? '', 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
        ws.close(4001, 'Missing token');
        return;
    }

    let payload: any;
    try {
        payload = verifyToken(token);
    } catch (err) {
        ws.close(4001, 'Invalid token');
        return;
    }

    // Control Room is a staff-only feed for Core scope.
    if (payload.type !== 'staff' || !payload.organizationId) {
        ws.close(4003, 'Forbidden');
        return;
    }

    registerClient(ws, payload.organizationId);
    console.log('New client connected', payload.organizationId);

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

sequelize.sync().then(() => {
    server.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
}).catch((err) => {
    console.error('Unable to connect to the database:', err);
});
