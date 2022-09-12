import { RequestHandler } from "express";
import { AppDataSource } from "../data_source";
import { Bug, BugStatus, bugStatusValues } from "../entities/Bug";
import { Project } from "../entities/Project";
import { requestKeysAllowed, requiredKeysPresent, bodyIsEmpty } from "./utils/checkBody";
import { convertStringToDate, isISOStringDate } from "./utils/dateTools";

const projectRepository = AppDataSource.getRepository(Project);
const bugRepository = AppDataSource.getRepository(Bug);

const dateKeys = ["due_date", "end_date"]; 

const checkBodyValues = (body: Object): boolean => {
    for(const [key, value] of Object.entries(body)) {
        switch(key) {
            case "title":
                if(typeof value != "string" || value.length < 1) return false;
                break;

            case "description":
                if(value !== null && typeof value != "string") return false;
                break;

            case "priority":
                if(typeof value != "number" && !Number.isInteger(value)) return false;
                break;

            case "status":
                if(typeof value != "string" || !bugStatusValues.includes(value))
                    return false;
                break;
                
            case "due_date":
            case "end_date":  
                if(value != null && (typeof value != "string" || ! isISOStringDate(value as string)))
                    return false;
                break; 
        }
    }

    return true;
}

const getAllBugsByProject: RequestHandler = async (req, res, next) => {
    const projectId:number = parseInt(req.params.projectId);

    if(isNaN(projectId)) {
        res.status(400)
        res.json({
            message: "Unvalid projectId"
        });

        next();
        return;
    }

    try{
        const project = await projectRepository.findOne({
            where:{
                id: projectId
            },
            relations: {
                bugs: true
            }
        })

        if(project == null) {
            res.status(404).end();
            next();
            return;
        }

        res.status(200)
            .json(project.bugs);

    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }

    next();
}

const getById: RequestHandler = async (req, res, next) => {
    const bugId:number = parseInt(req.params.bugId);

    if(isNaN(bugId)) {
        res.status(400)
        res.json({
            message: "Unvalid id"
        });

        next();
        return;
    }

    try{
        const bug = await bugRepository.findOneBy({ id: bugId });

        if(bug == null) {
            res.status(404).end();
            next();
            return;
        }

        res.status(200)
            .json(bug);

    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }

    next();
}

const create: RequestHandler = async (req, res, next) => {
    const projectId:number = parseInt(req.params.projectId);
    const allowedKeys = ["title", "description", "priority", "status", "due_date"];
    const requiredKeys = ["title"];

    if(isNaN(projectId)) {
        res.status(400)
        res.json({
            message: "Unvalid projectId"
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
        const bugValues = convertStringToDate(req.body as Object, dateKeys);

        const project = await projectRepository.findOne({
            where:{
                id: projectId
            },
            relations: {
                bugs: true
            }
        })

        if(project == null) {
            res.status(404).end();
            next();
            return;
        }

        const bug = await bugRepository.create(bugValues);

        bugRepository.merge(bug, {project: project});

        await bugRepository.save(bug);

        bug.project.bugs = [];
        res.status(200)
            .json(bug);
    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }

    next();
}

const update: RequestHandler = async (req, res, next) => {
    const id:number = parseInt(req.params.bugId);
    const allowedKeys = ["title", "description", "priority", "status", "due_date", "end_date"];

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
        const bugValues = convertStringToDate(req.body as Object, dateKeys);

        const bug = await bugRepository.findOneBy({ id: id });

        if(bug == null) {
            res.status(404).end();
            next();
            return;
        }

        bugRepository.merge(bug, bugValues);

        const result = await bugRepository.save(bug);

        res.status(200)
            .json(result);
    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }

    next();    
}

const deleteBug: RequestHandler = async (req, res, next) => {
    const id:number = parseInt(req.params.bugId);

    if(isNaN(id)) {
        res.status(400)
        res.json({
            message: "Unvalid id"
        });

        next();
        return;
    }

    try{

        if(await bugRepository.findOneBy({id: id}) == null) {
            res.status(404).end();
            next();
            return;
        } 

        await bugRepository.delete(id);

        res.status(200).end();
    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }

    next();
}

const controller = {
    getAllBugsByProject,
    getById,
    create,
    update,
    deleteBug
}

export { controller as default };