"use strict";

var JSHelper = {};

// Get a random array that represents a color.
//Arguments after round are interpreted as the minimum
//and maximum values of each component. Round stores
//whether to round.
// TODO Add a method to get a random color string.
JSHelper.getRandomColorArray = function(round)
{
    var result = [];
    var impliedMin, impliedMax;
    
    var generateComponent = function(min, max)
    {
        var component = Math.random() * (max - min) + min;
        
        if (round)
        {
            Math.floor(component);
        }
        
        return component;
    };
    
    // For all arguments following the first,
    for (var i = 1; i < arguments.length - 1; i += 2)
    {
        result.push(generateComponent(arguments[i], arguments[i + 1]));
    }
    
    if (round)
    {
        impliedMin = 0;
        impliedMax = 256;
    }
    else
    {
        impliedMin = 0.0;
        impliedMax = 1.0;
    }
    
    while (result.length < 3)
    {
        result.push(generateComponent(impliedMin, impliedMax));
    }
    
    return result;
};

// Get an array of random colors.
JSHelper.getArrayOfRandomColors = (count, round, numComponents, ...componentRanges) =>
{
    let result = [], currentColor, colorComponentIndex;

    numComponents = numComponents || 4;

    for (let index = 0; index < count; index++)
    {
        currentColor = JSHelper.getRandomColorArray.apply(this, [round].concat(componentRanges));
        
        
        for (colorComponentIndex = 0; colorComponentIndex < currentColor.length && colorComponentIndex < numComponents; colorComponentIndex++)
        {
            result.push(currentColor[colorComponentIndex]);
        }
    }

    return result;
};

// TODO Transition to vec4s.
JSHelper.colorMap =
{
    "red": [255, 0, 0],
    "green": [0, 255, 0],
    "blue": [0, 0, 255],
    "black": [0, 0, 0],
    "white": [255, 255, 255],
    "purple": [200, 0, 255],
    "magenta": [255, 0, 255],
    "yellow": [255, 255, 0],
    "gray": [100, 100, 100],
    "pink": [255, 200, 100],
    "brown": [140, 120, 150],
    "orange": [200, 150, 100]
};

// Converts an HTML-based color into a vec4.
//Each component ranges from zero to one.
JSHelper.colorToVector = (htmlColor) =>
{
    let result = new Vector3(0, 0, 0);
    
    // Check is it in hex?
    if (htmlColor.indexOf("#") == 0 && htmlColor.length === 7)
    {
        // Parse the hex.
        result.x = MathHelper.forceParseInt(htmlColor.substring(1, 3), 16);
        result.y = MathHelper.forceParseInt(htmlColor.substring(3, 5), 16);
        result.z = MathHelper.forceParseInt(htmlColor.substr(5), 16);
    }
    else if (htmlColor.indexOf("rgba") == 0 && htmlColor.indexOf("(") > 0)
    {
        // Parse rgba.
        htmlColor = htmlColor.substring(htmlColor.indexOf("(") + 1, htmlColor.length - 1);
        
        // Remove all spaces.
        htmlColor = htmlColor.replace(/\s/g, "");
        
        let parts = htmlColor.split(",");
        
        // RGBA must have red, green, blue, and alpha.
        if (parts.length < 3)
        {
            return result;
        }
        
        // Store the parts.
        result.x = MathHelper.forceParseInt(parts[0]);
        result.y = MathHelper.forceParseInt(parts[1]);
        result.z = MathHelper.forceParseInt(parts[2]);
        result.w = MathHelper.forceParseFloat(parts[3]);
    }
    else if (htmlColor in JSHelper.colorMap)
    {
        result.fromArray(JSHelper.colorMap[htmlColor]);
    }
    
    // Return
    return result;
};

// Converts a three-component input vector
//into an HTML-formatted string. By default,
//it is assumed that this vector's three
//components range from zero to one. If not,
//set componentMax to 255 or another, similar
//value. Alpha is an optional value from
//zero to one, representing the alpha channel
//desired in the resultant color.
JSHelper.vec3ToRGBString = (inputVector, 
                            componentMax,
                            alpha) =>
{
    // Transform from [0, 1]
    //to [0, 256).
    let transformedCopy = inputVector.mulScalar
                                (1 / (componentMax || 1) * 255);
    
    // Values in rgba(...) format should be bytes,
    //not floats.
    transformedCopy.x = Math.floor(transformedCopy.x);
    transformedCopy.y = Math.floor(transformedCopy.y);
    transformedCopy.z = Math.floor(transformedCopy.z);
    
    // Why break `result = ...` into two lines?
    //Hopefully, it makes it less breakable.
    let result = "rgba(" + transformedCopy.x
                 + ", " + transformedCopy.y + ", " + 
                 transformedCopy.z + ", " + (alpha || 1.0) + ")";
                 
    return result;
};

