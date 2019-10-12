import * as http from 'http'
import * as debug from 'debug'

import App from './app'

const PORT = process.argv[3] || 3002;

debug('ts-express:server');

const port = normalizePort(PORT);
App.set('port', port);

const server = http.createServer(App);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val: number | string): number | string | boolean {
    let portValue: number = (typeof val === 'string') ? parseInt(val, 10) : val;
    if (isNaN(portValue)) {
        return val
    } else if (portValue >= 0) {
        return portValue
    } else {
        return false
    }
}

function onError(error: NodeJS.ErrnoException): void {
    if (error.syscall !== 'listen') { throw error }
    let bind = (typeof port === 'string') ? 'Pipe ' + port : 'Port ' + port;
    switch (error.code) {
        case 'EACCESS':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error
    }
}


function onListening(): void {
    let addr = server.address();
    let bind = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`;
    debug(`Listening on ${bind}`)
}
