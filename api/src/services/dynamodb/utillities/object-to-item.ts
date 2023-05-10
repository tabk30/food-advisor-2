export function objecToItem(_o: any) {
    let result = { ..._o };
    for (let key in result) {
        if (result.hasOwnProperty(key)) {
            console.log("result", result[key]);
            switch (typeof result[key]) {
                case "string":
                    result[key] = { S: result[key] };
                    break;
                case "boolean":
                    result[key] = { B: result[key] };
                    break;
                case "bigint":
                case "number":
                    result[key] = { N: `${result[key]}` };
                    break;
                case "object": 
                    result[key] = { M: objecToItem(result[key]) };
                    break;
                default: 
                    throw Error("Cannot convert to Item!");
            }
        }
    }
    console.log("objecToItem", result)
    return result;
}