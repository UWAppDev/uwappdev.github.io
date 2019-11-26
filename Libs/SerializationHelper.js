"use strict";

var SerializationHelper = {};

// Note: This returns a JavaScript dictionary
//that should be safe to call JSON.stringify on.
SerializationHelper.serializeObject = function(obj)
{
    let objectType = typeof (obj);
    let result = {};
    
    // No serialization necessary.
    if (obj == undefined || objectType === "string" || objectType === "number" || objectType === "boolean")
    {
        result = { object: obj, type: objectType };
    }
    
    // Serialize using a declared method.
    else if (obj.serialize && (obj.deserialize || obj.unserialize) && obj.constructor)
    {
        result = { object: obj.serialize(), type: "OWN_SERIALIZED", constructorName: obj.constructor.name };
    }
    // Otherwise,
    //check for toString/fromString methods.
    else if (obj.toString && obj.fromString && obj.constructor)
    {
        result = { object: obj.toString(), constructorName: obj.constructor.name, type: "TO_STRING_SERIALIZED" };
    } // Otherwise, try to recover properties of the object for serialization.
    else // A last-resort, not-guaranteed-to-work method.
    {
        // Extracts properties from the result, excluding functions.
        var extractProperties = function(object)
        {
            var result = {};
            var excludeType = "function";
            
            var current;
            for (var key in object)
            {
                current = object[key];
                
                // Don't include these keys (which shouldn't 
                //be included in a for/in loop anyway).
                if (key === "__proto__" || key === "prototype"
                    || key === "constructor")
                {
                    continue;
                }
            
                if (typeof (current) === "object")
                {
                    result[key] = extractProperties(current);
                }
                else if (typeof (current) !== excludeType)
                {
                    result[key] = current;
                }
            }
            
            return result;
        };
        
        var serializedVersion = extractProperties(obj);
        
        let constructorName = (obj.constructor ? obj.constructor.name : null);
        
        result = 
        { 
            object: serializedVersion, 
            constructorName: constructorName, 
            type: "EXTRACTED_PROPERTIES" 
        };
    }
    
    return result;
};

// Deserialize an object from a given serialized state.
//This must have been serialized using serializeObject.
//This can be dangerous if the serialized data specifies
//a constructorName it may construct a type of ANY OBJECT
//in the global domain.
SerializationHelper.inflateObject = function(serializationData)
{
    const serializationType = serializationData.type;
        
    let result = {};
    let object = serializationData.object;
    
    const constructorName = serializationData.constructorName;
        
    // If the constructor is present...
    if (constructorName && (self || window)[constructorName] && typeof ((self || window)[constructorName]) === "function")
    {
        try
        {
            result = new (self || window)[constructorName](); 
        }
        catch(e)
        {
            console.warn("Nonfatal. Unable to construct object from constructor " + constructorName + ". Error: " + e);
        }
    }
    
    // If the properties were extracted,
    if (serializationType === "EXTRACTED_PROPERTIES")
    {
        let properties = object;
        
        // Copy the set properties.
        for (var key in properties)
        {
            result[key] = properties[key];
        }
    }
    else if (serializationType === "TO_STRING_SERIALIZED")
    {
        console.assert(result.fromString != null); // Ensure the result can be
                                                   //created from a string.
        
        result = result.fromString();
    }
    else if (serializationType === "OWN_SERIALIZED")
    {
        let deserialize = (obj.deserialize || obj.unserialize || obj.inflate);
        
        console.assert(deserialize != null);
        
        result = deserialize(result);
    }
    else
    {
        result = object; // TODO Different handling for different serialized types here.
    }
    
    return result;
};

// Like JSON.stringify, but also converts functions to source.
SerializationHelper.stringifyFull = function(part, maxDepth, currentDepth)
{
    var result = "{ ";
    var currentPart = "";
    
    maxDepth = maxDepth || 25;
    
    let depth = currentDepth || 0;
    
    // Don't recurse more than 20 levels deep.
    if (depth > 20)
    {
        return result + "}";
    }
    
    var resultParts = [];
    
    for (var key in part)
    {
        currentPart = key + ": ";
    
        if (typeof (part[key]) != "object" && part[key] && part[key].toString)
        {
            currentPart += part[key].toString();
        }
        else if (typeof (part[key]) == "object")
        {
            currentPart += SerializationHelper.stringifyFull(part[key], maxDepth, depth + 1);
        }
        else
        {
            currentPart += part[key] + "";
        }
        
        resultParts.push(currentPart);
    }
    
    result = result + resultParts.join(", ") + " }";
    
    return result;
};


