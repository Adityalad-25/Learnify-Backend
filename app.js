import express from 'express';
import {config} from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// configure dotenv
config({
    path: "./config/config.env",
});
const app = express();

// using middleware express.json express.urlencoded cookieParser cors ErrorMiddleware

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true,
    methods:["GET" , "PUT" , "POST" , "DELETE" ],
}));


// importing and using  routes 
 import course from './routes/courseRoutes.js';
 import user from './routes/userRoutes.js';
 import ErrorMiddleware from './middlewares/Error.js';
 import payment from './routes/paymentRoutes.js';
 import other from './routes/otherRoutes.js';

  app.use('/api/v1', course);
  app.use('/api/v1', user);
  app.use('/api/v1', payment);
  app.use('/api/v1', other);


  app.get("/", (req, res) => {
    res.send(
      `<h1>Server is Working : click <a href=${process.env.FRONTEND_URL}>Here </a> to Visit Frontend</h1>`
    );
  });
  



export default app;

app.use(ErrorMiddleware);