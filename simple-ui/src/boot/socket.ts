import { boot } from 'quasar/wrappers';
import { io, Socket } from 'socket.io-client';

let socket: Socket;

export default boot(({}) => {
  socket = io(process.env.BACKEND_URL, {
    upgrade: false,
    transports: ['websocket'],
  });
});

export { socket };
