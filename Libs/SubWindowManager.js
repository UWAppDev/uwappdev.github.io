"use strict";

function SubWindowGlobals(parent, windowsList)
{
    this.parent = parent;
    this.windowsList = windowsList;
    this.dragElement = document.createElement("div");
    this.minZIndex = 100;
    
    var me = this;
    
    this.sortWindowsList = function()
    {
        /* Sort descending order. */
        me.windowsList.sort(function(windowA, windowB) 
        {
            return windowB.zIndex - windowA.zIndex;
        });
    };
    
    this.getMaxZIndex = function(excludeObject)
    {
        me.sortWindowsList();
        
        var result = this.minZIndex;
        
        if (me.windowsList.length > 0)
        {
            result = me.windowsList[0].zIndex;
            
            if (me.windowsList[0] == excludeObject)
            {
                if (me.windowsList.length > 1)
                {
                    result = me.windowsList[1].zIndex;
                }
                else
                {
                    result = this.minZIndex;
                }
            }
        }
        
        return result;
    };

    this.moveTopLevelWindowsToTheFore = function()
    {
        me.sortWindowsList();

        let hadBelowTop = false;

        for (var i = 0; i < me.windowsList.length; i++)
        {
            if (me.windowsList[i].alwaysOnTop && hadBelowTop)
            {
                me.windowsList[i].toTheFore(true);
            }

            hadBelowTop = hadBelowTop || !me.windowsList[i].alwaysOnTop;
        }
    };
    
    this.addWindow = function(newWindow)
    {
        me.windowsList.push(newWindow);
    };
    
    this.removeDestroyed = function()
    {
        me.sortWindowsList();
        
        while (me.windowsList.length > 0 
            && me.windowsList[me.windowsList.length - 1].zIndex === -1)
        {
            me.windowsList.pop();
        }
    };
    
    // Listen for shift + tab to switch between windows.
    me.parent.addEventListener("keydown", function(event)
    {
        if (event.shiftKey && me.windowsList.length > 0)
        {
            if (event.key === "Tab")
            {
                // Don't perform default action.
                event.preventDefault();
                
                me.sortWindowsList();
                
                // Select the last window.
                me.windowsList[me.windowsList.length - 1].toTheFore();
            }
            else if (event.key === "F4")
            {
                // Don't perform default action.
                event.preventDefault();
                
                me.sortWindowsList();
                
                // Close the first (focused) window.
                me.windowsList[0].close();
            }
        }
    }, true);
    
    this.parent.appendChild(this.dragElement);
    this.dragElement.setAttribute("class", "windowDragElement");
    this.dragElement.style.position = "fixed";
    this.dragElement.style.width = "100vw";
    this.dragElement.style.height = "100vh";
    this.dragElement.style.zIndex = 9999;
    this.dragElement.style.touchAction = "none";
    this.dragElement.style.display = "none";
}

