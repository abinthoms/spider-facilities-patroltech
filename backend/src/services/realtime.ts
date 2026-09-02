import WebSocket from 'ws';

interface ScopedClient {
	ws: WebSocket;
	organizationId: string;
}

const clients = new Set<ScopedClient>();

export function registerClient(ws: WebSocket, organizationId: string): void {
	const client: ScopedClient = { ws, organizationId };
	clients.add(client);

	ws.on('close', () => {
		clients.delete(client);
	});
}

export function broadcast(organizationId: string, event: { type: string; [key: string]: any }): void {
	const payload = JSON.stringify(event);
	for (const client of clients) {
		if (client.organizationId === organizationId && client.ws.readyState === WebSocket.OPEN) {
			client.ws.send(payload);
		}
	}
}
