import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { predefinedMapUrls } from "./src/predefinedAssets";

// Poprawka dla __dirname w środowisku modułów ES
const __dirname = process.cwd();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Global game state setup
  let globalGameState: any = {
    appPhase: "lobby",
    gameMode: "classic",
    activePlayerCount: 4,
    playerNames: { red: "Gracz 1", green: "Gracz 2", yellow: "Gracz 3", blue: "Gracz 4", purple: "Gracz 5", orange: "Gracz 6" },
    playerAvatars: { red: null, green: null, yellow: null, blue: null, purple: null, orange: null },
    takenSeats: {},
    pawns: [],
    currentPlayerIndex: 0,
    diceRoll: null,
    phase: "roll",
    rollAttempts: 0,
    winner: null,
    deadlockMsg: null,
    chatMessages: [],
    selectedMap: predefinedMapUrls[0].url,
    goreMarks: [],
    gameMaster: null,
    connectedUsers: []
  };

  let connectedSockets: string[] = [];

  io.on("connection", (socket) => {
    console.log(`🟢 Nowy gracz podłączony: ${socket.id}`);

    connectedSockets.push(socket.id);
    if (!globalGameState.gameMaster) {
      globalGameState.gameMaster = connectedSockets[0];
    }

    const playerId = (socket.handshake.query.playerId as string) || socket.id;
    globalGameState.connectedUsers.push({ id: socket.id, playerId, name: "Dołącza..." });

    socket.emit("state_update", globalGameState);
    io.emit("state_update", globalGameState);

    socket.on("set_user_name", (name: string) => {
      const user = globalGameState.connectedUsers.find((u: any) => u.id === socket.id);
      if (user) {
        user.name = name;
        io.emit("state_update", globalGameState);
      }
    });

    socket.on("update_state", (newState: any) => {
      globalGameState = { ...globalGameState, ...newState };
      globalGameState.gameMaster = connectedSockets[0];
      io.emit("state_update", globalGameState);
    });

    socket.on("disconnect", () => {
      console.log(`🔴 Gracz rozłączony: ${socket.id}`);
      connectedSockets = connectedSockets.filter(id => id !== socket.id);
      globalGameState.connectedUsers = globalGameState.connectedUsers.filter((u: any) => u.id !== socket.id);
      globalGameState.gameMaster = connectedSockets.length > 0 ? connectedSockets[0] : null;
      io.emit("state_update", globalGameState);
    });
  });

  // OBSŁUGA PRODUKCYJNA
  const distPath = path.join(__dirname, "dist");

  // 1. Serwowanie zasobów (JS, CSS) z odpowiednim prefiksem
  app.use("/chinczyk-online/assets", express.static(path.join(distPath, "assets")));

  // 2. Serwowanie pozostałych plików statycznych
  app.use("/chinczyk-online", express.static(distPath));

  // 3. Obsługa tras (Single Page Application)
  app.get("/chinczyk-online/*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  // Dodatkowo: przekierowanie z głównego adresu na grę
  app.get("/", (req, res) => {
    res.redirect("/chinczyk-online/");
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Serwer działa na porcie ${PORT} i jest dostępny w sieci!`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});