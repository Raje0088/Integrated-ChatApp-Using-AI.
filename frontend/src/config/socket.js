import  socket  from 'socket.io-client';

let socketInstance = null;

export const initializeSocket = (projectId) => {
    
    const token = localStorage.getItem('token');
    console.log('token in auth sockeInstance is ', token);
    console.log('Initializing socket with projectId:', projectId);

    socketInstance = socket(import.meta.env.VITE_API_URL, {
        auth: {
            token: token
        },
        query: {
            projectId:projectId
        }
    });
    console.log("token in auth socketInstance", token)
    console.log("projectId in auth socketInstance", projectId)
    console.log("socketInstance will be ",socketInstance)

        // Add event listeners for debugging connection status
        socketInstance.on('connect', () => {
            console.log('Connected to WebSocket server');
        });
    
        socketInstance.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            console.error('Socket connection error details:', err.message, err.stack);
        });
    
        socketInstance.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });
    

    return socketInstance;
}

export const receiveMessage = (eventName, cb) => {
    if (socketInstance) {
        socketInstance.on(eventName, cb);
    } else {
        console.log("Socket instance is not initialized.")
    }
}

export const sendMessage = (eventName, data) => { 
   
    if (socketInstance) {
        socketInstance.emit(eventName, data);
    } else {
        console.log("Socket instance is not initialized.")
    }
}

// import { io } from 'socket.io-client';

// let socketInstance = null;

// export const initializeSocket = (projectId) => {
//     socketInstance = io(import.meta.env.VITE_API_URL, {
//         auth: {
//             token: localStorage.getItem('token')
//         },
//         query: {
//             projectId
//         }
//     });

//     return socketInstance;
// }

// export const receiveMessage = (eventName, cb) => {
//     if (socketInstance) {
//         socketInstance.on(eventName, cb);
//     } else {
//         console.error('Socket instance is not initialized.');
//     }
// }

// export const sendMessage = (eventName, data) => {
//     if (socketInstance) {
//         socketInstance.emit(eventName, data);
//     } else {
//         console.error('Socket instance is not initialized.');
//     }
// }
