import jwt from 'jsonwebtoken';
import redisClient from '../services/redis.service.js';


export const authUser = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        console.log("Token received:", token); // Debug log

        if (!token) {
            return res.status(401).send({ errors: "unauthorized User" });
        }

        const isBlackListed = await redisClient.get(token);

        if (isBlackListed) {

            res.cookie('token', '');
            console.error("Unauthorized User: Blacklisted token"); //--
            return res.status(401).send({errors:"Unauthorized User"});
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Token decoded:", decoded); // Debug log
        
        req.user = decoded;
        next();

    } catch (error) {
        res.status(401).send({errors:"unauthorized User"})
    }
}