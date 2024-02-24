const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.get('/join-room', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'loginPage.html'));
});

const roomSocketMap = {};
const roomParticipantsMap = {};

app.get('/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  res.sendFile(path.join(__dirname, 'client', 'editorPage.html'));
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);

    if (!roomParticipantsMap[roomId]) {
      roomParticipantsMap[roomId] = [];
    }
    roomParticipantsMap[roomId].push(socket.id);

    io.to(roomId).emit('updateParticipants', roomParticipantsMap[roomId]);
    roomSocketMap[socket.id] = roomId;
  });

  socket.on('textUpdate', (text) => {
    const roomId = roomSocketMap[socket.id];
    io.to(roomId).emit('textUpdate', { id: socket.id, text });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');

    const roomId = roomSocketMap[socket.id];
    if (roomId && roomParticipantsMap[roomId]) {
      roomParticipantsMap[roomId] = roomParticipantsMap[roomId].filter(id => id !== socket.id);
      io.to(roomId).emit('updateParticipants', roomParticipantsMap[roomId]);
    }

    delete roomSocketMap[socket.id];
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
