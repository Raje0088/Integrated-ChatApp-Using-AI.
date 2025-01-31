import userModel from '../models/user.model.js';
import * as userService from '../services/user.service.js';
import { validationResult } from 'express-validator';
import redisClient from '../services/redis.service.js';

export const createUserController = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    try {
        const user = await userService.createUser(req.body);

        const token = await user.generateJWT();

        delete user._doc.password;

        res.status(201).json({ user, token });

    } catch (error) {
        res.status(400).send(error.message);
    }
}

export const loginUserController = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ errors: "Invalid credentials" });
        }

        const isMatch = await user.isValidPassword(password);

        if (!isMatch) {
            return res.status(401).json({ errors: "Invalid credentials" });
        }

        const token = await user.generateJWT();
        delete user._doc.password;
        return res.status(200).json({ user, token });

    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }
}

export const profileController = async (req, res) => {

    console.log(req.user);

    res.status(200).json({
        user: req.user
    });
}

export const logoutController = async (req, res) => {
    try {
        const token = req.cookies.token || req.headers.authorization.split(' ')[1];

        redisClient.set(token, "logout", 'EX', 60 * 60 * 24);

        res.status(200).send("Logged out successfully");

    } catch (err) {
        res.status(400).send(err.message);
    }
}

export const getAllUsersController = async (req, res) => {
    console.log("GET /users/all endpoint reached"); // Debug log
    try {
        console.log("Incoming request to get all users for:", req.user.email); //--

        const loggedInUser = await userModel.findOne({ email: req.user.email });
        console.log("Logged-in user:", loggedInUser);//--

        // Ensure the logged-in user exists // --- complete --
        if (!loggedInUser) {
            console.error("User not found for email:", req.user.email);
            return res.status(404).json({ errors: "User not found" });
        }

        const allUsers = await userService.getAllUsers({ userId: loggedInUser._id });
        console.log("All users fetched (excluding logged-in user):", allUsers);//---

        return res.status(200).json({
            users: allUsers
        })

    } catch (err) {
        console.log(err);

        res.status(400).json({ errors: err.message })

    }
}