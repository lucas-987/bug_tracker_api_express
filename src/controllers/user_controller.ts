import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { userRepository } from "../data_source";
import { bodyIsEmpty, requestKeysAllowed, requiredKeysPresent } from "./utils/checkBody";

const checkBodyValues = (body: Object): boolean => {
    for(const [key, value] of Object.entries(body)) {
        switch(key) {
            case "password":
                if(typeof value != "string" || value.length < 1) return false;
                break;

            case "password2":
                if(typeof value != "string" || value.length < 1) return false;
                if(!('password' in body) || (body as any).password !== value) return false;
                break;

            case "username":
                if(typeof value != "string" || value.length < 1) return false;
                break;
            
            case "email":
                if(typeof value != "string") return false;
                let emailRegex = /\S+@\S+\.\S+/;
                if(!emailRegex.test(value)) return false;
                break;
        }
    }

    return true;
}

const login: RequestHandler = async (req, res, next) => {
    const requiredKeys = ["email", "password"];
    const allowedKeys = requiredKeys;

    if(bodyIsEmpty(req)) {
        res.status(400)
            .json({
            message: "Body missing."
        });

        next();
        return;
    }

    if(!requiredKeysPresent(req, requiredKeys) || !requestKeysAllowed(req, allowedKeys)) {
        res.status(400)
            .json({
            message: "Some keys are invalid or missing."
        });

        next();
        return;
    }

    if(! checkBodyValues(req.body)) {
        res.status(400)
            .json({
            message: "Some values are invalid."
        });

        next();
        return;
    }

    try{
        const user = await userRepository.findOne({
            where: {
                email: req.body.email
            }
        });

        if(user == null) {
            res.status(404).end();
            next();
            return;
        }

        if(! await bcrypt.compare(req.body.password, user.passwordHash)) {
            res.status(400)
                .json({
                    message: "Wrong credentials."
                });

            next();
            return;
        }

        res.status(200)
            .json({
                message: `${user.id} logged in`
            });

    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }

    next();
}

const getAllUsers: RequestHandler = async (req, res, next) => {
    try{
        const allUsers = await userRepository.find();

        for(let user of allUsers) {
            delete (user as any).passwordHash
        }

        res.status(200)
            .json(allUsers);
        
    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }

    next();
}

const getUserById: RequestHandler = async (req, res, next) => {
    const id:number = parseInt(req.params.id);

    if(isNaN(id)) {
        res.status(400)
            .json({
            message: "Unvalid id"
        });

        next();
        return;
    }

    try{
        const user = await userRepository.findOne({
            where: {
                id: id
            }
        });

        if(user == null) {
            res.status(404).end();
            next();
            return;
        }

        delete (user as any).passwordHash

        res.status(200)
            .json(user);
    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }

    next();
}

const create: RequestHandler = async (req, res, next) => {
    const requiredKeys = ["email", "username", "password", "password2"];
    const allowedKeys = requiredKeys;

    if(bodyIsEmpty(req)) {
        res.status(400)
            .json({
            message: "Body missing."
        });

        next();
        return;
    }

    if(!requestKeysAllowed(req, allowedKeys) || !requiredKeysPresent(req, requiredKeys)) {
        res.status(400)
            .json({
            message: "Some keys are invalid or missing."
        });

        next();
        return;
    }

    if(! checkBodyValues(req.body)) {
        res.status(400)
            .json({
            message: "Some values are invalid."
        });

        next();
        return;
    }

    try{
        let bodyCopy = {...req.body}
        const salt = await bcrypt.genSalt(10)
        delete bodyCopy.password; delete bodyCopy.password2
        bodyCopy.passwordHash = await bcrypt.hash(req.body.password, salt)

        const createdUser = await userRepository.create(bodyCopy as Object);

        await userRepository.save(createdUser);

        delete (createdUser as any).passwordHash;

        res.status(200)
            .json(createdUser);
    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }

    next();
}

const update: RequestHandler = async (req, res, next) => {
    const allowedKeys = ["username", "email", "password", "password2"]
    let requiredKeys: string[] = [] // will eventually be redefined after checking that body is present

    const id:number = parseInt(req.params.id);

    if(isNaN(id)) {
        res.status(400)
            .json({
            message: "Unvalid id"
        });

        next();
        return;
    }

    if(bodyIsEmpty(req)) {
        res.status(400)
            .json({
                message: "Body missing."
            });

        next();
        return;
    }
    if('password' in req.body || 'password2' in req.body) requiredKeys = ["password", "password2"] 

    if(!requestKeysAllowed(req, allowedKeys) || !requiredKeysPresent(req, requiredKeys)) {
        res.status(400)
            .json({
            message: "Some keys are not allowed or missing."
        });

        next();
        return;
    }

    if(! checkBodyValues(req.body)) {
        res.status(400)
            .json({
            message: "Some values are invalid."
        });

        next();
        return;
    }

    try{
        const user = await userRepository.findOneBy({id: id});

        if(user == null) {
            res.status(404).end();
            next();
            return;
        }

        let bodyCopy = {...req.body}
        delete bodyCopy.password2
        if('password' in req.body) {
            delete bodyCopy.password

            const salt = await bcrypt.genSalt(10)
            bodyCopy.passwordHash = await bcrypt.hash(req.body.password, salt)
        }
        
        userRepository.merge(user!, bodyCopy);
        
        const result = await userRepository.save(user);
        delete (result as any).passwordHash;

        res.status(200)
            .json(result);
    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }

    next();
}

const deleteUser: RequestHandler = async (req, res, next) => {
    const id:number = parseInt(req.params.id);

    if(isNaN(id)) {
        res.status(400)
            .json({
            message: "Unvalid id"
        });

        next();
        return;
    }

    try{
        if(await userRepository.findOneBy({id: id}) == null) {
            res.status(404).end();
            next();
            return;
        } 

        await userRepository.delete(id);

        res.status(200).end();
    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }

    next();
}

const controller = {
    login,
    getUserById,
    getAllUsers,
    create,
    update,
    deleteUser
}

export default controller