// A tab specific to SubWindows.
function SubWindowTab(label, options)
{
    options = options || {};
    
    var parent = undefined;
    var me = this;
    var stylePrefix = options.stylePrefix || "base";
    this.mainElement = document.createElement(options.mainElement || "span");
    this.mainElement.setAttribute("class", stylePrefix + "Tab");
    this.mainElementCommand = document.createElement("span");
    this.mainElementCommand.setAttribute("class", stylePrefix + "TabLabel");
    this.mainElementCommand.textContent = label;
    this.mainElement.appendChild(this.mainElementCommand);
    
    if (!options.command)
    {
        this.menuElement = document.createElement("div");
        this.menuElement.style.display = "none";
        this.menuElement.style.position = "absolute";
        this.menuElement.setAttribute("class",  stylePrefix + "Menu");
        this.mainElement.appendChild(this.menuElement);
        this.subTabs = [];
        this.menuClickAwayEventListener = document.body.addEventListener("click", function(e)
        {
            if (me.menuElement && e.target !== me.menuElement && me.menuElement.style.display === "block")
            {
                e.preventDefault();
                me.menuElement.style.display = "none";
            }
        }, true);
        
        this.onClick = function()
        {
            me.menuElement.style.display = "block";
            me.menuElement.style.left = me.mainElement.offsetLeft + "px";
            //me.menuElement.style.top = (me.menuElement.clientHeight) + "px";
        };
    }
    else
    {
        this.onClick = options.command;
    }
    
    this.setLabel = function(newLabel)
    {
        me.mainElementCommand.textContent = newLabel;
    };
    
    this.addCommand = function(label, action)
    {
        if (me.menuElement === undefined)
        {
            throw "Cannot add sub-commands to a tab with a pre-set action.";
        }
        
        var subTab;
        subTab = new SubWindowTab(label, { command: function(event) { action(subTab, event); }, stylePrefix: stylePrefix, mainElement: "div" });
        subTab.addToElement(me.menuElement);
        
        return subTab;
    };
    
    this.addToElement = function(element)
    {
        element.appendChild(me.mainElement);
        parent = element;
    };
    
    // Unhides the element.
    this.show = function()
    {
        me.mainElement.style.visibility = "visible";
        me.mainElement.style.width = "auto";
        me.mainElement.style.height = "auto";
    };
    
    this.hide = function()
    {
        me.mainElement.style.visibility = "hidden";
        me.mainElement.style.height = "0px";
        me.mainElement.style.width = "0px";
    };
    
    this.destroy = function()
    {
        if (me.menuElement)
        {
            me.mainElement.removeChild(me.menuElement);
            delete me.menuElement;
        }
        
        if (me.subTabs)
        {
            for (var i = 0; i < me.subTabs.length; i++)
            {
                me.subTabs[i].destroy();
            }
        }
        
        if (parent !== undefined)
        {
            parent.removeChild(me.mainElement);
        }
        else
        {
            me.mainElement.outerHTML = "";
        }
        
        delete me.mainElement;
    };
    
    this.mainElementCommand.addEventListener("click", me.onClick);
}

