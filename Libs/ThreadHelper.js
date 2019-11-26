"use strict";

// Allows THREADED code to execute using eval and workers.
//Note: After adding functions to the thread. Call prepare 
//(or compile, both are the same) before running functions.
function Thread()
{
    this.worker = undefined;
    this.listeners = undefined;
    this.sourceString = 
    `'use strict';
let __FUNCTIONS__ = { };

self.addEventListener("message", function(event)
{
    const data = event.data;
    const args = data.args; // Format: [functionName, listenerId, args]
    const functionName = data.functionName || data.toFn;
    
    console.assert(functionName in __FUNCTIONS__);
    
    const listenerId = data.listenerId || data.fromId;
    let argsToSupply = data.args;
    const functionToCall = __FUNCTIONS__[functionName];
    
    // TODO Combine postError and po
    
    // Replies with an error/success..
    const postResult = function(type, args)
    {
        var toSend = { type: type, toId: listenerId, fromFunction: functionName + "", args: (args || ""), serializedArgs: false };
        
        try
        {
            self.postMessage(toSend);
        }
        catch(e)
        {
            toSend.args = SerializationHelper.serializeObject(args);
            toSend.serializedArgs = true;
            
            self.postMessage(toSend);
        }
    };
    
    // Convienence methods.
    const postSuccess = (args) => postResult("SUCCESS", args);
    const postError = (args) => 
    {
        console.error(args);
        
        return postResult("ERROR", args);
    };
    
    // If the arguments were serialized,
    if (data.argsSerialized)
    {
        // Check for the serialization library.
        try
        {
            console.assert(SerializationHelper.inflateObject != null);
        }
        catch(e)
        {
            // Note the error.
            postError("SerializationHelper must be linked to this thread, to allow processing of one or more of the given arguments.");
            
            return; // Stop.
        }
        
        argsToSupply = [];
        
        // Unserialize.
        for (var i = 0; i < args.length; i++)
        {
            argsToSupply.push(SerializationHelper.inflateObject(args[i]));
        }
    }
    
    // All registered functions MUST return promises.
    functionToCall.apply(self, argsToSupply).then((...responseArgs) =>
    {
        if (responseArgs.length === 1)
        {
            responseArgs = responseArgs[0];
        }
    
        postSuccess(responseArgs);
    }).catch((...errorArgs) =>
    {
        if (errorArgs.length === 1)
        {
            errorArgs = errorArgs[0];
        }
    
        postError(errorArgs);
    });
});
        

    `;

    var me = this; // Keeps a refrence to original context.

    var loadFromSource = function(source)
    {
        // Add libraries to 
    
        // See https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#Transferring_data_to_and_from_workers_further_details
        //and https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob.
        var blob = new Blob([source], { type: "text/javascript" });
        var scriptURL = URL.createObjectURL(blob);
        
        // If the worker already exists, 
        //terminate it.
        if (me.worker)
        {
            me.worker.terminate();
        }
        
        // Make the worker.
        me.worker = new Worker(scriptURL);
    };
    
    // The key is the function name. The argumentsList variable
    //is either an array of argument names or a string of comma-separated values.
    //All given functions are async.
    this.putFunction = function(key, argumentsList, source)
    {
        if (!(typeof (argumentsList) === "string"))
        {
            argumentsList = (argumentsList || []).join(", ");
        }
        
        if (typeof source === "function")
        {
            let sourceString = source.toString();
            
            source = 
            `
return (${ sourceString }).apply(this, [${ argumentsList }]);
            `;
        }
        
        this.sourceString += `

// Register the function ${key} with those that can be called.
__FUNCTIONS__["${ key }"] = (async (${ argumentsList }) => 
{
    ${ source }
});`;
    };
    
    // Put an object library, like Mat44Helper,
    //or Mat into the thread. Be sure to include
    //ALL OF THE LIBRARY's DEPENDENCIES! This does
    //not work for libraries that depend on the DOM.
    //DANGER: Usage of this method can lead to broken
    //code.
    // Library methods/classes are only accessible by
    //functions placed using putFunction or other libraries
    //(you can't call Mat44Helper.<something> using 
    //Thread.callFunction).
    this.putLibrary = function(libContents, libName)
    {
        var stringContents = libContents.toString();
        
        // If the object was only converted to [object Object],
        //try converting it key by key.
        if (stringContents === "[object Object]")
        {
            stringContents = "let " + libName + " = " + SerializationHelper.stringifyFull(libContents) + ";";
        }
        
        this.sourceString += `
// Imported library.
${ stringContents }
        `;
    };
    
    // This MUST be called before useage of functions.
    this.prepare = function()
    {
        loadFromSource(this.sourceString);
        
        // List of listeners.
        this.listeners = {};
        
        // Keep a refrence to the original context.
        //Added before the use of "me" was found to
        //be necessary.
        var thread = this;
        
        // When a message is sent from the worker,
        this.worker.onmessage = function(event)
        {
            // Find the listener...
            const data = event.data;
            
            // Make sure the listener actually exists...
            console.assert(data.fromFunction in thread.listeners);
            
            let listeners = thread.listeners[data.fromFunction];
            
            // Make sure the listener still exists...
            console.assert(data.toId in listeners);
            
            // Send data to that listener.
            let listener = listeners[data.toId];
            
            let args = data.args;
            
            // If the arguments were serialized, inflate them.
            if (data.serializedArgs)
            {
                args = SerializationHelper.inflateObject(args);
            }
            
            // Notify the listener.
            if (data.type === "ERROR")
            {
                listener.onError(args);
            }
            else
            {
                listener.onComplete(args);
            }
            
            // Remove the listener.
            delete listeners[data.toId];
        };
    };
    
    this.compile = this.prepare; // Link names.
    
    // Returns a promise. Note that args are COPIED
    //before transmission to the thread. If errors
    //occur in transmission of arguments on function
    //calling, try linking the SerializationHelper
    //library.
    this.callFunction = function(fnName, args)
    {
        // So long as the worker to be
        //used exists,
        if (this.worker === undefined)
        {
            throw "This thread must be compiled before it can be run!";
        }
        
        var thread = this; // Keep a refrence to
                           //the calling context.
        return new Promise((accept, reject) =>
        {
            // Create the listeners list, if necessary.
            if (!thread.listeners[fnName])
            {
                thread.listeners[fnName] = {};
            }
            
            // Create a unique listener id.
            const listenerId = (new Date()).getTime();
            
            // Create the message.
            let message = { toFn: fnName, listenerId: listenerId, args: args, argsSerialized: false };
            
            // Post the message.
            try
            {
                thread.worker.postMessage(message);
            }
            catch(exception) // An argument may have been unportable!
            {                //Try to force it.
                            // This will fail if SerializationHelper has
                            //not been linked to the thread.
                if (args) // Only try if args exists.
                {
                    let serializedArgs = [];
                    
                    // Serialize the arguments.
                    for (var i = 0; i < args.length; i++)
                    {
                        serializedArgs.push(SerializationHelper.serializeObject(args[i]));
                    }
                
                    // Change the arguments.
                    message.argsSerialized = true;
                    message.args = serializedArgs;
                
                    // Try to post the message again.
                    thread.worker.postMessage(message);
                }
                else
                {
                    throw exception;
                }
            }
            
            // Set listener properties.
            thread.listeners[fnName][listenerId] = 
            {
                onError: (reason) =>
                {
                    reject(reason);
                },
                onComplete: (args) =>
                {
                    accept(args);
                }
            };
        });
    };
    
    // Get another thread with
    //the same functions.
    this.copy = function()
    {
        var other = new Thread();
        
        other.sourceString = me.sourceString;
        
        if (me.worker)
        {
            other.compile();
        }
        
        return other;
    };
}

