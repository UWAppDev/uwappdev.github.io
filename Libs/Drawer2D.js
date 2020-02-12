"use strict";

// A simple 2D drawing program, created with the goal of
//allowing users to create and edit textures.

function Drawer2D(onSubmit, options)
{
    options = options || {};    
    
    var me = this;
    
    let undoStack = [];
    let redoStack = [];
    
    const INITIAL_WIDTH = options.initialWidth || 500;
    const INITIAL_HEIGHT = options.initialHeight || 500;
    const MAX_UNDO = 30;
    
    const INITIAL_VIEW_X = 0;
    const INITIAL_VIEW_Y = 0;
    
    // To add something to the undo stack,
    //at least two changes should have occurred
    //and five seconds passed.
    const UNDO_TIME_DELTA = 2000;
    const UNDO_MIN_ACTIONS = 2;
    
    let lastUndoTime = (new Date()).getTime();
    let actionsSinceUndo = 0;
    
    this.mainSubWindow = SubWindowHelper.create({ title: "Drawer 2D", content: "",
                                              minWidth: INITIAL_WIDTH, 
                                              minHeight: INITIAL_HEIGHT });
    this.mainSubWindow.enableFlex(); // Stretches elements vertically, especially the canvas.
    
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    // The canvas should fill the window.
    canvas.style.width = "calc(100% - 5px)"; // Subtract 5px to prevent the creation
                                             // of scrollbars.
    canvas.style.height = "auto";
    
    // Give the canvas a background, to permit visualization of the alpha channel.
    canvas.style.backgroundImage = "radial-gradient(white, black)";
    canvas.style.backgroundSize = "5px 5px";
    
    const imageCanvas = document.createElement("canvas");
    const imageCtx = imageCanvas.getContext("2d");
    
    if (options.initialImage)
    {
        imageCtx.canvas.width = options.imageWidth || options.initialImage.width;
        imageCtx.canvas.height = options.imageHeight || options.initialImage.height;
        
        try
        {
            imageCtx.drawImage(options.initialImage, 0, 0, imageCtx.canvas.width, imageCtx.canvas.height);
        }
        catch(e)
        {
            SubWindowHelper.alert("Unable to draw image", "Error: " + e + ". Proceeding.");
        }
    }
    else
    {
        imageCtx.canvas.width = options.imageWidth || INITIAL_WIDTH;
        imageCtx.canvas.height = options.imageHeight || INITIAL_HEIGHT;
    }
    
    // Get an initial transform matrix.
    let transformMatrix = Mat33Helper.getTranslateMatrix(INITIAL_VIEW_X, INITIAL_VIEW_Y);
    
    me.tools = { "Base Pen": new Drawer2DHelper.BasePen(),
                 "Custom Pen 1": new Drawer2DHelper.CustomizablePen(),
                 "Custom Pen 2": new Drawer2DHelper.CustomizablePen(),
                 "Eraser": new Drawer2DHelper.Eraser(),
                 "View Panner": new Drawer2DHelper.ViewPanner(transformMatrix),
                 "View Zoomer": new Drawer2DHelper.ViewZoomer(transformMatrix) };
    me.currentTool = me.tools["Base Pen"];
    
    // Keep track of the number of context-saves.
    let contextViewSaves = 0;
    
    let saveContextView = () =>
    {
        transformMatrix.save();
        
        contextViewSaves++;
    };
    
    let restoreContextView = () =>
    {
        if (contextSaves > 0)
        {
            transformMatrix.restore();
        
            contextViewSaves--;
        }
        else
        {
            throw "Danger! The number of cached context states is at zero (Drawer2D).";
        }
    };
    
    let resetView = () =>
    {
        // Restore until at the initial state,
        while (contextViewSaves > 0)
        {
            restoreContextView();
        }
        
        // Then save so we can restore it again.
        saveContextView();
    };
    
    //  Allow snapshots of the canvas to be stored and traversed
    // -- an implementation of undo and redo.
    
    // Filters the undo stack, removing 
    let filterUndoStack = () =>
    {
        if (undoStack.length > MAX_UNDO)
        {
            // If the undo stack is longer than expected,
            //trim it.
            let newStack = [];
            
            for (let i = undoStack.length - MAX_UNDO; i < undoStack.length; i++)
            {
                newStack.push(undoStack[i]);
            }
            
            // Swap the stacks.
            undoStack = newStack;
        }
    };
    
    // Cache a snapshot. Note that with the current implementation,
    //no compression is done and tainted canvases cannot be cached.
    let cacheState = (pushToRedoStack) =>
    {
        let imageToCache = new Image();
        
        let loaded = false;
        let onLoad = () => {};
        
        // Add the image to the undo stack after
        //it has loaded.
        imageToCache.addEventListener("load", () =>
        {
            if (pushToRedoStack)
            {
                redoStack.push(imageToCache);
            }
            else
            {
                undoStack.push(imageToCache);
            }
            
            // Filter the undo stack.
            filterUndoStack();
            
            // Note that the image has loaded.
            loaded = true;
            
            // Notify any listeners.
            onLoad(imageToCache);
        });
        
        // Set its source.
        imageToCache.src = imageCanvas.toDataURL("img/png");
        
        // Note the last cache time.
        lastUndoTime = (new Date()).getTime();
        
        let result = new Promise((resolve, reject) =>
        {
            onLoad = (imageToCache) => resolve({ image: imageToCache, dataURL: imageToCache.src });
            
            if (loaded)
            {
                onLoad(imageToCache);
            }
        });
        
        return result;
    };
    
    let performUndo = () =>
    {
        // Can we actually undo?
        if (undoStack.length == 0)
        {
            undoTab.hide();
        
            return;
        }
        
        // Take a state from the stack.
        let currentState = undoStack.pop();
        
        // Push it onto the redo stack.
        cacheState(true);
        
        // Show the redo tab.
        redoTab.show();
        
        clearCanvas(imageCtx);
        
        // Draw it onto the canvas.
        imageCtx.drawImage(currentState, 0, 0);
        
        render();
    };
    
    let performRedo = () =>
    {
        if (redoStack.length == 0)
        {
            redoTab.hide();
            
            return;
        }
        
        let newState = redoStack.pop();
        
        undoStack.push(newState);
        undoTab.show();
        
        clearCanvas(imageCtx);
        imageCtx.drawImage(newState, 0, 0);
        
        render();
    };
    
    // Push state to the undo stack, if necessary.
    let cacheStateIfNecessary = () =>
    {
        let nowTime = (new Date()).getTime();
        
        if (nowTime - lastUndoTime >= UNDO_TIME_DELTA && actionsSinceUndo >= UNDO_MIN_ACTIONS)
        {
            cacheState().then(() =>
            {
                redoStack = []; // Reset the redo stack.
                
                // Hide the redo menu.
                redoTab.hide();
                undoTab.show(); // And show the undo tab.
            });
            
            // Reset the number of actions since the last undo.
            actionsSinceUndo = 0;
        }
    };
    
    // Permit view-resetting by taking an initial snapshot of
    //the state of the context.
    saveContextView();
    cacheState();
    
    var clearCanvas = (currentCtx) =>
    {
        currentCtx = currentCtx || ctx;
        
        currentCtx.save();
        
        currentCtx.setTransform(1, 0, 0, 1, 0, 0);
        currentCtx.clearRect(0, 0, currentCtx.canvas.width, currentCtx.canvas.height);
        
        currentCtx.restore();
    };
    
    var resizePixBuffer = () =>
    {
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight)
        {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }
    };
    
    var render = () =>
    {
        resizePixBuffer();
        
        clearCanvas();
        
        ctx.setTransform(transformMatrix.getAt(0, 0), transformMatrix.getAt(0, 1), 
                         transformMatrix.getAt(1, 0), transformMatrix.getAt(1, 1),
                         transformMatrix.getAt(2, 0), transformMatrix.getAt(2, 1));
        
        ctx.strokeRect(-1, -1, imageCanvas.width + 1, imageCanvas.height + 1);
        ctx.drawImage(imageCanvas, 0, 0);
    };
    
    // Create context menus.
    let fileMenu = new SubWindowTab("File");
    let editMenu = new SubWindowTab("Edit");
    let toolMenu = new SubWindowTab("Tools");
    
    // Add the commands.
    if (onSubmit)
    {
        fileMenu.addCommand("Submit", () =>
        {
            cacheState().then((data) =>
            {
                const { image, dataURL } = data;
                
                onSubmit.call(me, image, dataURL);
                me.mainSubWindow.close();
            });
        });
    }
    
    fileMenu.addCommand("Exit", () =>
    {
        me.mainSubWindow.close();
    });
    
    // Edit menu.
    var undoTab = editMenu.addCommand("Undo", () =>
    {
        performUndo();
    });
    
    var redoTab = editMenu.addCommand("Redo", () =>
    {
        performRedo();
    });
    
    // Hide the redo tab initially.
    redoTab.hide();
    
    let selectTool = function(tool)
    {
        if (me.currentTool &&
                    me.currentTool.onDeInit)
        {
            me.currentTool.onDeInit();
        }
        
        me.currentTool = tool;
        
        if (tool.onInit)
        {
            tool.onInit();
        }
    };
    
    // View Menu.
    let showControlTab, controlsWindow;
    showControlTab = toolMenu.addCommand("Show Controls Window", () =>
    {
        showControlTab.hide();
        
        controlsWindow = SubWindowHelper.create({ title: "Tools", noResize: true, alwaysOnTop: true });
        
        let handleToolButton = (toolName, tool) =>
        {
            let newButton = HTMLHelper.addButton(toolName, controlsWindow, () =>
            {
                selectTool(tool);
            });
            
            newButton.style.display = "block";
        };
        
        for (let label in me.tools)
        {
            handleToolButton(label, me.tools[label]);
        }
        
        controlsWindow.setOnCloseListener(() =>
        {
            showControlTab.show();
        });
    });
    
    // Tool menu.
    let handleToolCommand = (toolName, tool) =>
    {
        toolMenu.addCommand(toolName, () =>
        {
            selectTool(tool);
        });
    };
    
    for (let label in me.tools)
    {
        handleToolCommand(label, me.tools[label]);
    }
    
    // Tools might want to de-init/free themselves.
    //Set an onClose listener.
    me.mainSubWindow.setOnCloseListener(() =>
    {
        if (me.currentTool && me.currentTool.onDeInit)
        {
            // Notify the current tool.
            me.currentTool.onDeInit();
        }
        
        // If the controls window is open, close it.
        if (controlsWindow)
        {
            controlsWindow.close();
        }
    });
    
    // Add context menus!
    me.mainSubWindow.addTab(fileMenu);
    me.mainSubWindow.addTab(editMenu);
    me.mainSubWindow.addTab(toolMenu);
    
    // Add the canvas.
    me.mainSubWindow.appendChild(canvas);
    
    let pointerDown = false, lastX, lastY;
    
    // Configure events.
    
    let pointerStartX, pointerStartY, inverseTransform, changesMade;
    JSHelper.Events.registerPointerEvent("down", canvas, function(event)
    {
        event.preventDefault();
    
        let bbox = canvas.getBoundingClientRect();
        
        pointerStartX = event.clientX - bbox.left;
        pointerStartY = event.clientY - bbox.top;
        
        let currentPositionArray = [pointerStartX, pointerStartY, 1];
        inverseTransform = transformMatrix.getInverse();
        MatHelper.transformPoint(currentPositionArray, inverseTransform);
        
        me.currentTool.handlePointerDown(ctx, imageCtx, currentPositionArray[0], currentPositionArray[1], 0, 0);
    
        render();
        pointerDown = true;
        
        changesMade = false;
        
        lastX = pointerStartX;
        lastY = pointerStartY;
    }, false);
    
    JSHelper.Events.registerPointerEvent("move", canvas, function(event)
    {
        if (pointerDown)
        {
            event.preventDefault();
        
            let bbox = canvas.getBoundingClientRect();
            let x = event.clientX - bbox.left;
            let y = event.clientY - bbox.top;
            
                
            let currentPositionArray = [x, y, 1];
            inverseTransform = transformMatrix.getInverse();
            MatHelper.transformPoint(currentPositionArray, inverseTransform);
            
            changesMade = me.currentTool.handlePointerMove(ctx, imageCtx, currentPositionArray[0], currentPositionArray[1], x - lastX, y - lastY, event.pressure) || changesMade;
            
            render();
            
            lastX = x;
            lastY = y;
        }
    }, false);
    
    JSHelper.Events.registerPointerEvent("stop", canvas, function(event)
    {
        pointerDown = false;
        
        event.preventDefault();
    
        let bbox = canvas.getBoundingClientRect();
        let x = event.clientX - bbox.left;
        let y = event.clientY - bbox.top;
        
        me.currentTool.handlePointerUp(ctx, imageCtx, x, y, x - pointerStartX, y - pointerStartY);
        
        if (changesMade)
        {
            actionsSinceUndo++;
            
            cacheStateIfNecessary();
        }
    }, false);
    
    // Any async setup.
    (async () =>
    {
        // Wait for the window to resize.
        //TODO Remove magic variable.
        await JSHelper.waitFor(500);
        
        render();
    })();
}

