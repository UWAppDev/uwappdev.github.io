"use strict";

// A simple object to allow the configuration of
//ModelerPoint2Ds.
function ConfigurationHandler(type)
{
    var me = this;
    
    this.get = function()
    {
        return me.type;
    };
    
    this.setType = function(newType)
    {
        me.type = newType;
    };
    
    this.GET = 0;
    this.SET = 1;
    this.GET_INPUT_TYPE = 2;
}

// A 2D point, which does not inherit from Point
//that is to be used to create two-dimensional models.
function ModelerPoint2D(x, y)
{
    var me = this; // Even when the context is changed
                   //through use of functions such as
                   //requestAnimationFrame, a refrence
                   //to the containing ModelerPoint2D
                   //is kept. Please note the warning
                   //about the "sloppyness [sic.]" of this
                   //script.
    
    this.x = x;
    this.y = y;
    this.r = 10;
    this.selected = false;
    this.toDestroy = false;
    this.translateListener = undefined; // A function of this, dx, and dy.
    this.color = "rgba(255, 255, 255, 0.7)";
    this.connectingLineStyle = "#000000";
    this.outlineStyle = "#000000";
    this.isControlPoint = false;
    
    this.getIsControlPoint = function()
    {
        return this.isControlPoint;
    };
    
    this.render = function(ctx, lastPoint, transformMatrix)
    {
        var position = this.getPosition(transformMatrix);
        
        var x = position[0];
        var y = position[1];
        var lineToPoint = null;
        
        // Line from previous to this.
        //Don't do this for control points, unless a different point was
        //set.
        if ((lastPoint && !this.getIsControlPoint()))
        {
            lineToPoint = lastPoint;
        }
        else
        {
            lineToPoint = this.lineToPoint;
        }
        
        if (lineToPoint)
        {
            ctx.beginPath();
            
            var lastPosition = lineToPoint.getPosition(transformMatrix);
            
            ctx.moveTo(x, y);
            ctx.lineTo(lastPosition[0], lastPosition[1]);
            
            ctx.strokeStyle = this.connectingLineStyle;
            
            ctx.stroke();
        }
        
        // Circle.
        
        ctx.strokeStyle = this.outlineStyle;
        
        ctx.beginPath();
        ctx.arc(x, y, this.r, 0, Math.PI * 2, true);
        
        ctx.stroke();
        
        // Selection-based coloring.
        
        if (!this.selected)
        {
            ctx.fillStyle = this.color;
        }
        else
        {
            ctx.fillStyle = "rgba(200, 200, 200, 0.85)";
        }
        
        ctx.fill();
    };
    
    this.select = function()
    {
        this.selected = true;
    };
    
    this.deselect = function()
    {
        this.selected = false;
    };
    
    this.getConfigureOptions = function()
    {
        var result = 
        {
            "X Position": function(command, xPosition)
            {
                var commandType = command.get();
                
                if (commandType === command.SET)
                {
                    var newX;
                    
                    try
                    {
                        newX = parseFloat(xPosition);
                    }
                    catch(e)
                    {
                        console.error("Error! " + e);
                        
                        return false;
                    }
                    
                    me.moveTo(newX, me.y);
                }
                else if (commandType === command.GET)
                {
                    return me.x;
                }
                else if (commandType === command.GET_INPUT_TYPE)
                {
                    return "number";
                }
            },
            
            "Y Position": function(command, yPosition)
            {
                var commandType = command.get();
                
                if (commandType === command.SET)
                {
                    var newY;
                    
                    try
                    {
                        newY = parseFloat(yPosition);
                    }
                    catch(e)
                    {
                        console.error("Error! " + e);
                        
                        return false;
                    }
                    
                    me.moveTo(me.x, newY);
                }
                else if (commandType === command.GET)
                {
                    return me.x;
                }
                else if (commandType === command.GET_INPUT_TYPE)
                {
                    return "number";
                }
            }
        };
        
        return result;
    };
    
    this.destroy = function()
    {
        this.selected = false;
        this.toDestroy = true;
    };
    
    this.translate = function(dx, dy)
    {
        this.x += dx;
        this.y += dy;
        
        if (this.translateListener)
        {
            this.translateListener(this, dx, dy);
        }
    };
    
    this.moveTo = function(x, y)
    {
        var dx = x - me.x;
        var dy = y - me.y;
        
        me.translate(dx, dy);
    };
    
    // Returns the screen position, not [me.x, me.y].
    //Returns an array of [screen x, screen y, element
    //used to help matrix math work].
    this.getPosition = function(transformMatrix)
    {
        var xyArray = [this.x, this.y, 1];
        MatHelper.transformPoint(xyArray, transformMatrix);
        
        return xyArray;
    };
    
    // Checks whether this object has collided with
    //a circle at (x1, y1) with radius = r1, but first
    //transforming this object such that its x and y are
    //in screen space ( {x1, y1} should be in screen-space ).
    //Transform is the transformation matrtix.
    this.checkCollision = function(x1, y1, r1, transform)
    {
        var position = this.getPosition(transform);
        var x2 = position[0];
        var y2 = position[1];
        
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) <= r1 + this.r;
    };
}

