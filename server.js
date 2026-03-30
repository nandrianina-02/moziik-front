import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

let rooms = {};

io.on("connection", (socket) => {
  socket.on("join", (roomId) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = { players: [], board: [], turn: 0 };
    }

    rooms[roomId].players.push(socket.id);

    if (rooms[roomId].players.length >= 2) {
      io.to(roomId).emit("start");
    }
  });

  socket.on("play", ({ roomId, state }) => {
    rooms[roomId] = { ...rooms[roomId], ...state };
    socket.to(roomId).emit("update", rooms[roomId]);
  });
});

server.listen(3001, () => {
  console.log("🚀 Server running on http://localhost:3001");
});