function SubWindow(globals, options)
{
    options = options || {};
    var parent = globals.parent;
    
    var me = this;
    var styleClassName = options.className || "windowContainerDefault";
    
    // Get a string representing a component's style classes
    //for a given suffix.
    var getStyleClass = (suffix) =>
    {
        let result;
        
        result = styleClassName + suffix + " " + "windowContainer" + suffix;
        
        return result;
    };
    
    this.zIndex = globals.minZIndex;
    
    this.container = document.createElement("div");
    this.container.setAttribute("class", getStyleClass(""));
    
    this.container.style.display = "flex";
    this.container.style.flexDirection = "column";
    this.container.style.position = "fixed";
    
    this.titleBar = document.createElement("div");
    this.titleBar.setAttribute("class", getStyleClass("TitleBar"));
    
    this.titleBar.style.display = "flex";
    this.titleBar.style.flexDirection = "row";
    
    this.titleContent = document.createElement("div");
    this.titleContent.setAttribute("class", getStyleClass("TitleContent"));
    this.titleContent.style.flexGrow = "1";

    this.alwaysOnTop = options.alwaysOnTop || false;
    this.unsnappable = options.unsnappable === undefined ? (options.noResize || false) : options.unsnappable;
    this.snapThreshold = options.snapThreshold !== undefined ? options.snapThreshold : 60; // How far to the left/right the user needs to drag the window for it to snap.
    this.snapped = false; // Whether the window is currently snapped.
    
    this.draggable = false;
    
    if (options.titleHTML)
    {
        this.titleContent.innerHTML = options.titleHTML;
    }
    else if (options.title)
    {
        this.titleContent.textContent = options.title;
    }
    
    this.tabZone = document.createElement("div");
    this.tabZone.setAttribute("class", getStyleClass("TabZone"));
    this.tabZone.style.display = "none";
    var hasTabs = false;
    var tabs = [];
    
    var minWidth = options.minWidth;
    var minHeight = options.minHeight;
    var maxWidth = options.maxWidth;
    var maxHeight = options.maxHeight;
    
    let getMaxWidth = () =>
    {
        return maxWidth || window.innerWidth || parent.clientWidth;
    };
    
    let getMaxHeight = () =>
    {
        return maxHeight || window.innerHeight || parent.clientHeight;
    };
    
    var onCloseListener = undefined;
    
    this.content = document.createElement("div");
    this.content.setAttribute("class", getStyleClass("Content"));
    this.content.style.flexGrow = "1";
    
    if (options.contentHTML)
    {
        this.content.innerHTML = options.contentHTML;
    }
    else if (options.content)
    {
        this.content.textContent = options.content;
    }
    
    this.titleBar.appendChild(me.titleContent);
    this.container.appendChild(this.titleBar);
    this.container.appendChild(this.tabZone);
    this.container.appendChild(this.content);
    
    me.container.style.filter = "opacity(0%)";
    var transitionInOutFunction = function(progress)
    {
        me.container.style.filter = "opacity(" + Math.floor(progress * 100) + "%)";
    };
    
    this.destroyTransition = new Transition(transitionInOutFunction,
        options.destroyTransitionDuration !== undefined ? options.destoryTransitionDuration : 300,
        function()
        {
            parent.removeChild(me.container);
            
            for (var i = 0; i < tabs.length; i++)
            {
                tabs[i].destroy();
            }
            
            delete me.container;
            delete me.content;
            delete me.tabZone;
            delete me.titleBar;
            delete me.titleContent;
            
            me.zIndex = -1;
            globals.removeDestroyed();
            
            me.closed = true;
            
            if (onCloseListener)
            {
                onCloseListener();
            }

        });
        
    this.destroyTransition.reverse();
    
    var initialWidth, initialHeight, toWidth, toHeight;
    this.sizeTransition = new Transition(function(progress)
    {
        me.container.style.width = initialWidth + progress * (toWidth - initialWidth) + "px";
        me.container.style.height = initialHeight + progress * (toHeight - initialHeight) + "px";
        me.updateResizeCircleLocation(true);
    }, options.sizeTransitDuration !== undefined ? options.sizeTransitDuration : 250, function() // On end.
    {
        me.updateResizeCircleLocation(true);
    }, function(endWidth, endHeight) // Before start
    {
        initialWidth = me.container.clientWidth;
        initialHeight = me.container.clientHeight;
        
        if (endWidth !== undefined && endHeight !== undefined)
        {
            toWidth = endWidth;
            toHeight = endHeight;
        }

        // Bounds checking!
        if (minWidth !== undefined && toWidth < minWidth)
        {
            toWidth = minWidth;
        }
        
        if (minHeight !== undefined && toHeight < minHeight)
        {
            toHeight = minHeight;
        }

        if (toWidth > getMaxWidth())
        {
            toWidth = getMaxWidth();
        }

        if (toHeight > getMaxHeight())
        {
            toHeight = getMaxHeight();
        }
    });
    
    this.locationTransition = new Transition(function(progress)
    {
        me.container.style.left = (this.transitFromX + (this.transitToX - this.transitFromX) * progress) + "px";
        me.container.style.top = (this.transitFromY + (this.transitToY - this.transitFromY) * progress) + "px";
        
        me.updateResizeCircleLocation(false); // DO NOT re-measure the size of the container.
    }, options.locationTransitDuration !== undefined ? options.locationTransitDuration : 100, function() // On end.
    {
        me.updateResizeCircleLocation(false);
    }, function(toX, toY) // On before start.
    {
        var bbox = me.container.getBoundingClientRect();
    
        // Note that "this" is the transition.
        this.transitToX = toX;
        this.transitToY = toY;
        this.transitFromX = bbox.left;
        this.transitFromY = bbox.top;
    });
        
    this.createTransition = new Transition(transitionInOutFunction,
        options.createTransitionDuration !== undefined ? options.createTransitionDuration : 300,
        function()
        {
            // After creation, check for needed resizes again -- some
            //applications can take some time to inflate.
            if (!options.noResizeCircle && !options.noResize)
            {
                me.createResizeCircle();
            }
            
            me.scaleToParentWindow();
        });
    
    this.addTab = function(tab)
    {
        tab.addToElement(me.tabZone);
        tabs.push(tab);
        
        if (!me.hasTabs)
        {
            me.tabZone.style.display = "block";
            
            me.hasTabs = true;
        }
    };
    
    this.appendChild = function(child)
    {
        me.content.appendChild(child);
    };
    
    this.removeChild = function(child)
    {
        me.content.removeChild(child);
    };
    
    this.enableFlex = function(direction)
    {
        me.content.style.display = "flex";
        
        if (direction)
        {
            me.content.style.flexDirection = direction;
        }
    };

    var widthPreSnap = undefined, heightPreSnap = undefined;

    this.unsnap = function()
    {
        if (me.snapped)
        {
            me.sizeTransition.start(widthPreSnap || minWidth, 
                        heightPreSnap || minHeight).then(() =>
            {
                me.snapped = false;
            });
        }
        else
        {
            throw "Error in unsnap: Window is not snapped!";
        }
    };

    // Snap a window to the left of the screen,
    //or the right.
    this.snap = function(windowX, divideX)
    {
        if (!me.snapped)
        {
            widthPreSnap = me.container.clientWidth;
            heightPreSnap = me.container.clientHeight;
        }

        me.container.style.top = 0;
        me.container.style.left = windowX + "px";

        toWidth = (window.innerWidth || parent.clientWidth) - divideX;
        toHeight = window.innerHeight || parent.clientHeight;

        if (windowX !== divideX)
        {
            toWidth = divideX;
        }

        me.sizeTransition.start();

        me.snapped = true;
    };
    this.snapLeft = function()
    {
        me.snap(0, (window.innerWidth || parent.clientWidth) / 2);
    };

    this.snapRight = function()
    {
        var divide = (window.innerWidth || parent.clientWidth) / 2;

        me.snap(divide, divide)
    };
    
    // Adjust the scale of the sub-window to fit in the browser's window.
    this.scaleToParentWindow = function()
    {
        toWidth = me.container.clientWidth;
        toHeight = me.container.clientHeight;
        var runSizeTransition = false;
        
        if (minWidth === undefined)
        {
            minWidth = me.container.clientWidth / 2;
        }
        
        if (minHeight === undefined)
        {
            minHeight = me.container.clientHeight / 2;
        }
        
        if (me.container.clientHeight < minHeight)
        {
            toHeight = minHeight;
            
            runSizeTransition = true;
        }
        
        if (me.container.clientWidth < minWidth)
        {
            toWidth = minWidth;
            
            runSizeTransition = true;
        }
        
        if (me.container.clientWidth > getMaxWidth())
        {
            toWidth = getMaxWidth();
            
            runSizeTransition = true;
        }
        
        if (me.container.clientHeight > getMaxHeight())
        {
            toHeight = getMaxHeight();
            
            runSizeTransition = true;
        }
        
        if (runSizeTransition)
        {
            me.sizeTransition.start();
        }
        
        var bbox = me.container.getBoundingClientRect();
        
        var windowWidth = window.innerWidth || globals.dragElement.clientWidth;
        var windowHeight =  window.innerHeight || globals.dragElement.clientHeight;
        
        if (me.container.clientWidth + bbox.left > windowWidth)
        {
            me.container.style.left = 0;
            me.container.style.width = windowWidth + "px";
        }
        
        if (me.container.clientHeight + bbox.top > windowHeight)
        {
            me.container.style.top = 0;
            me.container.style.maxHeight = windowHeight + "px";
        }
        
        me.updateResizeCircleLocation(true);
    };
    
    this.createCloseButton = function()
    {
        me.closeButton = document.createElement("div");
        me.closeButton.innerHTML = "X";
        
        me.closeButton.setAttribute("class", getStyleClass("CloseButton"));
        
        me.titleBar.appendChild(me.closeButton);
        
        me.closeButton.onclick = function(event)
        {
            event.preventDefault();
            
            me.destroy();
        };
    };
    
    this.createMinimizeMaximizeButton = function()
    {
        me.minMaxButton = document.createElement("div");
        me.minMaxButton.setAttribute("class", getStyleClass("MaximizeButton"));
        me.titleBar.appendChild(me.minMaxButton);
        
        // Original state
        var originalResizeCircleDisplay = "block";
        var originalWidth = minWidth;
        var originalHeight = minHeight;
        var originalX = 0;
        var originalY = 0;
        var originalMovable = true;
        
        var storeOriginalState = function()
        {
            var bbox = me.content.getBoundingClientRect();
                
            originalWidth = me.container.clientWidth;
            originalHeight = me.container.clientHeight;
            
            originalWidth = Math.max(originalWidth, minWidth);
            originalHeight = Math.max(originalHeight, minHeight);
            
            originalX = bbox.left;
            originalY = bbox.top;
            
            originalMovable = me.getDraggable();
            
            if (me.resizeZone)
            {   
                originalResizeCircleDisplay = me.resizeZone.style.display;
            }
        };
        
        me.minMaxButton.onclick = function(event)
        {
            event.preventDefault();
            
            // Set up state for size transition.
            initialWidth = me.container.clientWidth;
            initialHeight = me.container.clientHeight;
            
            if (me.minMaxButton.getAttribute("class").indexOf("MinimizeB") === -1)
            {
                // Change the button's looks!
                me.minMaxButton.setAttribute("class", getStyleClass("MinimizeButton"));
                
                // Allow a return to the state of the window before maximization.
                storeOriginalState();
                
                me.locationTransition.start(0, 0);
                
                me.sizeTransition.start(window.innerWidth || parent.clientWidth, window.innerHeight || parent.clientHeight);
                
                me.setDraggable(false);
                
                setDragReplacementAction((dx, dy) =>
                {
                    if (dy > 0)
                    {
                        clearDragReplacementAction();
                        
                        me.minMaxButton.click();
                    }
                });
                
                if (me.resizeZone)
                {
                    me.resizeZone.style.display = "none";
                }
            }
            else
            {
                me.sizeTransition.start(originalWidth, originalHeight);
                
                me.locationTransition.start(originalX, originalY).then(() => 
                {
                    // Only change state related to minimization/maximization at the end.
                    me.minMaxButton.setAttribute("class", getStyleClass("MaximizeButton"));
                    me.setDraggable(originalMovable);
                });
                
                clearDragReplacementAction();
                
                // Show the resize circle.
                if (me.resizeZone)
                {
                    me.resizeZone.style.display = originalResizeCircleDisplay;
                }
            }
        };
    };
    
    this.updateResizeCircleLocation = function(measureSize)
    {
        // Do nothing if the circle is nonexistant.
    };
    
    this.createResizeCircle = function()
    {
        var bbox = me.container.getBoundingClientRect();
    
        me.resizeZone = document.createElement("div");
        me.resizeZone.setAttribute("class", getStyleClass("ResizeZone"));
        me.resizeZone.style.position = "absolute"; // Note: "fixed" has issues in WebKit.
        me.container.appendChild(me.resizeZone);
        
        var left = me.container.clientWidth - 5;
        var top = me.container.clientHeight - 5;
        
        me.resizeZone.style.left = left + "px";
        me.resizeZone.style.top = top + "px";
        
        var width = me.container.clientWidth;
        var height = me.container.clientHeight;
        
        me.updateResizeCircleLocation = function(measureSize)
        {
            if (measureSize)
            {
                width = me.container.clientWidth;
                height = me.container.clientHeight;
            }
        
            me.resizeZone.style.left = (width - me.resizeZone.clientWidth / 2) + "px";
            me.resizeZone.style.top = (height - me.resizeZone.clientHeight / 2) + "px";
        };
        
        var draggableWrapper = new DraggableElement(me.resizeZone, globals.dragElement);
        draggableWrapper.onDrag = function(dx, dy, x, y)
        {
            me.toTheFore();
        
            if ((width + dx > minWidth || dx > 0) && (width + dx < getMaxWidth() || dx < 0))
            {
                width += dx;
            }
            
            if ((height + dy > minHeight || dy > 0) && (height + dy < getMaxHeight() || dy < 0))
            {
                height += dy;
            }
            
            me.updateResizeCircleLocation(false);
            
            me.container.style.width = (width) + "px";
            me.container.style.height = (height) + "px";
        };
        
        draggableWrapper.onBeforeDrag = function()
        {
            me.toTheFore();
            
            width = me.container.clientWidth;
            height = me.container.clientHeight;
        };
    };
    
    this.toTheFore = function(calledFromTopToTheFore)
    {
        var maxZIndex = globals.getMaxZIndex(me);
        
        if (maxZIndex >= me.zIndex)
        {
            me.zIndex = maxZIndex + 1;
            me.container.style.zIndex = me.zIndex;
            globals.dragElement.style.zIndex = me.zIndex * 2;

            if (!calledFromTopToTheFore && !me.alwaysOnTop)
            {
                globals.moveTopLevelWindowsToTheFore();
            }
        }
    };
    
    this.getDraggable = function()
    {
        return me.draggable;
    };
    
    this.setDraggable = function(draggable)
    {
        me.draggable = draggable;
    };
    
    var dragReplacementAction;
    
    var setDragReplacementAction = function(action)
    {
        dragReplacementAction = action;
    };
    
    var clearDragReplacementAction = function()
    {
        dragReplacementAction = undefined;
    };
    
    this.makeMovable = function()
    {
        var bbox = me.container.getBoundingClientRect();
        var left = bbox.left;
        var top = bbox.top;
        
        me.container.style.left = left + "px";
        me.container.style.top = top + "px";
        
        me.draggable = true;
        
        var draggableWrapper = new DraggableElement(me.titleContent, globals.dragElement);
        draggableWrapper.onDrag = function(dx, dy, x, y)
        {
            me.toTheFore();
            
            if (!me.getDraggable())
            {
                // Replace the action, if requested.
                if (dragReplacementAction)
                {
                    dragReplacementAction(dx, dy);
                }
            
                return;
            }
        
            left += dx;
            top += dy;
            
            me.container.style.left = left + "px";
            me.container.style.top = top + "px";

            if (left < -me.snapThreshold && !me.unsnappable)
            {
                me.snapLeft();
            }
            else if (left > (window.innerWidth || parent.clientWidth) - me.container.clientWidth + me.snapThreshold && !me.unsnappable)
            {
                me.snapRight();
            }
            else if (me.snapped)
            {
                me.unsnap();
            } // Snap top?
            else if (top < me.snapThreshold && me.minMaxButton && !me.unsnappable && dy < 0)
            {
                me.minMaxButton.click();
            }
        };
        
        draggableWrapper.onBeforeDrag = function()
        {
            me.toTheFore();
        
            bbox = me.container.getBoundingClientRect();
            left = bbox.left;
            top = bbox.top;
        };
    };
    
    this.destroy = function()
    {
        if (!me.closed)
        {
            me.destroyTransition.start();
        }
    };
    
    this.close = this.destroy;
    
    this.setOnCloseListener = function(newOnCloseListener)
    {
        onCloseListener = newOnCloseListener;
    };
    
    this.show = function()
    {
        parent.appendChild(me.container);
        
        me.createTransition.start();
        globals.addWindow(me);
        me.toTheFore();
        
        me.container.style.zIndex = me.zIndex;
        
        globals.dragElement.style.zIndex = me.zIndex * 2;
        
        if (!options.noFullScreenBox && !options.noResize)
        {
            me.createMinimizeMaximizeButton();
        }
        
        if (!options.noCloseButton)
        {
            me.createCloseButton();
        }
        
        if (!options.fixed)
        {
            me.makeMovable();
        }
        
        // Allow the window to scale, then
        //change its dimensions, if necessary.
        requestAnimationFrame(function()
        { 
            var initialX = options.x !== undefined ? options.x : Math.max(0, window.innerWidth - me.container.clientWidth) / 2;
            var initialY = options.y !== undefined ? options.y : Math.max(5, window.innerHeight / 4 - me.container.clientHeight) / 2;
            
            me.locationTransition.start(initialX, initialY);
            me.scaleToParentWindow();
        });
    };
    
    this.container.addEventListener("click",
    function()
    {
        me.toTheFore();
    }, true);
}