function BezierCurveControl(addPointFunction, points)
{
    var me = this;
    
    this.controlPoints = points || [];
    this.curvePoints = [];
    this.addPoint = addPointFunction || function(point) {}; // Allows the addition of new points to be noted by the controlling application.
    
    var shade = Math.floor((Math.random() * 206 + 50) / 2) * 2; // Choose a random point color, to make this curve's control points distinguishable from another's.
    var controlPointColor = "rgba(" + shade + ", " + shade / 2 + ", " + Math.floor(shade * Math.random() * 1.1) + ", 0.9)";
    
    this.resolution = 8;
    
    this.lockPoints3And5 = true;
    
    var movePointToLine = function(pointToMove, lineEnd, lineCenter)
    {
        var dx = lineCenter.x - lineEnd.x;
        var dy = lineCenter.y - lineEnd.y;
        
        pointToMove.x = lineCenter.x + dx;
        pointToMove.y = lineCenter.y + dy;
    };
    
    this.curveConfigureOptions = 
    {
        "Lock 3rd and 5th points: ": function(command, value)
        {
            var commandType = command.get();
            
            if (commandType === command.SET)
            {
                me.lockPoints3And5 = value;
            }
            else if (commandType === command.GET)
            {
                return me.lockPoints3And5;
            }
            else
            {
                return "checkbox";
            }
        },
        "Set Resolution: ": function(command, value)
        {
            var commandType = command.get();
            
            if (commandType === command.SET)
            {
                me.resolution = value;
                
                me.remakeCurve();
            }
            else if (commandType === command.GET)
            {
                return me.resolution;
            }
            else
            {
                return "number";
            }
        }
    };
    
    if (this.controlPoints.length < 7)
    {
        var addToEndPoint;
        
        var curveRadius = 100;
        var lastPoint = undefined;
        
        var makeControlPoint = function(i)
        {
            var newPoint = new ModelerPoint2D(0, 0);
            newPoint.color = controlPointColor;
            newPoint.connectingLineStyle = newPoint.color;
            newPoint.focusPriority = true;
            newPoint.isControlPoint = true;
            newPoint.lineToPoint = lastPoint;  // Set the point to connect to the previous control point.
            
            // Move the point to a reasonable location.
            newPoint.translate((Math.cos(i) * curveRadius + curveRadius/2) * Math.random(), (Math.sin(i) * curveRadius + curveRadius / 2) * Math.random());
            
            // Override the translation listener.
            newPoint.translateListener = function(point, dx, dy)
            {
                if (me.lockPoints3And5)
                {
                    // Lock the 3rd and 5th points.
                    if (i == 2 || i == 4) 
                    {
                        movePointToLine(me.controlPoints[i === 2 ? 4 : 2], me.controlPoints[i], me.controlPoints[3]);
                    } // Move the 3rd and 5th points with the 4th.
                    else if (i == 3)
                    {
                        me.controlPoints[2].translate(dx, dy);
                    }
                }
                
                // If the function to make the curve has been defined,
                if (me.remakeCurve)
                {
                    me.remakeCurve();
                }
            };
            
            newPoint.getConfigureOptions = function()
            {
                return me.curveConfigureOptions;
            };
            
            newPoint.setAddPointFunction = function(newAddPointFunction)
            {
                me.addPoint = newAddPointFunction;
            };
            
            lastPoint = newPoint;
            
            return newPoint;
        };
        
        // Add missing points...
        for (var i = this.controlPoints.length; i < 7; i++)
        {
            addToEndPoint = makeControlPoint(i);
            
            this.addPoint(addToEndPoint);
            this.controlPoints.push(addToEndPoint);
        }
        
        // Move the 3rd and 5th points to locations accross the center
        //from each other to create a smooth curve.
        movePointToLine(me.controlPoints[2], me.controlPoints[4], me.controlPoints[3]);
    }
    
    // Refrence: https://webgl2fundamentals.org/webgl/lessons/webgl-3d-geometry-lathe.html
    var getBezierCurvePoint = function(p1, p2, p3, p4, t)
    {
        var invT = 1 - t;
        var pointX = t*t*t * p1.x + 3 * t*t * invT * p2.x + 3 * t * invT * invT * p3.x + invT * invT * invT * p4.x;
        var pointY = t*t*t * p1.y + 3 * t*t * invT * p2.y + 3 * t * invT * invT * p3.y + invT * invT * invT * p4.y;
        
        return [pointX, pointY];
    };
    
    this.makeBezierCurve = function(p1, p2, p3, p4)
    {
        var newPoint, position, lastPoint = undefined;
        
        if (me.resolution === 0)
        {
            me.resolution = 99;
        }
        
        var dt = 1 / me.resolution;
        
        for (var t = 1; t >= 0; t -= dt)
        {
            position = getBezierCurvePoint(p1, p2, p3, p4, t);
        
            newPoint = new ModelerPoint2D(position[0], position[1]);
            me.curvePoints.push(newPoint);
            
            newPoint.translateListener = function(point, dx, dy)
            {
                // Remove the control points on translation of a sub-point.
                for (var i = 0; i < me.controlPoints.length; i++)
                {
                    me.controlPoints[i].destroy();
                }
            };
            
            this.addPoint(newPoint);
            
            if (lastPoint != undefined)
            {
                dt = Math.sqrt(Math.pow((lastPoint.x - newPoint.x) / dt, 2) + Math.pow((lastPoint.y - newPoint.y) / dt, 2));
                
                if (dt <= 1)
                {
                    dt = me.resolution / 5;
                }
                
                dt = 1 / dt;
                
                dt = Math.max(dt, 1 / me.resolution);
            }
            
            lastPoint = newPoint;
        }
    };
    
    this.remakeCurve = function()
    {
        // Flag all curve points for deletion.
        for (var i = 0; i < me.curvePoints.length; i++)
        {
            me.curvePoints[i].destroy();
        }
        
        // Clear the curve points array.
        me.curvePoints = [];
        
        // Make the curve...
        me.makeBezierCurve(me.controlPoints[0], me.controlPoints[1], me.controlPoints[2], me.controlPoints[3]);
        me.makeBezierCurve(me.controlPoints[3], me.controlPoints[4], me.controlPoints[5], me.controlPoints[6]);
    };
    
    this.remakeCurve();
}

