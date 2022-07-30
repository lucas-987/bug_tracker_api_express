import express, { Express, Request, Response } from 'express';
import { AppDataSource } from './data_source';
import apiRoutes from './routes/api_routes';
import cors from 'cors';

const app: Express = express()
const port = 3000

const corsOptions = {
  origin: 'http://localhost'
}

AppDataSource.initialize()
    .then(() => {
        // here you can start to work with your database
        app.disable("etag")
        app.use(cors())
        app.use(express.json())

        app.get('/', (req: Request, res: Response) => {
          res.send('Express + TypeScript Server');
        });

        app.use('/api', apiRoutes);

        app.listen(port, () => {
          console.log(`Server is running at http://localhost:${port}`);
        });
    })
    .catch((error) => console.log(error));