var SubWindowHelper = {};
SubWindowHelper.create = function(options)
{
    if (!SubWindowHelper.globals)
    {
        SubWindowHelper.globals = new SubWindowGlobals(document.body, []);
    }
    
    var newWindow = new SubWindow(SubWindowHelper.globals, options);
    
    newWindow.show();
    
    return newWindow;
};

SubWindowHelper.confirm = function(title, message, okLabel, cancelLabel, htmlText, windowOptions)
{
    var dialog = SubWindowHelper.create(windowOptions 
    || { title: title, 
         content: "", 
         noCloseButton: true, 
         noResize: true, 
         maxWidth: 400, 
         minWidth: 400, 
         x: (window.innerWidth / 2 - 200), 
         minHeight: 120 });
    
    var contentDiv = document.createElement("div");
    
    if (!htmlText)
    {
        contentDiv.innerText = message;
    }
    else
    {
        contentDiv.innerHTML = message;
    }
    
    dialog.enableFlex("column");
    contentDiv.style.flexGrow = 2;
    contentDiv.style.overflowY = "auto";
    
    // Add additional padding.
    contentDiv.style.paddingLeft = "4px";
    
    var submitButtonOk = document.createElement("button");
    var submitButtonCancel = document.createElement("button");
    
    submitButtonOk.innerHTML = okLabel || "Ok";
    submitButtonCancel.innerHTML = cancelLabel || "Cancel";
    
    submitButtonOk.setAttribute("class", "dialogSubmitButton");
    submitButtonCancel.setAttribute("class", "dialogSubmitButton");
    
    dialog.content.appendChild(contentDiv);
    dialog.content.appendChild(submitButtonOk);
    dialog.content.appendChild(submitButtonCancel);
    
    return new Promise((resolve, reject) =>
    {
        const submit = (result) =>
        {
            dialog.close();
            
            resolve(this, result);
        };
    
        submitButtonOk.onclick = function()
        {
            submit(true);
        };
        
        submitButtonCancel.onclick = function()
        {
            submit(false);
        };
    });
};

