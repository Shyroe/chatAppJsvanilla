const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require("./utils/users");

const app = express();

//Create server
const server = http.createServer(app);
const io = socketio(server); //criando socketio

const botName = "ChatCord Bot";

//Run when client connects
io.on("connection", socket => {
  //join room
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    //Welcome current user
    //   socket.emit("message", "Welcome to ChatCord!"); //only user connect
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord")); //only user connect

    //   socket.broadcast.emit("message", "A user has joined the chat"); //everybody user connect
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      ); //everybody user connect

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  //Listen for chatMessage
  socket.on("chatMessage", msg => {
    // emit to the client everybody message
    // io.emit("message", msg);
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  //Runs when client disconnects
  socket.on("disconnect", () => {
    // io.emit("message", "A user has left the chat");
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });

  io.emit();
});

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log("Server Running at port: ", PORT));
