let io = null;

function setSocketIO(socketIOInstance) {
  io = socketIOInstance;
}

function getSocketIO() {
  return io;
}

module.exports = { setSocketIO, getSocketIO };
