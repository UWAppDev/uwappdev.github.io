"use strict";

/*
    Something that can be moved through pointer-interaction.
    The parameter, content, is the HTML Element on which a
    listener is placed that shows the dragElement, and calls
    onDrag(delta x, delta y, client x, client y) while the
    content is dragged.
*/
function DraggableElement(content, dragElement, onDrag)
{
    var pointerDown = false;
    var lastX, lastY;
    this.onDrag = onDrag;
    this.onBeforeDrag = function() {};
    
    var me = this;
    
    var eventStart = function(event)
    {
        event.preventDefault();
    
        pointerDown = true;
        dragElement.style.display = "block";
        lastX = event.clientX;
        lastY = event.clientY;
        
        me.onBeforeDrag(lastX, lastY);
    };
    
    var eventMove = function(event)
    {
        if (pointerDown)
        {
            event.preventDefault();
            
            var x = event.clientX;
            var y = event.clientY;
        
            var dx = x - lastX;
            var dy = y - lastY;
            
            me.onDrag(dx, dy, x, y);
            
            lastX = x;
            lastY = y;
        }
    };
    
    var eventEnd = function(event)
    {
        event.preventDefault();
    
        pointerDown = false;
        dragElement.style.display = "none";
    };

    // At the time of this writing, Safari DID NOT support
    //pointer events. TODO Due to this, when the first pointer
    //event is fired, note that other event handlers can
    //ignore their input.
    JSHelper.Events.registerPointerEvent("down", content, function(e)
    {
        eventStart(e);
        
        return true;
    });
    
    JSHelper.Events.registerPointerEvent("move", dragElement, function(e)
    {
        eventMove(e);
        
        return true;
    });
    
    JSHelper.Events.registerPointerEvent("stop", dragElement, function(e)
    {
        eventEnd(e);
        
        return true;
    });

    JSHelper.Events.registerPointerEvent("move", content, function(e)
    {
        eventMove(e);
        
        return true;
    });
    
    JSHelper.Events.registerPointerEvent("up", content, function(e)
    {
        eventEnd(e);
        
        return true;
    });
}

