import { boot } from 'quasar/wrappers';
import { io, Socket } from 'socket.io-client';
import { api } from './axios';

let socket: Socket = null;

export default boot(({}) => {
  socket = io(api.defaults.baseURL, {
    upgrade: false,
    transports: ['websocket'],
  });
});

export { socket };
