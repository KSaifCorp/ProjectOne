import * as bodyParser from 'body-parser'
import cors = require('cors');
import * as express from 'express'
import * as logger from 'morgan'
import { AuthApi } from "./routes/auth.api";


class App {

    public app: express.Application;

    constructor() {
        this.app = express();

        // Enable CORS
        this.app.use(cors());

        this.middleware();
        this.routes();
    }

    private middleware(): void {
        this.app.use(logger("dev"));
        this.app.use(bodyParser.json({ limit: '15mb', type: 'application/json' }));
        this.app.use(bodyParser.urlencoded({ extended: false }))
    }

    private routes(): void {

        // Auth
        // @ts-ignore
        this.app.use("/auth", AuthApi)
    }
}

export default new App().app
