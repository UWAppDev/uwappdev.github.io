"use strict";

var __lineIdCounter = 0;
function Line(ctx, parentEditor, x, y, h, myIndex)
{
    this.ctx = ctx;
    this.text = "";
    this.cursorPosition = 0;
    this.maxCursorPosition = 0;
    this.h = h;
    this.x = x;
    this.y = y;
    this.noXFocusCheck = true;
    this.parentEditor = parentEditor;
    this.hasFocus = false;
    this.hadFocus = false;
    this.syntaxTracker = new SyntaxTracker(this, null, null, parentEditor.syntaxSelector);
    
    this.lastModifiedTime = (new Date()).getTime();
    this.creationTime = (new Date()).getTime();
    this.id = "id_" + (__lineIdCounter++);

    this.lastRefreshText = "";
    this.refreshRequested = true;

    this.editable = true;
    this.onentercommand = null;
    this.setColorFunction = null;

    this.selRange = [];

    this.selColor = "#441164";
    this.color = "white";

    this.flaggedForRemoval = false;

    let me = this; // NON-CONST: ME IS SET WHEN CODE MUST 
                   // CHANGE CONTEXT.

    this.requestRender = function()
    {
        me.parentEditor.render();
    };

    this.requestRefresh = function()
    {
        me.refreshRequested = true;
    };

    this.render = function(index, trueIndex)
    {
        me.y = index * me.h + me.parentEditor.y;

        if (me.y + me.h < 0 || me.x + me.getWidth() < 0 || me.y > me.ctx.canvas.height)
        {
            return;
        }

        const codeEditing = me.parentEditor.isCodeEditing();

        me.refreshHighlitingIfNeeded(trueIndex);

        const getCharColor = function(index)
        {
            // If the user has requested that
            //this line be a specific color
            //(e.g an error message in a console)
            //show this color instead of any other.
            if (me.setColorFunction)
            {
                let colorSetResult = me.setColorFunction(index);
                
                // Did the function actually return a color?
                if (typeof colorSetResult == "string")
                {
                    return colorSetResult;
                }
            }
        
            if (!codeEditing)
            {
                return me.color;
            }

            /*
             Get the context of the current part of
             the line. Stop search with space characters,
             etc.
            */

            //console.log("CHAR: " + currentCharacter);

            const color = me.syntaxTracker.getColorAtIndex(index);

            return color;
        };
        
        const canvasWidth = me.ctx.canvas.width;

        var currentChar, x = me.x, y = me.y,
            hasSelection = me.hasSelection(),
            currentCharW;

        for (var i = 0; i <= me.text.length; i++)
        {
            me.ctx.save();

            if (i < me.text.length)
            {
                currentChar = me.text.charAt(i);

                currentCharW = me.ctx.measureText(currentChar).width;

                if (hasSelection && i >= me.selRange[0] && i < me.selRange[1])
                {
                    me.ctx.fillStyle = me.selColor;

                    me.ctx.fillRect(x, y, currentCharW, me.h);
                }
            }

            if (i === me.cursorPosition && me.hasFocus)
            {
                me.ctx.fillStyle = me.color;
                me.ctx.fillRect(x, y, 1, me.h * 0.99);
            }


            if (i < me.text.length)
            {
                me.ctx.fillStyle = getCharColor(i);

                me.ctx.fillText(currentChar, x, y);

                x += currentCharW;
            }

            me.ctx.restore();
            
            if (x > canvasWidth)
            {
                return;
            }
        }

        /* Show the entire selection! */
        if (hasSelection && (me.text.length === 0 || (me.selRange[1] === me.text.length)))
        {
            me.ctx.save();

            me.ctx.beginPath();
            me.ctx.fillStyle = me.selColor;
            me.ctx.fillRect(x, y, me.ctx.canvas.width, me.h);

            me.ctx.restore();
        }
    };

    this.getWidth = function()
    {
        return me.ctx.measureText(me.text).width;
    };

    this.checkCollision = function(index, point)
    {
        me.y = index * me.h + me.parentEditor.y;

        return (point.x > me.x && point.x < me.x + me.getWidth() || me.noXFocusCheck) && point.y > me.y && point.y < me.y + me.h;
    };

    this.handleClick = function(index, point, screenIndex)
    {
        if (me.checkCollision(screenIndex, point))
        {
            var x = me.x, newX, i;
            var currentChar;

            me.hasFocus = true;

            me.cursorPosition = me.text.length;

            for (i = 0; i < me.text.length; i++)
            {
                currentChar = me.text.charAt(i);

                newX = x + me.ctx.measureText(currentChar).width;

                if (x <= point.x && newX >= point.x)
                {
                    me.cursorPosition = i;
                }

                x = newX;
            }

            if (point.x < me.x)
            {
                me.cursorPosition = 0;
            }

            me.parentEditor.shiftViewIfNecessary(index, screenIndex);
        }
        else
        {
            me.hasFocus = false;
        }

        me.deselect();
    };

    this.prepareToHandleKey = function()
    {
        me.hadFocus = me.hasFocus;
    };

    this.afterHandleKey = function(myIndex)
    {
        if (me.hasFocus)
        {
            me.parentEditor.shiftViewIfNecessary(myIndex, me.text.length);
        } // Did the user transition focus away from us?
        else if (me.hadFocus)
        {
            // Refresh highlighting -- don't force it, but do ignore
            //timeouts.
            me.refreshHighlitingIfNeeded(myIndex, false, true);
        }
    };

    this.transitionFocus = function(fromLine, otherWayLine)
    {
        if (!fromLine)
        {
            return;
        }

        if (fromLine.hadFocus)
        {
            me.hasFocus = true;
            fromLine.hasFocus = false;

            me.cursorPosition = Math.max(fromLine.cursorPosition, fromLine.maxCursorPosition);

            me.maxCursorPosition = me.cursorPosition;

            me.cursorPosition = Math.min(me.text.length, me.cursorPosition);
            
            return () =>
            {
                me.hadFocus = true;
            
                return fromLine.transitionFocus(me);
            };
        }

        if (me.hadFocus && otherWayLine)
        {
            me.hasFocus = false;
            
            return () =>
                me.transitionFocus(otherWayLine);
        }
    };

    this.lrTransitionFocus = function(toLine, direction)
    {
        if (me.hadFocus)
        {
            if (me.cursorPosition + direction >= 0 && me.cursorPosition + direction <= me.text.length)
            {
                me.cursorPosition += direction;
                
                // Returns an undo function.
                return () => 
                {
                    return me.lrTransitionFocus(toLine, -direction);
                };
            }
            else if (toLine)
            {
                me.hasFocus = false;

                toLine.hasFocus = true;

                if (direction < 0)
                {
                    toLine.cursorPosition = toLine.text.length;
                }
                else
                {
                    toLine.cursorPosition = 0;
                }
                
                // Return an undo function.
                return () =>
                {
                    return toLine.lrTransitionFocus(me, -direction);
                };
            }
        }
    };

    this.handleKey = function(key, lineAbove, lineBelow, myIndex, ignoreSpecial)
    {
        if (!me.hasFocus && !me.hadFocus && !me.hasSelection() && lineAbove
            && lineBelow && !lineAbove.hadFocus && !lineBelow.hadFocus)
        {
            return;
        }

        var added = false, undoResult = null;
        
        let topLevelArguments = arguments;
        
        let generalRedo = () =>
        {
            return me.handleKey.apply(me, topLevelArguments);
        };

        if (!ignoreSpecial)
        {
            if (key === "🔽" || key === "ArrowDown")
            {
                undoResult = me.transitionFocus(lineAbove, lineBelow);
                
                me.refreshHighlitingIfNeeded(myIndex, false, true);

                added = true;
            }
            else if (key === "🔼" || key === "ArrowUp")
            {
                undoResult = me.transitionFocus(lineBelow, lineAbove);
                
                me.refreshHighlitingIfNeeded(myIndex, false, true);

                added = true;
            }
            else if (key === "◀️" || key === "ArrowLeft")
            {
                undoResult = me.lrTransitionFocus(lineAbove, -1);

                added = true;

                me.maxCursorPosition = 0;
            }
            else if (key === "▶️" || key === "ArrowRight")
            {
                undoResult = me.lrTransitionFocus(lineBelow, 1);

                added = true;

                me.maxCursorPosition = 0;
            }
        }

        var hasSelection = me.hasSelection();

        if (hasSelection && !added && me.parentEditor.editable && me.editable)
        {
            let oldText = me.text + "";
            
            let oldHasFocus = me.hasFocus;
            
            const selStart = me.selRange[0],
                  selEnd = me.selRange[1],
                  cursorPosition = me.cursorPosition;
            
            let removeAction = () =>
            {
                me.text = me.text.substring(0, selStart) + me.text.substring(selEnd);

                me.cursorPosition = selStart;

                me.deselect();
                
                return undoResult;
            };
            
            undoResult = (lineHelper) =>
            {
                me.text = oldText;
                
                me.cursorPosition = cursorPosition;
                me.selRange = [selStart, selEnd];
                
                me.hasFocus = oldHasFocus;
                
                console.log("Undid! Text: " + oldText);
                
                return removeAction;
            };
            
            removeAction();
        }

        if (me.hadFocus && !added && me.parentEditor.editable && me.editable)
        {
            if ((key === "⏪" || key === "Backspace") && !ignoreSpecial)
            {
                if (me.cursorPosition === 0)
                {
                    if (lineAbove)
                    {
                        me.flaggedForRemoval = true;

                        me.lrTransitionFocus(lineAbove, -1);

                        lineAbove.text += me.text;
                        let myText = me.text;
                        
                        let priorTextAbove = lineAbove.text;
                        
                        undoResult = (lineHelper) =>
                        {
                            // Insert this line.
                            if (me.flaggedForRemoval)
                            {
                                me.flaggedForRemoval = false;
                                lineHelper.insertLineObject(myIndex, me);
                            }
                            
                            me.cursorPosition = 0;
                            me.focus();
                            
                            return generalRedo;
                        };
                    }
                }
                else if (!hasSelection)
                {
                    me.cursorPosition--;
                    
                    let oldText = me.text;

                    me.text = me.text.substring(0, me.cursorPosition) + me.text.substring(me.cursorPosition + 1);
                    
                    undoResult = () =>
                    {
                        me.cursorPosition++;
                        
                        me.text = oldText;
                        
                        return generalRedo;
                    };
                }
            }
            else if (((key === "⏬" || key === "Enter") && !ignoreSpecial) || key === "\n")
            {
                if (!me.onentercommand)
                {
                    var movedText = me.text.substring(me.cursorPosition);
                    me.text = me.text.substring(0, me.cursorPosition);

                    var originalMovedText = movedText;

                    if (me.parentEditor.isCodeEditing() && key !== "\n")
                    {
                        movedText = me.getStartingSpace() + movedText;
                    }


                    var newLine = me.parentEditor.addLine(myIndex + 1, movedText);

                    me.lrTransitionFocus(newLine, 1);

                    newLine.cursorPosition = newLine.text.length - originalMovedText.length;
                    newLine.refreshHighlitingIfNeeded(myIndex + 1);
                    
                    me.requestRefresh();
                    
                    undoResult = () =>
                    {
                        me.text = me.text + movedText;
                        me.cursorPosition = me.text.length - movedText.length;
                        me.focus();
                        
                        // Remove the new line.
                        newLine.flaggedForRemoval = true;
                    
                        me.requestRefresh();
                        
                        return generalRedo;
                    };
                }
            }
            else
            {
                var toInsert = key;

                if (key === "_SPACE_" && !ignoreSpecial)
                {
                    toInsert = " ";
                }
                else if (key === "Tab" && !ignoreSpecial)
                {
                    toInsert = "    ";
                }

                let priorText = me.text;
                
                me.text = me.text.substring(0, me.cursorPosition) + toInsert + me.text.substring(me.cursorPosition);

                me.cursorPosition += toInsert.length;
                me.maxCursorPosition = 0;
                
                undoResult = () =>
                {
                    me.text = priorText;
                    me.cursorPosition -= toInsert.length;
                    
                    return generalRedo;
                };
            }
        }

        if (hasSelection && !added && me.text.length === 0)
        {
            me.flaggedForRemoval = true;
            
            let oldUndoResult = undoResult,
                oldRedoResult;
            let oldIndex = myIndex;
            
            undoResult = (lineHelper) =>
            {
                if (me.flaggedForRemoval)
                {
                    me.parentEditor.removeLinesFlaggedForRemoval();
                    
                    me.flaggedForRemoval = false;
                    lineHelper.insertLineObject(oldIndex, me);
                }
                
                if (oldUndoResult)
                {
                    console.log("IT DID EXIST!");
                    
                    oldRedoResult = oldUndoResult(lineHelper, me);
                }
            
                return () =>
                {
                    me.flaggedForRemoval = true;
                    me.requestRefresh();
                    
                    return undoResult;
                };
            };
        }

        if (me.hadFocus && me.onentercommand && (key === "⏬" || key === "\n" || key === "Enter"))
        {
            me.onentercommand(me, myIndex);
        }

        me.updateModifiedTime();
        me.refreshHighlitingIfNeeded(myIndex);
        
        // Permits general undoing and redoing.
        return undoResult;
    };

    this.refreshHighlitingIfNeeded = function(myIndex, force, ignoreTimeout)
    {
        const codeEditing = me.parentEditor.isCodeEditing();

        me.syntaxTracker.nextLine = me.parentEditor.lines[myIndex + 1];
        me.syntaxTracker.previousLine = me.parentEditor.lines[myIndex - 1];

        // If code-editing, update the next and previous lines.
        if (codeEditing && (me.lastRefreshText != me.text || force || me.refreshRequested))
        {
            // Also update the highliting.
            me.syntaxTracker.refreshHighliting(ignoreTimeout).then(() =>
            {
                me.lastRefreshText = me.text + ""; // Cache the line's text.

                me.refreshRequested = false;
            });
        }
    };
    
    this.getText = function()
    {
        return me.text;
    };
    
    this.setText = function(newText)
    {
        var oldText = me.text + "";
        
        me.text = newText;
        
        if (oldText !== newText)
        {
            me.lastModifiedTime = (new Date()).getTime();
        }
    };
    
    var lastText = "";
    this.updateModifiedTime = function()
    {
        if (me.text !== lastText)
        {
            me.lastModifiedTime = (new Date()).getTime();
        }
    };
    
    this.setModifiedTime = function(lastTime)
    {
        me.lastModifiedTime = lastTime;
        
        lastText = me.text;
    };
    
    this.getLastTimeModified = function()
    {
        return me.lastModifiedTime;
    };

    this.select = function(selStart, selEnd)
    {
        me.selRange = [Math.max(0, selStart || 0), Math.min(selEnd !== undefined ? selEnd : me.text.length, me.text.length)];
    };

    this.deselect = function()
    {
        me.selRange = [];
    };

    this.hasSelection = function()
    {
        return me.selRange.length === 2;/* && me.selRange[0] !== me.selRange[1];*/
    };

    this.getSelectedText = function()
    {
        if (!me.hasSelection())
        {
            return "";
        }

        var selStart = me.selRange[0],
            selEnd   = me.selRange[1];

        return me.text.substring(selStart, selEnd);
    };

    this.getStartingSpace = function()
    {
        var result = "", currentChar;

        for (var i = 0; i < me.text.length; i++)
        {
            currentChar = me.text.charAt(i);

            if (currentChar !== " ")
            {
                return result;
            }

            result += currentChar;
        }

        return result;
    };

    this.indent = function(spacesCount)
    {
        var startingSpaces = "";

        for (var i = 0; i < spacesCount; i++)
        {
            startingSpaces += " ";
        }

        if (me.parentEditor.editable && me.editable)
        {
            me.text = startingSpaces + me.text;
        }
        
        me.updateModifiedTime();
    };

    this.deindent = function(maxSpaces)
    {
        var totalSpaces = me.getStartingSpace().length;

        maxSpaces = Math.min(totalSpaces, maxSpaces);

        if (me.parentEditor.editable && me.editable)
        {
            me.text = me.text.substring(maxSpaces);
        }
        
        me.updateModifiedTime();
    };

    this.focus = function()
    {
        me.parentEditor.unfocus();

        me.hasFocus = true;
        me.hadFocus = true;
    };

    this.unfocus = function()
    {
        me.hasFocus = false;
        me.hadFocus = false;
    };
}

