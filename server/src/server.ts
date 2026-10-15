import http from "http";
import app from "./app";
import { connectDB } from "./config/db";
import { setupWebSocket } from "./ws";

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  const server = http.createServer(app);
  setupWebSocket(server);
  server.listen(PORT, () => {
    console.log("Server running on port " + PORT);
  });
};

start();