// Define tools to be used with the Drawer2D.
var Drawer2DHelper = {}; // Make a pseudo-namespace.

Drawer2DHelper.typeHelper = { CLASS_BASE_TOOL: true, CLASS_BASE_PEN: true, 
                              CLASS_VIEW_PANNER: true, CLASS_VIEW_ZOOMER: true };

// Define base functions.
Drawer2DHelper.BaseTool = function()
{
    this.CLASS_LIST = [Drawer2DHelper.typeHelper.CLASS_BASE_TOOL];

    this.handlePointerDown = (displayCtx, drawCtx, x, y, dx, dy) =>
    {
        // Dummy function. Override this.
        throw "HandlePointerDown must be overridden (BaseTool of Drawer2DHelper).";
    };
    
    this.handlePointerMove = (displayCtx, drawCtx, x, y, dx, dy) =>
    {
        throw "HandlePointerMove was not overridden! It MUST be.";
    };
    
    // Note: Here, dx and dy are the TOTAL DELTA X/Y, from 
    //pointer down to pointer up, while this is not the case
    //for the other events.
    this.handlePointerUp = (displayCtx, drawCtx, x, y, dx, dy) =>
    {
        throw "HandlePointerUp was not overridden! Please, override this!";
    };
};

Drawer2DHelper.BasePen = function(width, color)
{
    this.__proto__ = new Drawer2DHelper.BaseTool();
    
    this.CLASS_LIST.push(Drawer2DHelper.typeHelper.CLASS_BASE_PEN);

    var me = this;
    
    me.width = width || 5;
    me.color = color || "rgba(0, 0, 0, 0.8)";
    
    this.setColor = (newColor) =>
    {
        me.color = color;
    };
    
    let lastX, lastY, vx = 0, vy = 0, 
            smoothingIterations = 10, lastTime,
            lastWeight = 0.2,
            towardsCursorRate = 0.6,
            currentX,
            currentY;
    this.handlePointerDown = (displayCtx, drawCtx, x, y, dx, dy, pressure) =>
    {
        drawCtx.beginPath();
        drawCtx.moveTo(x, y);
        
        lastX = x;
        lastY = y;
        
        currentX = x;
        currentY = y;
        
        vx = 0;
        vy = 0;
        
        lastTime = new Date().getTime();
    };
    
    this.handlePointerMove = (displayCtx, drawCtx, x, y, dx, dy, pressure) =>
    {
        let nowTime = (new Date()).getTime();
        let dt = Math.max(nowTime - lastTime, 1);
        
        dt = Math.min(dt, 100);
        
        drawCtx.save();
        
        drawCtx.lineWidth = me.width * (pressure) * 2.0; // Pressure is at 0.5 by default.
        drawCtx.strokeStyle = me.color;
        drawCtx.lineCap = "round";
        drawCtx.lineJoin = "round";
        
        let oldVx = vx;
        let oldVy = vy;
        let currentMultiplier = 0;
        
        for (let i = 0; i < smoothingIterations; i++)
        {
            let distanceFromCursor = Math.sqrt(Math.pow(x - currentX, 2) + Math.pow(y - currentY, 2));
            
            currentMultiplier = Math.min(1, lastWeight * (2 - i / smoothingIterations));
            
            vx = oldVx * currentMultiplier + ((x - lastX) * (1 - currentMultiplier) / dt + (x - currentX) / dt * towardsCursorRate) * i / smoothingIterations;
            vy = oldVy * currentMultiplier + ((y - lastY) * (1 - currentMultiplier) / dt + (y - currentY) / dt * towardsCursorRate) * i / smoothingIterations;
            
            currentX += vx * dt / smoothingIterations;
            currentY += vy * dt / smoothingIterations;
            
            drawCtx.lineTo(currentX, currentY);
        }
        
        drawCtx.stroke();

        drawCtx.restore();
        
        drawCtx.beginPath();
        drawCtx.moveTo(currentX, currentY);
        
        lastX = x;
        lastY = y;
        
        lastTime = nowTime;
        
        return true; // The view was changed.
    };
    
    this.handlePointerUp = (displayCtx, drawCtx, x, y, dx, dy) =>
    {
        // Do nothing.
    };
};

