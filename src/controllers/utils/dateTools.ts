
const isISOStringDate = (dateString: string): boolean => {
    let date = new Date(dateString);        
    if(date.toString() === "Invalid Date") return false;    
    if(date.toISOString() !== dateString) return false;
    
    return true;
}

const dateStringsAreValid = (body: Object, datesKeys: string[]): Boolean => {
    for(let [key, value] of Object.entries(body)) {
        if(datesKeys.includes(key)) {
            if(typeof value != "string" || ! isISOStringDate(value as string)) 
                return false;
        }
    }

    return true;
}

const convertStringToDate = (body: Object, datesKeys: string[]): Object => {
    const result = Object.assign({}, body); // see this thread on stackoverflow https://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object

    for(let [key, value] of Object.entries(result)) {
        if(datesKeys.includes(key) && value !== null) {
            result[key as keyof Object] = new Date(value) as any;
        }
    }

    return result;
}

export { isISOStringDate, convertStringToDate, dateStringsAreValid }