// Add browser-compatable pointer events to an element.
JSHelper.Events = {};

JSHelper.Events.getSupportsPointerEvents = function()
{
    if (JSHelper.Events.supportsPointerEvents !== undefined)
    {
        return JSHelper.Events.supportsPointerEvents;
    }
    
    let testElement = document.createElement("div");
    
    // This should be null if the client's browser supports
    //pointer events.
    JSHelper.Events.supportsPointerEvents = testElement.onpointerdown === null;
    
    return JSHelper.Events.supportsPointerEvents;
};

// Mouse and touch events work much better in Safari (or seem to).
JSHelper.Events.useLegacyEvents = true;

// Whether events should be paused.
JSHelper.Events.paused = false;

// Pause/play pointer events.
JSHelper.Events.setPaused = function(paused)
{
    JSHelper.Events.paused = paused;
};

// Note: The event name should not include "pointer" or "touch" or "mouse."
//It should be up, down, move, or stop.
JSHelper.Events.registerPointerEvent = function(eventName, target, onEvent, allowBubbling)
{
    allowBubbling = allowBubbling === undefined ? true : allowBubbling; // Whether to continue event propagation.
    
    // The stop event occurrs whenever a chain
    //of events stops. Stop can override out/up/leave/etc.
    if (eventName === "stop")
    {
        JSHelper.Events.registerPointerEvent("up", target, onEvent, allowBubbling);
        JSHelper.Events.registerPointerEvent("leave", target, onEvent, allowBubbling);
        
        return;
    }
    
    let processGeneralEvent = (event, parentEvent) =>
    {
        let result =
        {
            rawEvent: event,
            clientX: event.clientX,
            clientY: event.clientY,
            button: event.button,
            target: event.target,
            preventDefault: () =>
            {
                (parentEvent || event).preventDefault();
            }
        };
            
        return result;
    };
    
    // Check: Does the client support pointer events?
    if (JSHelper.Events.getSupportsPointerEvents() 
            && !JSHelper.Events.useLegacyEvents)
    {
        target.addEventListener("pointer" + eventName, (event) =>
        {
            let result = processGeneralEvent(event);
            
            result.pointerId = event.pointerId;
            result.width = event.width;
            result.height = event.height;
            result.pressure = event.pressure;
            result.isPrimary = event.isPrimary;
            
            // Stop if we've been paused.
            if (JSHelper.Events.paused)
            {
                return;
            }
            
            onEvent.call(result, result);
            
            return true;
        }, allowBubbling); // Prevent propagation.
    }
    else // If not...
    {
        // Add mouse and touch events.
        target.addEventListener("mouse" + eventName, (event) =>
        {
            let result = processGeneralEvent(event);
            
            result.pointerId = 1;
            result.width = 1;
            result.height = 1;
            result.pressure = 0.5;
            result.isPrimary = true;
            
            // If we're paused, stop.
            if (JSHelper.Events.paused)
            {
                return;
            }
            
            onEvent.call(target, result);
            
            return true;
        }, allowBubbling);
        
        // Change the event name for touch.
        let newEventName = eventName;
        
        if (newEventName === "down")
        {
            newEventName = "start";
        }
        else if (newEventName === "up")
        {
            newEventName = "end";
        }
        
        target.addEventListener("touch" + newEventName, (event) =>
        {
            if (JSHelper.Events.paused)
            {
                return;
            }
            
            let result, touch;
            
            let handleTouch = (touch) =>
            {
                result = processGeneralEvent(touch, event);
                
                result.pointerId = touch.identifier;
                result.width = touch.radiusX * 2;
                result.height = touch.radiusY * 2;
                result.pressure = touch.force;
                result.isPrimary = (i === 0);
                
                onEvent.call(target, result);
            };
            
            for (var i = 0; i < event.changedTouches.length; i++)
            {
                handleTouch(event.changedTouches[i]);
            }
            
            return true;
        }, allowBubbling);
        
        // Allow event firing.
        target.style.touchAction = "none";
    }
};