Drawer2DHelper.CustomizablePen = function(initialWidth, initialColor)
{
    const me = this;
    
    Drawer2DHelper.BasePen.call(this, initialWidth, initialColor);
    
    this.configWindow;
    
    // When this tool is selected.
    this.onInit = () =>
    {
        // Create the config window.
        me.configWindow = SubWindowHelper.create({ title: "Configure Tool", minWidth: "400px", noResize: true, alwaysOnTop: true });
        
        me.colorInput = HTMLHelper.addColorChooser(me.color, // Initial color,
                                                   me.configWindow,
                                                   (newVector, newHTMLColor) =>
        {
            me.color = newHTMLColor;
        }, undefined,
        (tabGroup) =>
        {
            let newInput = tabGroup.addTab("Width", (container) =>
            {
                container.innerHTML = "";
                
                let widthControl = HTMLHelper.addInput("Width", me.width, "range", container,
                        (newWidth) =>
                {
                    me.width = newWidth;
                });
                
                widthControl.min = 1;
                widthControl.max = 60;
                widthControl.step = 3;
            });
        });
        
        me.colorInput.style.width = "50vw";
    };
    
    this.onDeInit = () =>
    {
        me.configWindow.close();
    };
};

Drawer2DHelper.Eraser = function()
{
    const me = this;
    
    Drawer2DHelper.BaseTool.apply(this, arguments);
    
    this.handlePointerDown = function(displayCtx, drawCtx, x, y, dx, dy)
    {
        drawCtx.beginPath();
        drawCtx.moveTo(x, y);
    };
    
    this.handlePointerMove = function(displayCtx, drawCtx, x, y, dx, dy)
    {
        drawCtx.lineTo(x, y);
        
        drawCtx.save();
        drawCtx.clip();
        drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);
        drawCtx.restore();
        
        return true; // Changes were made!
    };
    
    this.handlePointerUp = function(displayCtx, drawCtx, x, y, dx, dy)
    {
        drawCtx.beginPath();
    };
};