SubWindowHelper.alert = function(title, message, onClose, htmlText, windowOptions)
{
    var alertDialog = SubWindowHelper.create(windowOptions 
    || { title: title, 
         content: "", 
         noCloseButton: true, 
         noResize: true, 
         maxWidth: 400, 
         minWidth: 400, 
         x: (window.innerWidth / 2 - 200), 
         minHeight: 120 });
    
    var contentDiv = document.createElement("div");
    
    if (!htmlText)
    {
        contentDiv.innerText = message;
    }
    else
    {
        contentDiv.innerHTML = message;
    }
    
    alertDialog.enableFlex("column");
    contentDiv.style.flexGrow = 2;
    contentDiv.style.overflowY = "auto";
    
    // Add additional padding.
    contentDiv.style.paddingLeft = "4px";
    
    var submitButton = document.createElement("button");
    submitButton.innerHTML = "Ok";
    submitButton.setAttribute("class", "alertSubmitButton");
    
    alertDialog.content.appendChild(contentDiv);
    alertDialog.content.appendChild(submitButton);
    
    return new Promise((resolve, reject) =>
    {
        submitButton.onclick = function()
        {
            alertDialog.close();
            
            if (onClose !== undefined)
            {
                onClose.call(this);
            }
            
            resolve(this);
        };
    });
};

