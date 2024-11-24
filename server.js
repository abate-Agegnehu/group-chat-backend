const http = require("http");
const path = require("path");
const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const MONGO_URL = process.env.MONGO_URL;
// MongoDB Connection String
mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Message Schema
const messageSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const io = new Server(server, {
  cors: {
    origin: "https://abategroupchat.netlify.app", // Frontend URL
    methods: ["GET", "POST"],
  },
});

io.on("connection", async (socket) => {
  console.log("A user connected:", socket.id);

  try {
    // Send chat history to the connected user
    const messages = await Message.find().sort({ timestamp: 1 });
    console.log("Chat history sent:", messages); // Log the messages
    socket.emit("chat history", messages);
  } catch (err) {
    console.error("Error fetching chat history:", err);
  }

  // Handle incoming chat messages
  socket.on("chat message", async (data) => {
    try {
      const newMessage = new Message(data);
      await newMessage.save();
      console.log("Message saved:", data);

      // Broadcast message to all connected clients
      io.emit("chat message", data);
    } catch (err) {
      console.error("Error saving message to DB:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Serve the frontend
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 30001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
