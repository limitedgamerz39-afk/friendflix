// socketHelper.js
let io;
let connectedUsers = new Map();

const setIo = (socketIo) => {
  io = socketIo;
};

const addConnectedUser = (userId, socketId) => {
  connectedUsers.set(userId, socketId);
};

const removeConnectedUser = (socketId) => {
  for (let [userId, sid] of connectedUsers) {
    if (sid === socketId) {
      connectedUsers.delete(userId);
      break;
    }
  }
};

const emitToUser = (userId, event, data) => {
  const socketId = connectedUsers.get(userId);
  if (socketId && io) {
    io.to(socketId).emit(event, data);
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

const getConnectedUsers = () => {
  return connectedUsers;
};

module.exports = {
  setIo,
  addConnectedUser,
  removeConnectedUser,
  emitToUser,
  emitToAll,
  getConnectedUsers
};