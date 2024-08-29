import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import puppeteerRoutes from "./routes/puppeteerRoutes.js";

const app = express();
const port = process.env.PORT || 3001;

// MongoDB connection
connectDB();

// Middleware
app.use(
  cors({
    origin: "http://127.0.0.1:5173", // Replace with your React app's address
    credentials: true,
  })
);
app.use(bodyParser.json());

// Routes
app.use("/auth", authRoutes);
app.use("/api", puppeteerRoutes);
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
