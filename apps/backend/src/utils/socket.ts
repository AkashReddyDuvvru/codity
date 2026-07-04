import { Server } from 'socket.io';

let io: Server | null = null;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Clients can join rooms based on queueId to only receive relevant updates
    socket.on('join_queue', (queueId: string) => {
      socket.join(`queue_${queueId}`);
      console.log(`Socket ${socket.id} joined queue_${queueId}`);
    });

    socket.on('leave_queue', (queueId: string) => {
      socket.leave(`queue_${queueId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getSocket = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