// Prompt a user for input.
//This method takes a map of input placeholders/
//labels to input types as "inputs". It returns a promise.
SubWindowHelper.prompt = function(title, message, inputs, 
        windowOptions)
{
    var promptDialog = SubWindowHelper.create
            (windowOptions
             || { title: title, 
                  content: "",  
                  minWidth: 400, 
                  x: (window.innerWidth / 2 - 200), 
                  minHeight: 120 });
                  
    promptDialog.enableFlex("column");
            
    var contentArea = document.createElement("div");
    var messageZone = document.createElement("div");
    var inputZone = document.createElement("div");
    
    contentArea.appendChild(messageZone);
    contentArea.appendChild(inputZone);
    
    promptDialog.appendChild(contentArea);
    
    messageZone.innerText = message;
    
    var addedInputs = [];
    var inputMap = {};
    var submit = () => {};
    
    var handleInput = (label) =>
    {
        const inputIndex = addedInputs.length;
        
        let newInputContainer = document.createElement("div");
        
        newInputContainer.style.display = "flex";
        newInputContainer.style.flexDirection = "row";
        
        let labelElement = HTMLHelper.addLabel(label, newInputContainer);
        
        labelElement.style.paddingRight = "6px";
        
        let newInput = HTMLHelper.addInput(label, "", inputs[label], newInputContainer, (value) => // On input.
        {
            inputMap[label] = value;
        }, (value) => // On Enter key.
        {
            inputMap[label] = value;
            
            if (inputIndex + 1 < addedInputs.length 
                    && inputs[label] !== "textarea")
            {
                addedInputs[inputIndex + 1].focus();
            }
            else
            {
                submit();
            }
        });
        
        newInput.style.flexGrow = 1;
        
        inputZone.appendChild(newInputContainer);
        
        return newInput;
    };
    
    // For every given input...
    for (var label in inputs)
    {
        let input = handleInput(label);
        
        inputMap[label] = undefined;
        addedInputs.push(input);
    }
    
    // Add a submit button.
    const submitButton = HTMLHelper.addButton("Submit", promptDialog, () =>
    {
        submit();
    });
    
    submitButton.style.flexGrow = 1;
    
    return new Promise((resolve, reject) =>
    {
        submit = () =>
        {
            promptDialog.close();
            
            resolve(inputMap);
        };
    });
};

