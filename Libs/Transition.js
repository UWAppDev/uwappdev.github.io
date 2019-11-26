"use strict";

function Transition(updateFunction, duration, doneFunction, beforeStart)
{
    var me = this;
    var startTime = (new Date()).getTime();
    var progress = 0;
    var currentTime, deltaT;
    var halt = false;
    var endProgressMultiplier = 1;
    var endProgress = 1;
    var running = false;
    var temporaryOnComplete = () => {};
    
    var progressCalculator = function(duration, deltaT)
    {
        if (duration === 0)
        {
            return 1;
        }
        else
        {
            return Math.max(0, Math.min(1, deltaT / duration));
        }
    };
    
    var animate = function()
    {
        if (halt)
        {
            halt = false;
            running = false;
            return;
        }
    
        currentTime = (new Date()).getTime();
        deltaT = currentTime - startTime;
        
        progress = progressCalculator(duration, deltaT);
        
        updateFunction.call(me, progress);
        
        if (progress * endProgressMultiplier < endProgress * endProgressMultiplier)
        {
            running = true;
            requestAnimationFrame(animate);
        }
        else
        {
            running = false;
            
            doneFunction.call(me);
            temporaryOnComplete.call(me);
        }
    };
    
    this.start = function()
    {
        halt = false;
        startTime = (new Date()).getTime();
        
        if (beforeStart)
        {
            beforeStart.apply(me, arguments);
        }
        
        // If not already running, start!
        if (!running)
        {
            animate();
        }
        
        // Return a promise!
        let result = new Promise((resolve, reject) =>
        {
            // Link the oncomplete action
            //to the resolve function.
            temporaryOnComplete = resolve;
        });
        
        return result;
    };
    
    this.cancel = function()
    {
        halt = true;
        
        // Clear the temporary oncomplete.
        temporaryOnComplete = undefined;
    };
    
    // Make the animation run in reverse by reversing
    //the progress!
    this.reverse = function()
    {
        var oldProgressCalculator = progressCalculator;
        progressCalculator = function(duration, deltaT)
        {
            return 1 - oldProgressCalculator(duration, deltaT);
        };
        
        endProgressMultiplier *= -1;
        endProgress = 1 - endProgress;
    };
}
