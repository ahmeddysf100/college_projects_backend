import {
  INestApplicationContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { SocketWithAuth } from './sockets/types/types';
import { WsUnauthorizedException } from './exceptions/ws-exceptions';

// to remember watch this https://youtu.be/tUNaSRa5CFA?si=J60hQL5XRQZXZ8Y2

export class SocketIOAdapter extends IoAdapter {
  private readonly logger = new Logger(SocketIOAdapter.name);
  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    // const clientPort = parseInt(this.configService.get('CLIENT_PORT'));

    const cors = {
      // origin: [
      //   `http://localhost:${clientPort}`,
      //   new RegExp(`/^http:\/\/192\.168\.31\.([1-9]|[1-9]\d):${clientPort}$/`),    // only works with 192.168.31.1-99:(3000 from env)
      // ],
      origin: '*',
      allowedHeaders: ['*'], //need allow headers to make browser can access to server or delete this line and use transport:['websocket'] in client connect opt
    };

    this.logger.log('Configuring SocketIO server with custom CORS options', {
      cors,
    });

    const optionsWithCORS: ServerOptions = {
      ...options,
      cors,
    };

    const jwtService = this.app.get(JwtService);
    const server: Server = super.createIOServer(port, optionsWithCORS);

    server.of('arena').use(createTokenMiddleware(jwtService, this.logger)); // define socket.io middleWare

    return server;
  }
}

const createTokenMiddleware =
  (jwtService: JwtService, logger: Logger) =>
  (socket: SocketWithAuth, next) => {
    // for Postman testing support, fallback to token header
    const token =
      socket.handshake.auth.token || socket.handshake.headers['token'];

    logger.debug(`Validating auth token before connection: ${token}`);

    try {
      const payload = jwtService.verify(token);
      socket.userId = payload.sub;
      socket.arenaId = payload.arenaId;
      socket.name = payload.name;
      next(); // if user authoriazed go to next func in gateway or to next midleware if exsist
    } catch {
      next(new Error('FORBIDDEN'));
    }
  };
