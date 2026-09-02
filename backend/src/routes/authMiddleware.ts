import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';


declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                name: string;
                organizationId: string;
                type: 'staff' | 'guard';
                email?: string;
                identifier?: string;
            };
        }
    }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        console.log('Auth header:', authHeader.split(' ')[1]);
        const token = authHeader.split(' ')[1];

        try {
            const user = verifyToken(token);
            console.log('User:', user);
            (req as any).user = user;
            next();
        } catch (error) {
            console.error('Error verifying token:', error);
            return res.sendStatus(403);
        }
    } else {
        res.sendStatus(401);
    }
};

export const requireRole = (role: 'staff' | 'guard') => (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.type !== role) {
        return res.sendStatus(403);
    }
    next();
};