var ThreadHelper = {};
ThreadHelper.threadSafeLibraries = {}; // Library names as keys and refrences to the libraries as values.
ThreadHelper.mustAddThreadSafeLibraries = true;

// Make a thread linked with thread-safe libraries.
ThreadHelper.makeLibLinkedThread = function()
{
    // ThreadSafeLibraries is not immediately initialized
    //to prevent refrence errors.
    if (ThreadHelper.mustAddThreadSafeLibraries)
    {
        ThreadHelper.threadSafeLibraries =
        {"Mat": Mat, "Mat44": Mat44, "MatHelper": MatHelper, "Mat44Helper": Mat44Helper, "Point": Point, "Vector3": Vector3, "ModelHelper": ModelHelper, "JSHelper": JSHelper, "ArrayHelper": ArrayHelper,
        "SerializationHelper": SerializationHelper }; 
        
        ThreadHelper.mustAddThreadSafeLibraries = false;
    }
    
    var thread;
    
    // If a library-linked thread already exists,
    //just copy it.
    if (ThreadHelper.__libLinkedThread)
    {
        thread = ThreadHelper.__libLinkedThread.copy();
    }
    else
    {
        var thread = new Thread();
        
        // Otherwise, link it.
        for (var i in ThreadHelper.threadSafeLibraries)
        {
            thread.putLibrary(ThreadHelper.threadSafeLibraries[i], i);
        }
        
        // Make a copy of the thread...
        ThreadHelper.__libLinkedThread = thread.copy();
    }
    
    return thread;
};

// Runs a quick test of the ThreadHelper utility.
ThreadHelper.test = function()
{
    console.log("Testing ThreadHelper...");
    
    var t = ThreadHelper.makeLibLinkedThread();
    t.putFunction("computeVerticies", ["verticies", "startAngle", "endAngle",  "divisions"], ModelHelper.silhouetteToVerticies);
    
    t.compile();
    
    t.callFunction("computeVerticies", [[new Point(0, 0), new Point(1, 1), new Point(3, 3)], 0, Math.PI, 8]).then(result => console.log(result));
    
    return true;
};
