import express from "express";
import UsersControllers from "../controllers/users.js";

const router = express.Router();

const usersController = new UsersControllers();

router.get("/", usersController.getUsers);

router.delete("/:id", usersController.deleteUser);

router.put("/:id", usersController.updateUser);

export default router;
