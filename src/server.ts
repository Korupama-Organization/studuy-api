// Entry point of the backend server
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import connectDB from './db/connect';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './utils/swagger';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Swagger UI ────────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Studuy API Docs',
    swaggerOptions: { persistAuthorization: true },
}));
// Trả về raw JSON spec (để các tool khác như Postman import)
app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});


// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'STUDUY BACKEND API' });
});

import authRoutes from './routes/auth.routes';

// ── TODO: Register routes ─────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
// app.use('/api/courses', courseRoutes);
// app.use('/api/lessons', lessonRoutes);
// app.use('/api/orders',  orderRoutes);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const start = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is up and running at http://localhost:${PORT} `);
    });
};

start();
