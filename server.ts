import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { predefinedMapUrls } from "./src/predefinedAssets";

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
    gameMode: "classic", // 'classic' or 'six_player'
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
    goreMarks: [], // List of gore and scorch marks on the board
    gameMaster: null,
    connectedUsers: [] // Tablica wszystkich graczy online
  };

  let connectedSockets: string[] = [];

  io.on("connection", (socket) => {
    console.log(`🟢 Nowy gracz podłączony: ${socket.id}`);
    
    connectedSockets.push(socket.id);
    if (!globalGameState.gameMaster) {
      globalGameState.gameMaster = connectedSockets[0];
    }

    const playerId = (socket.handshake.query.playerId as string) || socket.id;

    // Dodajemy nowego użytkownika z identyfikatorem playerId
    globalGameState.connectedUsers.push({ id: socket.id, playerId, name: "Dołącza..." });

    socket.emit("state_update", globalGameState);
    io.emit("state_update", globalGameState);

    // ODBIÓR IMIENIA OD GRACZA Z EKRANU POWITALNEGO
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

      const oldGM = globalGameState.gameMaster;
      globalGameState.gameMaster = connectedSockets.length > 0 ? connectedSockets[0] : null;

      if (oldGM !== globalGameState.gameMaster) {
        console.log(`👑 Sukcesja władzy! Nowy Mistrz Gry to: ${globalGameState.gameMaster}`);
      }

      // Rozsyłamy pełny zaktualizowany stan do wszystkich po rozłączeniu
      io.emit("state_update", globalGameState);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(3000, '0.0.0.0', () => {
  console.log('Serwer działa na porcie 3000 i jest dostępny w sieci!');
});
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