Drawer2DHelper.ViewPanner = function(matrixToManipulate)
{
    var me = this;
    
    Drawer2DHelper.BaseTool.apply(this, arguments);
    
    this.CLASS_LIST.push(Drawer2DHelper.typeHelper.CLASS_VIEW_PANNER);
    
    this.mat = matrixToManipulate;
    
    this.handlePointerDown = (displayCtx, drawCtx, x, y, dx, dy) =>
    {
        // Do nothing.
    };
    
    this.handlePointerMove = (displayCtx, drawCtx, x, y, dx, dy) =>
    {
        me.mat.translate([dx, dy, 1]);
    };
    
    this.handlePointerUp = (displayCtx, drawCtx, x, y, dx, dy) =>
    {
        // Do nothing.
    };
};

Drawer2DHelper.ViewZoomer = function(matrixToManipulate)
{
    var me = this;
    
    this.__proto__ = new Drawer2DHelper.BaseTool();
    this.CLASS_LIST.push(Drawer2DHelper.typeHelper.CLASS_VIEW_ZOOMER);
    
    this.mat = matrixToManipulate;
    
    
    this.handlePointerDown = (displayCtx, drawCtx, x, y, dx, dy) =>
    {
        // Do nothing.
    };
    
    this.handlePointerMove = (displayCtx, drawCtx, x, y, dx, dy) =>
    {
        let minPosition = [0, 0, 0];
        let maxPosition = [drawCtx.canvas.width, drawCtx.canvas.height, 0];
        
        let onScreenW = maxPosition[0] - minPosition[0];
        let onScreenH = maxPosition[1] - minPosition[1];
    
        me.mat.translate([-onScreenW / 2, -onScreenH / 2, 0]);
        me.mat.scalarMul(1 + Math.atan(dx + dy) / 9);
        me.mat.translate([onScreenW / 2, onScreenH / 2, 0]);
        
        // Bug fix: The HTML5 canvas does not support
        //changing the bottom row of the Mat33. Change
        //the JavaScript matrix to reflect this.
        me.mat.setAt(2, 2, 1);
        me.mat.setAt(1, 2, 0);
        me.mat.setAt(0, 2, 0);
    };
    
    this.handlePointerUp = (displayCtx, drawCtx, x, y, dx, dy) =>
    {
        // Do nothing.
    };
};
