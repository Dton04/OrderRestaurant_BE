import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow cross-origin requests from the frontend
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { role?: string; userId?: string | number },
  ) {
    if (payload.role === 'chef') {
      client.join('room_chef');
      console.log(`Client ${client.id} joined room_chef`);
    } else if (payload.role === 'staff') {
      client.join('room_staff');
      console.log(`Client ${client.id} joined room_staff`);
    } else if (payload.role === 'customer' || payload.userId) {
      const room = `room_customer_${payload.userId || client.id}`;
      client.join(room);
      console.log(`Client ${client.id} joined ${room}`);
      return { event: 'joined', data: room };
    }
  }

  // Business specific emitters
  notifyNewOrder() {
    this.server.to('room_chef').emit('refresh_orders');
    this.server.to('room_staff').emit('refresh_orders');
  }

  notifyItemStatusChanged(customerId?: string | number | null | bigint) {
    // Notify internal staff
    this.server.to('room_chef').emit('refresh_orders');
    this.server.to('room_staff').emit('refresh_pulse');

    // Notify specific customer if provided
    if (customerId) {
      this.server.to(`room_customer_${customerId.toString()}`).emit('item_status_changed');
    }
  }
}
