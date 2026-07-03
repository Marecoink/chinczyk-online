var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_socket = require("socket.io");
var import_cors = __toESM(require("cors"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");

// src/predefinedAssets.ts
var predefinedMapUrls = [
  { name: "Klasyczna (Shrek)", url: "/mapy/shrek.jpg" },
  { name: "Mapa 2", url: "/mapy/mapa2.jpg" }
];

// server.ts
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use((0, import_cors.default)());
  const server = import_http.default.createServer(app);
  const io = new import_socket.Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  let globalGameState = {
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
  let connectedSockets = [];
  io.on("connection", (socket) => {
    console.log(`\u{1F7E2} Nowy gracz pod\u0142\u0105czony: ${socket.id}`);
    connectedSockets.push(socket.id);
    if (!globalGameState.gameMaster) {
      globalGameState.gameMaster = connectedSockets[0];
    }
    const playerId = socket.handshake.query.playerId || socket.id;
    globalGameState.connectedUsers.push({ id: socket.id, playerId, name: "Do\u0142\u0105cza..." });
    socket.emit("state_update", globalGameState);
    io.emit("state_update", globalGameState);
    socket.on("set_user_name", (name) => {
      const user = globalGameState.connectedUsers.find((u) => u.id === socket.id);
      if (user) {
        user.name = name;
        io.emit("state_update", globalGameState);
      }
    });
    socket.on("update_state", (newState) => {
      globalGameState = { ...globalGameState, ...newState };
      globalGameState.gameMaster = connectedSockets[0];
      io.emit("state_update", globalGameState);
    });
    socket.on("disconnect", () => {
      console.log(`\u{1F534} Gracz roz\u0142\u0105czony: ${socket.id}`);
      connectedSockets = connectedSockets.filter((id) => id !== socket.id);
      globalGameState.connectedUsers = globalGameState.connectedUsers.filter((u) => u.id !== socket.id);
      globalGameState.gameMaster = connectedSockets.length > 0 ? connectedSockets[0] : null;
      io.emit("state_update", globalGameState);
    });
  });
  const distPath = import_path.default.join(__dirname, "dist");
  app.use(import_express.default.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(import_path.default.join(distPath, "index.html"));
  });
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Serwer dzia\u0142a na porcie ${PORT} i jest dost\u0119pny w sieci!`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
//# sourceMappingURL=server.cjs.map