// A set of global events to be deployed through
//the notifier. JSHelper does not fire these events.
//The main application code should handle this.
JSHelper.GlobalEvents = 
{
    PAGE_SETUP_COMPLETE: "global_e_page_setup_complete"
};

// An implementation of the observer pattern.
JSHelper.Notifier = new
(function()
{
    let listeners = {};
    let listenerIdCounter = 0; // The id for the next listener.
    let dispatchedEvents = {}; // Data concerning previously dispatched events.
    
    // Wait for eventName to be distributed by notify.
    //A message is included with the distributed event.
    //If fireForFirst is true, if the event has ever been
    //triggered, the listener is fired.
    this.waitFor = (eventName, fireForFirst) =>
    {
        // Has the event already fired?
        if (fireForFirst && dispatchedEvents[eventName] && dispatchedEvents[eventName].count > 0)
        {
            let result = new Promise((resolve, reject) =>
            {
                resolve.call(this, dispatchedEvents[eventName].data);
            });
            
            return result;
        }
    
        // Create a set of listeners for the event.
        if (listeners[eventName] === undefined)
        {
            listeners[eventName] = {};
        }
        
        let registered = false, registeredContent;
        let listenerId = "l" + (listenerIdCounter++); // Each listener has an ID. This is ours.
        
        // Put a default method in place, in case a notification comes before the next browser
        //frame.
        listeners[eventName][listenerId] = (content) =>
        {
            registered = true;
            registeredContent = content;
                
            // Remove our listener.
            delete listeners[eventName][listenerId];
        };
        
        let result = new Promise((resolve, reject) =>
        {
            // Have we already put the listener?
            if (!registered)
            {
                listeners[eventName][listenerId] = (content) =>
                {
                    resolve.call(this, content);
                
                    // Remove our listener.
                    delete listeners[eventName][listenerId];
                };
            }
            else // We already received the event!
            {    // Notify now.
                resolve(registeredContent);
            }
        });
        
        return result;
    };
    
    // Notify all listeners on eventName.
    this.notify = (eventName, content) =>
    {
        if (listeners[eventName]) // Are there listeners for eventName?
        {
            for (let listenerId in listeners[eventName])
            {
                // Notify all that are not undefined.
                if (listeners[eventName][listenerId])
                {
                    listeners[eventName][listenerId](content);
                }
            }
        }
        
        if (!dispatchedEvents[eventName])
        {
            dispatchedEvents[eventName] = { count: 0, data: undefined };
        }
        
        dispatchedEvents[eventName].count++;
        dispatchedEvents[eventName].data = content;
    };
})();

// A method that throws.
JSHelper.NotImplemented = (signature, message) => 
{
    signature = signature || "";
    message = message || "";

    return () => 
    {
        throw "Not implemented: " + signature + " " + message;
    };
};

// Count the number of characters in charset in the given text.
JSHelper.getCharCount = (text, charset) =>
{
    let charCount = 0;
    
    for (let i = 0; i < text.length; i++)
    {
        if (charset.indexOf(text.charAt(i)) !== -1)
        {
            charCount++;
        }
    }
    
    return charCount;
};

// Get the next animation frame in a promise.
JSHelper.nextAnimationFrame = () =>
{
    // A promise should push to the next frame,
    //but in case the browser doesn't render between
    //promises as it does for animation frames, pass it to an
    //animation frame.
    let result = new Promise((resolve, reject) =>
    {
        requestAnimationFrame(() => { resolve(true); });
    });
    
    return result;
};

// Wait for waitTime milliseconds. Returns a promise.
JSHelper.waitFor = (waitTime) =>
{
    let result = new Promise((resolve, reject) =>
    {
        setTimeout(() => { resolve(true); }, waitTime);
    });
    
    return result;
};

// Override some default behaviour! Much of this is for
//accessibility!
JSHelper.replacedMethods = {};
JSHelper.replacedMethods.addEventListener = HTMLElement.prototype.addEventListener;

// Define a new event, push, that awaits both clicks and
//the press of the enter key.
HTMLElement.prototype.addEventListener = 
function (eventType, onEnact, ...allOthers)
{
    if (eventType === "click")
    {
        eventType = "keyup";
        JSHelper.replacedMethods.addEventListener.apply(this, [eventType, 
        (event) =>
        {
            if (event.keyCode === 13) // Enter key.
            {
                onEnact.apply(this, arguments);
            }
        }].concat(allOthers));
        
        // Now, on click!
        eventType = "click";
    }
    
    return JSHelper.replacedMethods.addEventListener.apply(this, arguments);
};
