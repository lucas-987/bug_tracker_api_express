import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userRepository } from "../data_source";
import { bodyIsEmpty, requestKeysAllowed, requiredKeysPresent } from "./utils/checkBody";

const DEFAULT_JWT_EXPIRATION = '30d'
const generateJWToken = (data: Object, expiresIn: string = DEFAULT_JWT_EXPIRATION) => {

    if(process.env.JWT_SECRET == null) {
        throw new Error("JWT_SECRET missing in .env")
    }

    return jwt.sign(data, process.env.JWT_SECRET, {
      expiresIn,
    })
}

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
        return;
    }

    if(!requiredKeysPresent(req, requiredKeys) || !requestKeysAllowed(req, allowedKeys)) {
        res.status(400)
            .json({
                message: "Some keys are invalid or missing."
            });
        return;
    }

    if(! checkBodyValues(req.body)) {
        res.status(400)
            .json({
                message: "Some values are invalid."
            });
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
            return;
        }

        if(! await bcrypt.compare(req.body.password, user.passwordHash)) {
            res.status(400)
                .json({
                        message: "Wrong credentials."
                    });
            return;
        }

        res.status(200)
            .json({
                token: generateJWToken({ id: user.id })
            });

    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }
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
}

const getUserById: RequestHandler = async (req, res, next) => {
    const id:number = parseInt(req.params.id);

    if(isNaN(id)) {
        res.status(400)
            .json({
                message: "Unvalid id"
            });
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
}

const create: RequestHandler = async (req, res, next) => {
    const requiredKeys = ["email", "username", "password", "password2"];
    const allowedKeys = requiredKeys;

    if(bodyIsEmpty(req)) {
        res.status(400)
            .json({
                message: "Body missing."
            });
        return;
    }

    if(!requestKeysAllowed(req, allowedKeys) || !requiredKeysPresent(req, requiredKeys)) {
        res.status(400)
            .json({
                message: "Some keys are invalid or missing."
            });
        return;
    }

    if(! checkBodyValues(req.body)) {
        res.status(400)
            .json({
                message: "Some values are invalid."
            });
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
        return;
    }

    // we check that the request come from the user to be updated
    if(!("loggedUser" in req) || !("id" in (req as any).loggedUser) || (req as any).loggedUser.id != id) {
        res.status(401).end()
        return
    }

    if(bodyIsEmpty(req)) {
        res.status(400)
            .json({
                    message: "Body missing."
                });
        return;
    }
    if('password' in req.body || 'password2' in req.body) requiredKeys = ["password", "password2"] 

    if(!requestKeysAllowed(req, allowedKeys) || !requiredKeysPresent(req, requiredKeys)) {
        res.status(400)
            .json({
                message: "Some keys are not allowed or missing."
            });
        return;
    }

    if(! checkBodyValues(req.body)) {
        res.status(400)
            .json({
                message: "Some values are invalid."
            });
        return;
    }

    try{
        const user = await userRepository.findOneBy({id: id});

        if(user == null) {
            res.status(404).end();
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
}

const deleteUser: RequestHandler = async (req, res, next) => {
    const id:number = parseInt(req.params.id);

    if(isNaN(id)) {
        res.status(400)
            .json({
                message: "Unvalid id"
            });
        return;
    }

    // we check that the request come from the user to be deleted 
    if(!("loggedUser" in req) || !("id" in (req as any).loggedUser) || (req as any).loggedUser.id != id) {
        res.status(401).end()
        return
    }

    try{
        if(await userRepository.findOneBy({id: id}) == null) {
            res.status(404).end();
            return;
        } 

        await userRepository.delete(id);

        res.status(200).end();
    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }
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