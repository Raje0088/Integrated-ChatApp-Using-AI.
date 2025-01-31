import 'dotenv/config.js'
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import { generateResult } from './services/ai.service.js';

const port = process.env.PORT || 3000;


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];

        const projectId = socket.handshake.query.projectId;

        console.log('Middleware: token:', token);
        console.log('Middleware: projectId:', projectId);

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('ram ram Invalid projectId'));
        }
        // =====================================================================
        // Fetch the project and assign it to the socket
        const project = await projectModel.findById(projectId).lean();
        if (!project) {
            return next(new Error('Project not found'));
        }
        socket.project = project;
        console.log('Assigned project to socket -> socket.project :-', socket.project);
        // =====================================================================

        // socket.project = await projectModel.findById(projectId);
        // console.log('Assigned project to socket:', socket.project);

        // console.log("token is : ",token);
        if (!token) {
            return next(new Error('authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return next(new Error('Authentication error'));
        }

        socket.user = decoded;

        next();

    } catch (error) {
        console.error('Middleware Error:', error);
        next(error);
    }
})

io.on('connection', socket => {
    socket.roomId = socket.project._id.toString();
    console.log('a user connected');

    // if (!socket.project) {
    //     console.error('No project assigned to the socket');
    //     socket.emit('error', 'No project assigned');
    //     socket.disconnect(); // Disconnect the client if no project is assigned
    //     return;
    // }
    // Join the room associated with the project
    // const roomId = socket.project._id.toString();
    socket.join(socket.roomId);

    console.log('Socket joined room:', socket.roomId);


    // socket.join(socket.project._id);
    // console.log('socket.projectId', socket.project._id);

    socket.on('project-message', async (data) => {

        console.log('Received project-message from server.js:', data);
        // console.log('socket.project:', socket.project); // Add logging


        // io.to(socket.roomId).emit('project-message', data);

        const message = data.message;

        const aiIsPresentInMessage = message.includes('@ai');

        socket.broadcast.to(socket.roomId).emit('project-message', data)

        if (aiIsPresentInMessage) {
            const prompt = message.replace('@ai', '');

            const result = await generateResult(prompt);

            io.to(socket.roomId).emit('project-message', {
                message: result,
                sender: {
                    _id: "ai",
                    email: "AI",
                }
            })

            return;
        }

        // socket.broadcast.to(socket.project._id).emit('project-message', data);

    })
    console.log('we are here');

    socket.on('event', (data) => {
        /* … */
        console.log("Received event:", data);
    });
    socket.on('disconnect', () => {
        /* … */
        console.log("A user Disconnected");
        socket.leave(socket.roomId);

    });
});



server.listen(port, () => {
    console.log(`server is running on port ${port}`);
})