function Modeler2D(onSubmit, initialPoints, undoBuffer, redoBuffer)
{
    var me = this;
    
    const INITIAL_WIDTH = 300;
    const INITIAL_HEIGHT = 150;
    
    this.subWindow = SubWindowHelper.create({ title: "Modeler 2D", content: "", 
            minWidth: INITIAL_WIDTH, minHeight: INITIAL_HEIGHT });
            
    this.subWindow.enableFlex(); // Causes the canvas to grow to fill the window.
    
    var canvas = document.createElement("canvas");
    canvas.style.width = "calc(100% - 5px)";
    canvas.style.height = "auto";
    canvas.style.margin = "0px";
    this.subWindow.content.style.padding = "0px";
    
    var ctx = canvas.getContext("2d");
    
    var pointerActions = { PAN: "PAN", EDIT_POINTS: "EDIT_POINTS" };
    
    var points = initialPoints || [ new ModelerPoint2D(10, 10), new ModelerPoint2D(20, 20) ];
    
    
    if (initialPoints)
    {
        for (var i = 0; i < initialPoints.length; i++)
        {
            // If the point has actions that might lead to 
            //the creation of new points,
            if (initialPoints[i].setAddPointFunction)
            {
                initialPoints[i].setAddPointFunction(function(newPoint)
                {
                    points.push(newPoint); // Note thepoint's creation.
                });
            }
        }
    }
    
    var previousStates = undoBuffer || [];
    var redoStates = redoBuffer || [];
    
    var shouldQuit = false;
    var action = pointerActions.PAN;
    var selectedPoints = [];
    var transformMatrix = Mat33Helper.getTranslateMatrix(INITIAL_WIDTH / 2, INITIAL_HEIGHT / 2);
    
    var zoomRate = 2;
    
    var fileMenu = new SubWindowTab("File");
    var editMenu = new SubWindowTab("Edit");
    var selectionMenu = new SubWindowTab("Selection");
    var helpMenu = new SubWindowTab("Help");
    
    if (onSubmit)
    {
        fileMenu.addCommand("Submit", function()
        {
            var submitPoints = [];
            
            for (var i = 0; i < points.length; i++)
            {
                if (!points[i].getIsControlPoint())
                {
                    submitPoints.push(new Point(points[i].x, points[i].y));
                }
            }
            
            onSubmit(submitPoints, points, previousStates, redoStates);
            
            shouldQuit = true;
            me.subWindow.destroy();
        });
    }
    
    fileMenu.addCommand("Exit", function() 
    {
        me.subWindow.destroy();
        shouldQuit = true;
    });
    
    // When the sub-window is closed...
    me.subWindow.setOnCloseListener(function()
    {
        shouldQuit = true; // Stop the animation loop.
    });
    
    var changePointerControl = function(tab)
    {
        if (action === pointerActions.EDIT_POINTS)
        {
            action = pointerActions.PAN;
            
            tab.setLabel("Edit Points");
        }
        else
        {
            action = pointerActions.EDIT_POINTS;
            
            tab.setLabel("Pan");
        }
    };
    
    var editPointsTab = editMenu.addCommand("Edit Points", function(tab)
    {
        changePointerControl(tab);
    });
    
    var deleteSelection = function()
    {
        // Allow undoing this...
        allowSoftUndo({ deletedThings: true });
    
        var newPoints = [];
        
        for (var i = 0; i < points.length; i++)
        {
            if (!points[i].selected)
            {
                newPoints.push(points[i]);
            }
            else
            {
                points[i].destroy();
            }
        }
        
        points = newPoints;
        selectedPoints = [];
    };
    
    editMenu.addCommand("Sort Points", function(tab)
    {
        allowSoftUndo({ changedPointsOrder: true });
        
        points.sort(function(a, b)
        {
            return a.y - b.y;
        });
    });
    
    var zoomIn = function()
    {
        transformMatrix.zoomCenter(zoomRate, canvas.width, canvas.height);
    };
    
    editMenu.addCommand("Zoom +", function()
    {
        zoomIn();
    });
    
    var zoomOut = function()
    {
        transformMatrix.zoomCenter(1 / zoomRate, canvas.width, canvas.height);
    };
    
    editMenu.addCommand("Zoom -", function()
    {
        zoomOut();
    });
    
    editMenu.addCommand("Reset View", function()
    {
        transformMatrix = Mat33Helper.getTranslateMatrix(0, 0);
    });
    
    var addCurve = function()
    {
        allowSoftUndo({ addedThings: true });
        
        new BezierCurveControl(function(point)
        {
            points.push(point);
        });
    };
    
    editMenu.addCommand("Add Curve", function() 
    {
        addCurve();
    });
    
    var selectAll = function()
    {
        for (var i = 0; i < points.length; i++)
        {
            points[i].select();
            
            selectedPoints.push(points[i]);
        }
    };
    
    selectionMenu.addCommand("Select All", function(tab)
    {
        selectAll();
    });
    
    selectionMenu.addCommand("Delete Selection", function(tab)
    {
        deleteSelection();
    });
    
    var configureSelection = function(allowConfigureMultiple)
    {
        var handlePoint = function(i, point)
        {
            var selectionWindow = SubWindowHelper.create({ title: "Point " + i, content: "" });
            HTMLHelper.addHeader("Point " + i, selectionWindow, "h2");
            
            var pointConfigureContent = point.getConfigureOptions();
            
            var handleConfigureKey = function(key)
            {
                var configFunction = pointConfigureContent[key];
                var option = new ConfigurationHandler();
                
                option.setType(option.GET_INPUT_TYPE);
                var inputType = configFunction(option);
                
                option.setType(option.GET);
                var inputInitialContent = configFunction(option);
                
                HTMLHelper.addBR(selectionWindow);
                HTMLHelper.addLabel(key, selectionWindow);
                
                HTMLHelper.addInput(key, inputInitialContent, inputType, selectionWindow, function(inputValue)
                {
                    option.setType(option.SET);
                    configFunction(option, inputValue);
                });
                
                HTMLHelper.addHR(selectionWindow);
            };
            
            for (var key in pointConfigureContent)
            {
                handleConfigureKey(key);
            }
        };
        
        for (var i = 0; i < selectedPoints.length; i++)
        {
            handlePoint(i, selectedPoints[i]);
                
            if (!allowConfigureMultiple)
            {
                break;
            }
        }
    };
    
    selectionMenu.addCommand("Configure Selection", function(tab)
    {
        configureSelection(true);
    });
    
    helpMenu.addCommand("Keyboard Shortcuts", function(tab)
    {
        var keyShortcutInfo = 
        `
        Keyboard Shortcuts:
        =====================
        a: Select all.
        Shift + click: Select multiple.
        Delete: Delete selection.
        p: Change cursor manipulation action.
        c: Add curve.
        - OR _: Zoom out.
        + OR =: Zoom in.
        
        Shift + Tab: Move another window to the fore.
        Shift + F4: Close the window in the fore.
        `;
        
        SubWindowHelper.alert("Keyboard Shortcuts", keyShortcutInfo);
    });
    
    helpMenu.addCommand("About", function(tab)
    {
        var aboutInformation = window.ABOUT_PROGRAM || "...";
        
        SubWindowHelper.alert("About", aboutInformation);
    });
    
    // Undo
    var getPointsCopy = function()
    {
        var copy = [];
        
        for (var i = 0; i < points.length; i++)
        {
            copy.push(points[i]);
        }
        
        return copy;
    };
    
    const maxUndo = 12;
    
    var redoCommand;
    
    var allowSoftUndo = function (data)
    {
        // So long as things have changed significantly...
        if (!data
             || !(data.deletedThings || data.addedThings || data.redid
             || data.changedPointsOrder))
        {
            return;
        }
        
        previousStates.push(getPointsCopy());
        
        console.log(previousStates[previousStates.length - 1].length);
        softUndo.show();
        
        // Hide redo options.
        if (!data.redid)
        {
            redoStates = [];
            redoCommand.hide();
        }
        
        if (previousStates.length > maxUndo)
        {
            // TODO Replace this with a faster (not in n) method.
            previousStates = previousStates.slice(previousStates.length - maxUndo);
        }
    };
    
    var softUndo = helpMenu.addCommand("Soft Undo", function(tab)
    {
        if (previousStates.length === 1)
        {
            softUndo.hide();
        }
        else if (previousStates.length === 0)
        {
            return;
        }
        
        var revertTo = previousStates.pop();
        
        if ((redoStates.length >= 1 && !ArrayHelper.equals(redoStates[redoStates.length - 1], points))
                || redoStates.length === 0)
        {
            redoStates.push(getPointsCopy());
        }
        
        points = revertTo;
        
        // Unmark all points to be destoryed.
        for (var i = 0; i < points.length; i++)
        {
            points[i].toDestroy = false;
        }
        
        redoCommand.show();
    });
    
    if (previousStates.length === 0)
    {
        softUndo.hide();
    }
    
    redoCommand = helpMenu.addCommand("Redo", function(tab)
    {
        if (redoStates.length === 1)
        {
            tab.hide();
        }
        else if (redoStates.length === 0)
        {
            tab.hide();
            return;
        }
        
        
        var lastRedo = redoStates.pop();
        console.log(lastRedo);
        
        allowSoftUndo({ redid: true });
        
        points = lastRedo;
    }); 
    
    if (redoStates.length === 0)
    {
        redoCommand.hide();
    }
    
    me.subWindow.addTab(fileMenu);
    me.subWindow.addTab(editMenu);
    me.subWindow.addTab(selectionMenu);
    me.subWindow.addTab(helpMenu);
    
    me.subWindow.appendChild(canvas);
    
    var drawAxis = function()
    {
        var yAxisPoint1 = new Point(0, 600, 1);
        var yAxisPoint2 = new Point(0, -600, 1);
        
        yAxisPoint1.transformBy(transformMatrix);
        yAxisPoint2.transformBy(transformMatrix);
        
        ctx.save();
        ctx.strokeStyle = "red";
        
        ctx.beginPath();
        
        ctx.moveTo(yAxisPoint1.x, yAxisPoint1.y);
        ctx.lineTo(yAxisPoint2.x, yAxisPoint2.y);
        
        //console.log(yAxisPoint1.toString() + ", " + yAxisPoint2.toString());
        
        ctx.stroke();
        
        ctx.restore();
    };
    
    this.render = function()
    {
        var lastPoint = undefined;
        var lastNonControlPoint = undefined;
        
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Draw a coordinate axis.
        drawAxis();
        
        var mustDestroyPoints = false;
        
        for (var i = 0; i < points.length; i++)
        {
            if (points[i].toDestroy)
            {
                mustDestroyPoints = true;
                
                continue;
            }
            
            // Only give the point to be rendered the last non-
            //control point to prevent lines being drawn between
            //control and non-control points.
            points[i].render(ctx, lastNonControlPoint, transformMatrix);
            
            lastPoint = points[i];
            
            if (!lastPoint.getIsControlPoint())
            {
                lastNonControlPoint = lastPoint;
            }
        }
        
        // If at least one point was flagged for destruction,
        //remove all that are flagged for destruction.
        if (mustDestroyPoints)
        {
            // Allow undo.
            let deletedControlPoint = false;
            
            // Check the list of all points.
            var newPoints = [];
            
            for (var i = 0; i < points.length; i++)
            {
                if (!points[i].toDestroy)
                {
                    newPoints.push(points[i]);
                }
                else if (points[i].getIsControlPoint())
                {
                    deletedControlPoint = true;
                }
            }
            
            // Check the selection.
            var newSelection = [];
            
            for (var i = 0; i < selectedPoints.length; i++)
            {
                if (!selectedPoints[i].toDestroy)
                {
                    newSelection.push(selectedPoints[i]);
                }
                else if (selectedPoints[i].getIsControlPoint())
                {
                    deletedControlPoint = true;
                }
            }
            
            // Allow undo.
            if (deletedControlPoint)
            {
                allowSoftUndo({ deletedThings: true });
            }
            
            points = newPoints;
            selectedPoints = newSelection;
        }
    };
    
    this.animate = function()
    {
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight)
        {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }
        
        me.render();
        
        if (!shouldQuit)
        {
            requestAnimationFrame(me.animate);
        }
    };
    
    this.animate();
    
    canvas.style.touchAction = "none"; // Prevents default (scrolling/shortcut) action
                                       //on touch of the canvas.
    
    var selectPointsAtLocation = function(x, y, selectMultiple)
    {
        var canSelectMore = true;
        var lastFocus = undefined;
        
        for (var i = points.length - 1; i >= 0; i--)
        {
            if (points[i].checkCollision(x, y, 1, transformMatrix) && (!selectMultiple || !points[i].selected) && (canSelectMore || points[i].focusPriority))
            {
                if (points[i].focusPriority && !selectMultiple && lastFocus)
                {
                    lastFocus.deselect();
                    selectedPoints.pop();
                }
                
                selectedPoints.push(points[i]);
                points[i].select();
                
                if (!selectMultiple)
                {
                    canSelectMore = false;
                    lastFocus = points[i];
                }
            }
            else if (!selectMultiple)
            {
                points[i].deselect();
            }
        }
    };
    
    var pointerDown = false;
    var lastX, lastY;
    var inverseTransform = undefined;
    var shiftKeyPressed = false;
    
    // Arrow key control options.
    var arrowKeySpeed = 7;
    var lastArrowKeyPressTime = (new Date()).getTime();
    var newActionWaitTime = 1000;
    
    var startSelectedAction = function(x, y)
    {   
        lastX = x;
        lastY = y;
        
        // Clear selection if no shift.
        if (!shiftKeyPressed)
        {
            selectedPoints = [];
        }
        
        selectPointsAtLocation(x, y, shiftKeyPressed);
        
        if (action === pointerActions.EDIT_POINTS)
        {
            inverseTransform = transformMatrix.getInverse();
        }
        
        // On right click...
        if (event.button === 2)
        {
            configureSelection(false); // Do NOT configure multiple.
            
            event.preventDefault(); // Don't display the browser's right-click menu.
        }
    };
    
    var doSelectedAction = function(x, y)
    {
        // Nothing can be done without a direction!
        if (lastX === undefined || lastY === undefined)
        {
            lastX = x;
            lastY = y;
            
            return;
        }
        
        var dx = x - lastX;
        var dy = y - lastY;
        
        // Do different things based on the user- 
        //selected action. This might get large...
        //consider switching to a switch statement.
        if (action === pointerActions.PAN)
        {
            transformMatrix.translate([dx, dy]);
        }
        else if (action === pointerActions.EDIT_POINTS)
        {
            // MatHelper.transformPoint CHANGES
            //the contents of the arrays it is given,
            //format the points and transform them
            //so that the x and y - components are
            //in WORLD SPACE -- they match the 
            //transformed space of the points on
            //the screen.
            var currentXYArray = [x, y, 1];
            var lastXYArray = [lastX, lastY, 1];
            
            MatHelper.transformPoint(currentXYArray, inverseTransform);
            MatHelper.transformPoint(lastXYArray, inverseTransform);
            
            var dxScaled = currentXYArray[0] - lastXYArray[0];
            var dyScaled = currentXYArray[1] - lastXYArray[1];
            
            //allowSoftUndo({ dx: dxScaled, dy: dyScaled, selection: ArrayHelper.softCopy(selectedPoints) });
            
            for (var i = 0; i < selectedPoints.length; i++)
            {
                selectedPoints[i].translate(dxScaled, dyScaled);
            }
        }
        
        lastX = x;
        lastY = y;
    };
    
    // Make the canvas focusable (so it can recieve
    //key press input).
    canvas.setAttribute("tabindex", 1);
    
    // Listen for keys used to execute commands.
    canvas.addEventListener("keydown", function(event)
    {
        var nowTime = (new Date()).getTime();
        var arrowKeyPressed = event.key === "ArrowRight" || 
                event.key === "ArrowLeft" ||
                event.key === "ArrowUp" ||
                event.key === "ArrowDown";
        
        if (arrowKeyPressed && nowTime - lastArrowKeyPressTime > newActionWaitTime)
        {
            startSelectedAction(lastX, lastY);
            
            lastArrowKeyPressTime = nowTime;
        }
        
        if (event.key === "Shift")
        {
            shiftKeyPressed = true;
        }
        else if (event.key === "Delete")
        {
            deleteSelection();
        }
        else if (event.key === "a")
        {
            selectAll();
        }
        else if (event.key === "ArrowLeft")
        {
            doSelectedAction((lastX || 0) - arrowKeySpeed, lastY);
        }
        else if (event.key === "ArrowRight")
        {
            doSelectedAction((lastX || 0) + arrowKeySpeed, lastY);
        }
        else if (event.key === "ArrowUp")
        {
            doSelectedAction(lastX, (lastY || 0) - arrowKeySpeed);
        }
        else if (event.key === "ArrowDown")
        {
            doSelectedAction(lastX, (lastY || 0) + arrowKeySpeed);
        }
    }, true);
    
    canvas.addEventListener("keypress", function(event)
    {
        console.log(event.key);
        
        if (event.key === "-" || event.key === "_")
        {
            zoomOut();
        }
        else if (event.key === "+" || event.key === "=")
        {
            zoomIn();
        }
        else if (event.key === "Delete")
        {
            deleteSelection();
        }
        else if (event.key === "p")
        {
            changePointerControl(editPointsTab);
        }
        else if (event.key === "c")
        {
            addCurve();
        }
    }, true);
    
    canvas.addEventListener("keyup", function(event)
    {
        if (event.key === "Shift")
        {
            shiftKeyPressed = false;
        }
    }, true);
    
    JSHelper.Events.registerPointerEvent("down", canvas, function(event)
    {
        var bbox = canvas.getBoundingClientRect();
        var x = event.clientX - bbox.left,
            y = event.clientY - bbox.top;
        
        startSelectedAction(x, y, shiftKeyPressed);
        
        pointerDown = true;
        
        return true;
    }, false);
    
    JSHelper.Events.registerPointerEvent("move", canvas, function(event)
    {
        if (pointerDown)
        {
            var bbox = canvas.getBoundingClientRect();
            var x = event.clientX - bbox.left,
                y = event.clientY - bbox.top;
            
            doSelectedAction(x, y);
        }
    
        return true;
    }, false);
    
    JSHelper.Events.registerPointerEvent("stop", canvas, function()
    {
        pointerDown = false;
        return true;
    }, false);
    
    JSHelper.Events.registerPointerEvent("up", function(event)
    {
        pointerDown = false;
        
        // Don't display the browser's right-click
        //menu.
        if (event.button === 2)
        {
            event.preventDefault();
        }
        
        return true;
    }, false);
    
    // Don't show the default right-click menu.
    canvas.addEventListener("contextmenu", function(event)
    {
        event.preventDefault();
    });
}

