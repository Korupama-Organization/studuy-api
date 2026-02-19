// Entry point of the backend server
import 'dotenv/config';
import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Route to display the initial message on browser
app.get('/', (_req: Request, res: Response) => {
    res.send('. BACKEND API');
});

// TODO: Add routes and middleware

app.listen(PORT, () => {
    console.log(`Server is up and running at http://localhost:${PORT} 🚀`);
});