// Creates a dialog... Returns an object with
//methods update, close, and a refrence to the dialog (dialog).
SubWindowHelper.makeProgressDialog = function(title)
{
    // Default values.
    title = title || "Loading...";
    
    // Make the window.
    let progressDialog = SubWindowHelper.create({ title: title, noCloseButton: true, noResize: true, maxWidth: 400, minWidth: 400, x: window.innerWidth / 2 - 200 });
    
    let statusText = HTMLHelper.addLabel("...", progressDialog, "div");
    let progressBar = HTMLHelper.addProgressBar(0, progressDialog);
    
    let update = function(progress, status)
    {
        progressBar.setProgress(progress);
        statusText.textContent = status;
    };
    
    let close = function()
    {
        progressDialog.close();
    };
    
    // Dictionaries cannot be
    //constructed in return statements.
    let result =  
    {
        update: update,
        
        close: close,
        
        dialog: progressDialog
    };
    
    return result;
};

// TODO: Finish implementation.
SubWindowHelper.setDisplayNavabar = function(displayNavBar)
{
    if (SubWindowHelper.navBar)
    {
        if (displayNavBar)
        {
            SubWindowHelper.navBar.style.display = "block";
        }
        else
        {
            SubWindowHelper.navBar.style.display = "none";
        }
    }
    else
    {
        SubWindowHelper.navBar = document.createElement("div");
    }
};
