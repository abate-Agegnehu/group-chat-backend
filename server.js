const http = require("http");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const io = new Server(server, {
  cors: {
    origin: "https://abategroupchat.netlify.app/",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("chat message", (data) => {
    io.emit("chat message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "public", "index.html"));
});

const PORT = 30001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
