"use strict";

function ProgressEstimator(runFunction)
{
    this.startTime = undefined;
    this.estimatedConstant = 0;
    this.runFunction = runFunction;
    this.addedConstant = 0;
    this.progressLoopRunning = false;
    this.inRecord = false;
    
    // RunningTime is a function, like n => n*n or n => lg(n).
    //This is like theta/omicron notation, except can be more exact
    //if a +n, or +c term is included.
    this.setRunFunction = function(runningTime)
    {
        this.runFunction = runningTime;
    };
    
    this.startRecord = function()
    {
        this.startTime = (new Date()).getTime();
        this.inRecord = true;
    };
    
    this.stopProgressLoopIfRunning = function()
    {
        if (this.progressLoopRunning)
        {
            this.shouldStopProgressLoop = true;
        }
    };
    
    // ArgumentLength should fullfill the parameter
    //given in the run function.
    this.stopRecord = function(argumentLength)
    {
        let endTime = (new Date()).getTime();
        let deltaTime = endTime - this.startTime;
        
        this.inRecord = false;
        
        this.stopProgressLoopIfRunning();
        
        // If no arguments were given,
        //use this as an opportunity
        //to determine the added constant.
        if (argumentLength === 0)
        {
            this.addedConstant = deltaTime;
            
            return;
        }
        
        let singleSampleEstimate = deltaTime / this.runFunction(argumentLength);
        
        // If the estimated constant is zero, and this
        //constant is nonzero, set it. It assumes
        //the more recent estimate is more accurate than the previous
        //(the user could have opened a new program, etc); however
        //the estimatedConstant is weighted in favor of the previous estimatedConstant.
        //Look into whether this should be changed.
        if (this.estimatedConstant != 0)
        {
            this.estimatedConstant = this.estimatedConstant * 0.7 + singleSampleEstimate * 0.3;
        }
        else
        {
            this.estimatedConstant = singleSampleEstimate;
        }
    };
    
    // The prediction must have been started with startRecord.
    this.predictProgress = function(argumentsLength)
    {
        let endTime = (new Date()).getTime();
        let deltaTime = endTime - this.startTime;
        
        let totalTime = (this.estimatedConstant * this.runFunction(argumentsLength) + this.addedConstant);
        let currentTime = deltaTime;
        
        let result = 1;
        
        if (totalTime !== 0)
        {
            result = currentTime / totalTime;
        }
        
        return result;
    };
    
    // Keep predicting progress in a loop, until
    //the record is stopped.
    this.predictProgressLoop = function(argumentCount, onUpdate)
    {
        this.progressLoopRunning = true;
        this.shouldStopProgressLoop = false;
        
        // Start a new record if one has
        //not already been started.
        if (!this.inRecord)
        {
            this.startRecord();
        }
        
        let me = this;
        
        let loop = function()
        {
            if (!me.progressLoopRunning)
            {
                return;
            }
            
            onUpdate(me.predictProgress(argumentCount));
            
            requestAnimationFrame(loop);
        };
        
        loop();
    };
}

