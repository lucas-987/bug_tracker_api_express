import { Request } from "express"

const bodyIsEmpty = (req: Request): boolean => {
    if( Object.keys(req.body).length === 0 && req.body.constructor === Object)
        return true;

    return false;
}

/*
 * This function checks that all keys within the request body 
 * belongs to the allowedKeys
*/
const requestKeysAllowed = (req: Request, allowedKeys: string[]): boolean => {
    for(const requestKey of Object.keys(req.body)) {
        if(! allowedKeys.includes(requestKey)) return false;
    }

    return true;
}

/*
 * This function checks that all the keys specified in requiredKeys are present 
 * in the request body
*/
const requiredKeysPresent = (req: Request, requiredKeys: string[]): boolean => {
    for (const key of requiredKeys) {
        if(! req.body.hasOwnProperty(key)) return false;
    }

    return true;
}

export {requestKeysAllowed, requiredKeysPresent, bodyIsEmpty};