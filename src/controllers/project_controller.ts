import { RequestHandler } from "express";
import { AppDataSource } from "../data_source";
import { Project } from "../entities/Project";
import { requestKeysAllowed, requiredKeysPresent, bodyIsEmpty } from "./utils/checkBody";

const projectRepository = AppDataSource.getRepository(Project);

const checkBodyValues = (body: Object): boolean => {
    for(const [key, value] of Object.entries(body)) {
        switch(key) {
            case "title":
                if(typeof value != "string" || value.length < 1) return false;
                break;

            case "description":
                if(value !== null && typeof value != "string") return false;
                break;
        }
    }

    return true;
}

const getAll: RequestHandler = async (req , res, next) => {

    try{
        const allProjects = await projectRepository.find();

        res.status(200)
            .json(allProjects);
        
    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }

    next();
}

const getById: RequestHandler = async (req, res, next) => {
    
    const id:number = parseInt(req.params.projectId);

    if(isNaN(id)) {
        res.status(400)
        res.json({
            message: "Unvalid id"
        });

        next();
        return;
    }

    try{
        const project = await projectRepository.findOne({
            where: {
                id: id
            },
            relations: {
                bugs: true
            }
        });

        if(project == null) {
            res.status(404).end();
            next();
            return;
        }

        res.status(200)
            .json(project);

    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }

    next();
}

const create: RequestHandler = async (req, res, next) => {

    const allowedKeys = ["title", "description"];
    const requiredKeys = ["title"];

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
        const createdProject = await projectRepository.create(req.body as Object);

        await projectRepository.save(createdProject);

        res.status(200)
            .json(createdProject);
    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }

    next();
}

const update: RequestHandler = async (req, res, next) => {
    const allowedKeys = ["title", "description"];

    const id:number = parseInt(req.params.projectId);

    if(isNaN(id)) {
        res.status(400)
        res.json({
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

    if(!requestKeysAllowed(req, allowedKeys)) {
        res.status(400)
            .json({
            message: "Some keys are not allowed."
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
        const project = await projectRepository.findOneBy({id: id});

        if(project == null) {
            res.status(404).end();
            next();
            return;
        }
        
        projectRepository.merge(project!, req.body);
        
        const result = await projectRepository.save(project);

        res.status(200).end();
    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }

    next();
}

const deleteProject: RequestHandler = async (req, res, next) => {
    const id:number = parseInt(req.params.projectId);

    if(isNaN(id)) {
        res.status(400)
        res.json({
            message: "Unvalid id"
        });

        next();
        return;
    }

    try{
        if(await projectRepository.findOneBy({id: id}) == null) {
            res.status(404).end();
            next();
            return;
        } 

        await projectRepository.delete(id);

        res.status(200).end();
    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }

    next();
}


const controller = {
    getAll,
    getById,
    create,
    update,
    deleteProject
}

export { controller as default };