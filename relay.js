import express from "express";
import { WebSocketServer } from "ws";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 10000;

const app = express();
const server = app.listen(PORT, () => console.log("✅ Relay running on " + PORT));

// Simple health check
app.get("/", (req, res) => res.send("Relay online"));

// WebSocket bridge Twilio ↔ OpenAI
const wss = new WebSocketServer({ server });

wss.on("connection", (wsClient) => {
  console.log("🔊 Twilio connected");

  const wsAI = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
    {
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }
    }
  );

  wsAI.on("open", () => console.log("🤖 Connected to OpenAI Realtime"));

  // Pipe messages both ways
  wsClient.on("message", (msg) => wsAI.readyState === 1 && wsAI.send(msg));
  wsAI.on("message", (msg) => wsClient.readyState === 1 && wsClient.send(msg));

  wsClient.on("close", () => wsAI.close());
  wsAI.on("close", () => wsClient.close());
});
