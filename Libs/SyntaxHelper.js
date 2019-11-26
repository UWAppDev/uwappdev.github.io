"use strict";

var SyntaxHelper =
{
    END_OF_LINE: -12,
    COMMENT: "COMMENT",
    COMMENT_MULTI_LINE: "COMMENT_MULTI_LINE",
    COMMENT_HTML: "COMMENT_HTML",
    STRING: "QUOTE",
    NUMBER_START: "NUMBER_START",
    NUMBER_STOP: "NUMBER_STOP",
    STANDARD_SEPARATORS: ">(<, \t*%:-+/!=.){}[];",
    CSS_LABEL_SEPARATORS: "[],{}; :\t",
    SEARCH_ALL: { all: true },
    SINGLE_CHAR_SEPARATOR: "",
    NUMBER_SEPARATORS: ">(<, \t*%/!=){}",
    COMPARISON_SEARCH_SEPARATOR: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890 \t[]()_?!",

    LABEL_SINGLE: "SINGLE_LABEL",
    LABEL_START: "START_LABEL",
    LABEL_END: "END_LABEL",
    LABEL_CONTINUED: "CONTINUED_LABEL",

    SCRIPT_BLOCK: "SCRIPT_BLOCK",
    STYLE_BLOCK: "STYLE_BLOCK"
};

SyntaxHelper.regexps =
{
    NUMBER_START: new RegExp("(?:^|[\\( \\t\\=\\/\\+\\-\\#\\;])\\d+(?:[\\. \\t\\=\\/\\+\\-\\#\\;\\)\\,]|$)", "g"),
    NUMBER_STOP: new RegExp("\\.\\d+(?:[\\. \\t\\=\\/\\+\\-\\#\\;\\)\\,]|$)", "g")
};

SyntaxHelper.highlighters = { "js": new JavaScriptHighlightScheme(), "css": new CSSSyntaxHighlightScheme(), "html": new HTMLSyntaxHighlightScheme(),
                    "sh": new BashHighlightScheme(),
                    "java": new JavaHighlightScheme(),
                    "python": new PythonHighlightScheme() };

SyntaxHelper.fileExtensionToHighlighterMap =
{
    js: SyntaxHelper.highlighters.js,
    css: SyntaxHelper.highlighters.css,
    html: SyntaxHelper.highlighters.html,
    htm: SyntaxHelper.highlighters.html,
    sh: SyntaxHelper.highlighters.sh,
    java: SyntaxHelper.highlighters.java,
    py: SyntaxHelper.highlighters.python
};

SyntaxHelper.getStillOpenBrackets = function(text, 
        bracketOpenChar, bracketCloseChar, countOpenBefore,
        quoteChars, inQuote)
{
    var result = countOpenBefore || 0;
    var currentChar;
    
    var inQuote = inQuote || false;
    
    quoteChars = quoteChars || {};
    
    for (let i = 0; i < text.length; i++)
    {
        currentChar = text.charAt(i);
        
        if (currentChar === bracketOpenChar && !inQuote)
        {
            result ++;
        }
        else if (currentChar === bracketCloseChar && !inQuote)
        {
            result --;
        }
        else if (quoteChars[currentChar])
        {
            inQuote = !inQuote;
        }
    }
    
    return result;
};

function SyntaxChecker()
{
    const me = this;
    
    this.state = {};
    
    this.quoteChars =
    {
        "'": true,
        '\"': true,
        '`': true
    };
    
    this.navigationHelper =
    {
        levelCheckChars: [["[", "]"],
                          ["{", "}"],
                          ["(", ")"]],
                          
        // Note: THIS MUST BE CALLED FOR EVERY LINE,
        //in order of the line's number -- lineNo should
        //increase by 1 each call.       
        recordLevel: (state, text, lineNo) =>
        {
            if (!state.subZero)
            {
                state.subZero = {};
            }
            
            if (state.lastLineWithBracketCheck === lineNo)
            {
                console.log ("Error: state.lastLineWithBracketCheck === lineNo === " + lineNo);
                
                return;
            }
            
            state.lastLineWithBracketCheck = lineNo;
            
            var startLabel, endLabel;
        
            for (var i in me.navigationHelper.levelCheckChars)
            {
                startLabel = me.navigationHelper.levelCheckChars[i][0];
                endLabel = me.navigationHelper.levelCheckChars[i][1];
                
                if (state["openBrackets" + startLabel] === undefined)
                {
                    state["openBrackets" + startLabel] = [];
                }
                
                state["openBrackets" + startLabel][lineNo] = ( 
                  SyntaxHelper.getStillOpenBrackets(text, 
                    startLabel, 
                    endLabel, 
                    state["openBrackets" + startLabel][lineNo - 1] || 0,
                    me.quoteChars ));
                    
                state["openBrackets" + startLabel].length = lineNo + 1;
                    
                if (state["openBrackets" + startLabel] < 0)
                {
                    state.subZero[lineNo] = [startLabel, state["openBrackets"]];
                }
            }
        },
        
        getLastLineBelowLevel: (state, level, levelCheckChar) =>
        {
            var levelRecords = state["openBrackets" + levelCheckChar];
            
            for (let i = levelRecords.length - 1; i >= 0; i++)
            {
                if (levelRecords[i] < level)
                {
                    return i;
                }
            }
            
            return -1; // If -1 is returned, no lines were below
                       //the requested level.
        },
        
        getBracketsBelowOrAboveLevelOnLine: (state, lineNumber, level, belowLevel) =>
        {
            var currentGroupingCharacter, currentLevel;
            var count = {}; // Accumulates the number of open brackets on a specific line.
            
            // For/in for flexibility.
            for (var label in me.navigationHelper.levelCheckChars)
            {
                currentGroupingCharacter = me.navigationHelper.levelCheckChars[label][0];
                
                currentLevel = state["openBrackets" + currentGroupingCharacter][lineNumber];
                
                if (count[currentGroupingCharacter] === undefined)
                {
                    count[currentGroupingCharacter] = 0;
                }
                
                if (state["openBrackets" + currentGroupingCharacter][lineNumber] < level && belowLevel
                    || 
                    state["openBrackets" + currentGroupingCharacter][lineNumber] > level && !belowLevel)
                {
                    count[currentGroupingCharacter] = 1;
                }
            }
            
            return count;
        },
        
        getBracketsBelowLevelOnLine: (state, lineNumber, level) =>
        {
            return me.navigationHelper.getBracketsBelowOrAboveLevelOnLine(state, lineNumber, level, true);
        },
        
        getBracketsAboveLevelOnLine: (state, lineNumber, level) =>
        {
            return me.navigationHelper.getBracketsBelowOrAboveLevelOnLine(state, lineNumber, level, false);
        }
    };
    
    this.errorCheckers =
    {
        unendedString: (state, text) =>
        {
            var currentChar = "",
                lastChar    = "";
            var inSingleQuote = false;
            var inDoubleQuote = false;
            
            for (var i = 0; i < text.length; i++)
            {
                currentChar = text.charAt(i);
                
                if (currentChar === "'"
                    && lastChar !== '\\'
                     && !inDoubleQuote)
                {
                    inSingleQuote = !inSingleQuote;
                }
                else if (currentChar === '\"'
                    && lastChar !== '\\'
                    && !inSingleQuote)
                {
                    inDoubleQuote = !inDoubleQuote;
                }
                
                lastChar = currentChar;
            }
            
            return inSingleQuote || inDoubleQuote;
        },
        
        // Note that lineNo is the line number, where no
        //is a poor abbrievation for number. You might
        //want to rename this.
        bracketLevelError: (state, text, lineNo, isLastLine) =>
        {
            me.navigationHelper.recordLevel(state, text, lineNo);
            
            let message = undefined;
            
            // If any brackets have a level lesser than zero:
            var bracketsBelowZero = me.navigationHelper.getBracketsBelowLevelOnLine(state, lineNo, 0);
            
            if (JSON.stringify(bracketsBelowZero) != JSON.stringify(state.lastLineBelowZero || {}))
            {
                if (message === undefined)
                {
                    message = "";
                }
            
                var totalBelowZero = 0;
                
                for (var bracket in bracketsBelowZero)
                {
                    totalBelowZero += bracketsBelowZero[bracket];
                    
                    if (bracketsBelowZero[bracket] > 0)
                    {
                        message += "The bracket level for " + bracket + " is below zero. ";
                    }
                }
                
                state.lastLineBelowZero = bracketsBelowZero;
            }
            
            if (isLastLine)
            {
                var bracketsAboveZero = me.navigationHelper.getBracketsAboveLevelOnLine(state, lineNo, 0);
                
                var totalAboveZero = 0;
                
                for (var bracket in bracketsAboveZero)
                {
                    totalAboveZero += bracketsAboveZero[bracket];
                    
                    if (bracketsAboveZero[bracket])
                    {
                        message = message || "";
                        message += "Bracket " + bracket + " has no end. ";
                    }
                }
            }
            
            return message;
        }
    };
    
    this.checkFunctions =
    {
        "Line Level Check": me.errorCheckers.bracketLevelError
    };

    this.reset = function()
    {
        me.state = {};
        me.state.problems = [];
    };
    
    this.setBaseProblems = function(baseProblems)
    {
        me.state.problems = baseProblems;
    };

    this.checkLine = function(lineText, lineNumber, lastLine, lineLabels)
    {
        var currentMessage = undefined;
        
        if (lineText === undefined)
        {
            return;
        }
        
        for (var key in me.checkFunctions)
        {
            currentMessage = me.checkFunctions[key](me.state, lineText, lineNumber, lastLine || false);
            
            if (currentMessage)
            {
                me.state.problems.push(
                {
                    check: key,
                    lineNumber: lineNumber,
                    lineText: lineText,
                    message: currentMessage
                });
            }
        }
    };
    
    this.checkFinalLine = function(lineText, lineNumber, lineLabels)
    {
        me.checkLine(lineText, lineNumber, true);
    };
    
    this.getProblems = function()
    {
        return me.state.problems;
    };
}

SyntaxHelper.makeChecker = () =>
{
    return new SyntaxChecker();
};


function SyntaxSelector(initialHighlightScheme)
{
    const me = this;
    me.baseColor = "white";
    me.highlightScheme = initialHighlightScheme || (new HTMLSyntaxHighlightScheme());

    this.setDefaultHighlightScheme = function(key)
    {
        if (typeof (key) === "string")
        {
            if (key in SyntaxHelper.fileExtensionToHighlighterMap)
            {
                me.highlightScheme = SyntaxHelper.fileExtensionToHighlighterMap[key];
                return true;
            }
        }
        else if (typeof (key) === "object")
        {
            me.highlightScheme = key;

            return true;
        }

        return false;
    };

    this.getDefaultHighlighter = function()
    {
        return me.highlightScheme;
    };

    this.setDefaultHighlighter = function(key)
    {
        me.setDefaultHighlightScheme(key);
    };

    this.getBaseColor = function()
    {
        return me.baseColor;
    };

    /* Give only applicable labels. */
    this.getColor = function(labels)
    {
        let j, k, l, currentLabel, samePrecedenceLabels;

        let sortedLabels = getDepthSortedLabels(labels);

        /* Do any request a specific highlighter? */
        let isMissingDependency = me.getMissingDependencyCheck(labels);//, sortedLabels);
        let highlightScheme = me.getHighlightScheme(labels, isMissingDependency, sortedLabels);

        /* DANGER! This loop returns! */
        for (let i = 0; i < highlightScheme.labelPrecedence.length; i++)
        {
            /* If there are multiple labels with the same precedence,
            choose the one that started first. */
            if (typeof (highlightScheme.labelPrecedence[i]) === "object")
            {
                samePrecedenceLabels = [];
                for (j = 0; j < highlightScheme.labelPrecedence[i].length; j++)
                {
                    currentLabel = highlightScheme.labelPrecedence[i][j];

                    if (currentLabel in labels)
                    {
                        for (k = 0; k < labels[currentLabel].length; k++)
                        {
                            if (!isMissingDependency(labels[currentLabel][k]))
                            {
                                samePrecedenceLabels.push(labels[currentLabel][k]);
                            }
                        }
                    }
                }

                /* Sort the labels by which occurs first. */
                samePrecedenceLabels.sort(function(first, second)
                {
                    return first.startIndex - second.startIndex;
                });

                /* Choose the first, if any, that is applicable. */
                if (samePrecedenceLabels.length > 0)
                {
                    return highlightScheme.labelMap[samePrecedenceLabels[0].tagName];
                }
            }
            else /* Otherwise, if only one with the same precedence, */
            {
                currentLabel = highlightScheme.labelPrecedence[i];

                if (currentLabel in labels)
                {
                    let missingDependencyCount = 0;

                    for (l = 0; l < labels[currentLabel].length; l++)
                    {
                        if (isMissingDependency(labels[currentLabel][l]))
                        {
                            missingDependencyCount++;
                        }
                    }

                    if (missingDependencyCount !== labels[currentLabel].length)
                    {
                        return highlightScheme.labelMap[currentLabel];
                    }
                }
            }
        }

        /* No matching tags... */
        return me.getBaseColor();
    };

    this.getLabelIndicies = function(text, indexOffset, highlightScheme)
    {
        highlightScheme = highlightScheme || me.highlightScheme;

        var result = {};
        indexOffset = indexOffset || 0;

        var noteLabel = function(labelName, indexStart, indexStop, labelType, linkTo)
        {
            if (!result[labelName])
            {
                result[labelName] = [];
            }

            if (indexStart >= 0)
            {
                indexStart += indexOffset;
            }

            if (indexStop >= 0)
            {
                indexStop += indexOffset;
            }

            if (highlightScheme.labelExtensions && highlightScheme.labelExtensions.end[labelName] && indexStop >= 0
                    && labelType !== SyntaxHelper.LABEL_START)
            {
                if (labelType === SyntaxHelper.LABEL_END)
                {
                    indexStart += highlightScheme.labelExtensions.end[labelName];
                }

                indexStop += highlightScheme.labelExtensions.end[labelName];
            }

            if (highlightScheme.labelExtensions && highlightScheme.labelExtensions.start[labelName] && indexStart >= 0
                    && labelType !== SyntaxHelper.LABEL_END)
            {
                if (labelType === SyntaxHelper.LABEL_START)
                {
                    indexStop += highlightScheme.labelExtensions.start[labelName];
                }

                indexStart += highlightScheme.labelExtensions.start[labelName];
            }

            let newLabel = new SyntaxLabel(labelName, indexStart, indexStop, labelType, linkTo);

            result[labelName].push(newLabel);

            return newLabel;
        };

        var handlePart = function(labelName, partContent, partIndex)
        {
            var handledPart = false;
            var startRegex = highlightScheme.labelSearchRegexes.start[labelName];
            var stopRegex = highlightScheme.labelSearchRegexes.end[labelName];

            var handleRegex = function(content, regex, markerType, mirrorLabels)
            {
                var lastIndex = -1, regexResult, currentIndex, currentEndIndex, mirrorLabel = undefined, shouldContinue,
                        currentChar;
                let result = {};

                //console.warn(mirrorLabels);
                regex.lastIndex = 0;

                do
                {
                    regexResult = regex.exec(content);

                    if (regexResult != null)
                    {
                        currentIndex = regexResult.index;
                        currentEndIndex = regex.lastIndex;

                        if (currentIndex > 0 && content.charAt(currentIndex - 1) === "\\")
                        {
                            shouldContinue = false;
                            
                            let walkbackIndex = 1, count = 0;
                            
                            do
                            {
                                currentChar = content.charAt(currentIndex - walkbackIndex);
                                
                                count++;
                                
                                walkbackIndex++;
                            }
                            while (currentChar === "\\" && currentIndex - walkbackIndex >= 0);
                            
                            if (count % 2 === 0) // === because count++ also happens for first non backslash character.
                            {
                                continue;
                            }
                        }

                        if (mirrorLabels && currentIndex in mirrorLabels && mirrorLabels[currentIndex].end === currentEndIndex
                            && mirrorLabels[currentIndex].content == regexResult[0])
                        {
                            mirrorLabel = mirrorLabels[currentIndex].label;
                        }

                        result[currentIndex] = { end: currentEndIndex, label: noteLabel(labelName, currentIndex, currentEndIndex, markerType, mirrorLabel),
                                                 content: regexResult[0] };
                    }
                    else
                    {
                        break;
                    }
                }
                while (lastIndex < currentIndex);

                return result;
            };

            var startLabels = [];

            if (startRegex && startRegex.exec)
            {
                startLabels = handleRegex(partContent, startRegex, SyntaxHelper.LABEL_START);

                handledPart = true;
            }

            if (stopRegex && stopRegex.exec)
            {
                handleRegex(partContent, stopRegex, SyntaxHelper.LABEL_END, startLabels);

                handledPart = true;
            }

            // If another method was not used,
            //check whether the part is equivalent to
            //the label's name.
            if (!handledPart)
            {
                if (partContent === labelName)
                {
                    noteLabel(labelName, partIndex - labelName.length, partIndex, SyntaxHelper.LABEL_SINGLE);
                }
            }
        };

        var handleLabel = function(labelName)
        {
            // Check for a splitting method...
            if (highlightScheme.labelSearchSeparators[labelName] !== SyntaxHelper.SEARCH_ALL)
            {
                // Use the standard separator if none were specified.
                var splitMethod = highlightScheme.labelSearchSeparators[labelName] !== undefined ? highlightScheme.labelSearchSeparators[labelName] : SyntaxHelper.STANDARD_SEPARATORS;
                var splitChars = {};
                var index;

                var splitAll = (splitMethod === SyntaxHelper.SINGLE_CHAR_SEPARATOR || splitMethod.length === 0);
                var indexShift = 0;

                if (splitAll)
                {
                    indexShift = 1;
                }

                var buffer = "", currentChar;

                for (index = 0; index < splitMethod.length; index++)
                {
                    currentChar = splitMethod.charAt(index);

                    // Note the current character's usability as a split character.
                    splitChars[currentChar] = true;
                }

                // Handle each part of the text.
                for (index = 0; index <= text.length; index++)
                {
                    // If a character is to be accessed,
                    if (index < text.length)
                    {
                        currentChar = text.charAt(index);
                    }

                    // If ending, or the current character is to be used to split segments,
                    if (index === text.length || (splitAll && currentChar !== "\\") || currentChar in splitChars)
                    {
                        if (splitAll && index !== text.length)
                        {
                            buffer += currentChar;
                        }

                        //console.log("Handling part: " + buffer + " at index " + index + ". Label: " + labelName + ".");
                        handlePart(labelName, buffer, index + indexShift, highlightScheme);

                        buffer = "";
                    }
                    else // Otherwise, add to the buffer.
                    {
                        buffer += currentChar;
                    }
                }
            }
            else
            {
                handlePart(labelName, text, 0, highlightScheme);
            }
        };

        /* For all findable labels... */
        for (var labelName in highlightScheme.labelMap)
        {
            handleLabel(labelName);
        }

        return result;
    };

    this.labelCanMultiLine = function(labelName, highlightScheme)
    {
        highlightScheme = highlightScheme || me.highlightScheme;

        if (highlightScheme.multiLineLabels && labelName in highlightScheme.multiLineLabels)
        {
            return highlightScheme.multiLineLabels[labelName];
        }

        return false;
    };

    var getDepthSortedLabels = function(appliedLabels)
    {
        var allLabels = [];
        var i;

        for (var label in appliedLabels)
        {
            for (i = 0; i < appliedLabels[label].length; i++)
            {
                allLabels.push(appliedLabels[label][i]);
            }
        }

        allLabels.sort((a, b) => (a.depth - b.depth));

        return allLabels;
    };

    this.getHighlightScheme = function(appliedLabels, missingDependencyCheck, sortedLabels)
    {
        var allLabels = sortedLabels || getDepthSortedLabels(appliedLabels);

        var highlightSignificantLabels = [];
        var lastHighlighter = me.highlightScheme;

        for (var i = 0; i < allLabels.length; i++)
        {
            if (lastHighlighter.highlightSchemeSpecificLabels[allLabels[i].tagName] && !missingDependencyCheck(allLabels[i]))
            {
                lastHighlighter = lastHighlighter.highlightSchemeSpecificLabels[ allLabels[i].tagName ];

                //console.log("SWITCHED HIGHLIGHTER AT REQUEST OF " + allLabels[i].tagName);
            }
        }

        return lastHighlighter;
    };

    this.getMissingDependencyCheck = function(appliedLabels)
    {
        var allLabelIds = {};
        var i = 0;

        for (var labelName in appliedLabels)
        {
            for (i = 0; i < appliedLabels[labelName].length; i++)
            {
                allLabelIds[appliedLabels[labelName][i].getId()] = true;//appliedLabels[labelName][i];
            }
        }

        //console.log(allLabelIds);

        // Whether MISSING a dependency.
        var depCheck =
        (labelObject) =>
        {
            //console.log(labelObject.dependsOn);

            for (var key in labelObject.dependsOn)
            {
                if (!allLabelIds[key])
                {
                    return true;
                }
            }

            return false;
        };

        return depCheck;
    };

    this.labelSwapsHighlighter = function(label, highlighter)
    {
        return highlighter.highlightSchemeSpecificLabels[label] !== undefined;
    };
}

let __LABEL_ID__ = 0;
function SyntaxLabel(tagName, startIndex, endIndex, labelType, linkTo)
{
    const me = this;

    this.tagName = tagName;

    this.startIndex = startIndex || 0;
    this.endIndex = endIndex !== undefined ? endIndex : SyntaxHelper.END_OF_LINE;
    this.labelType = labelType;
    this.linkedTo = linkTo;
    this.labelId = (__LABEL_ID__++);
    this.dependsOn = {};
    this.depth = 0;

    var disabled = false;

    this.equivalentTo = function(other)
    {
        return me.startIndex === other.startIndex && me.endIndex === other.endIndex && me.labelType === other.labelType && me.tagName === other.tagName;
    };

    this.clearDependencies = function()
    {
        me.dependsOn = {};
        me.depth = 0;
    };

    this.getDependsOn = function(other)
    {
        return me.dependsOn[other.labelId] != undefined;
    };

    this.addDependency = function(newDependency)
    {
        this.dependsOn[newDependency.labelId] = true;
        me.depth ++;
    };

    this.getId = function()
    {
        return me.labelId;
    };

    this.disable = function()
    {
        disabled = true;
    };

    this.getDisabled = function()
    {
        return disabled;
    };
};

function SyntaxTracker(currentLine, previousLine, nextLine, syntaxSelector)
{
    const me = this;

    me.currentLine = currentLine;
    me.nextLine = nextLine || null;
    me.previousLine = previousLine || null;
    me.syntaxSelector = syntaxSelector;

    me.labels = {};
    me.continuedLabels = {};

    var linkLabels = function(forbiddenStartIndicies, labelSubset, highlightScheme)
    {
        var labelIndex, currentLabel, startingLabels = [], endingLabels = [], unendedLabels = [];
        var labels = labelSubset || me.labels;


        // Check whether new continued labels are to be created...
        for (var labelName in labels)
        {
            for (labelIndex = 0; labelIndex < labels[labelName].length; labelIndex++)
            {
                currentLabel = labels[labelName][labelIndex];

                // If a starting label...
                if (currentLabel.labelType === SyntaxHelper.LABEL_START
                        && !(currentLabel.startIndex in forbiddenStartIndicies))
                {
                    startingLabels.push(currentLabel);
                }
                else if (currentLabel.labelType === SyntaxHelper.LABEL_END)
                {
                    endingLabels.push(currentLabel);

                    //console.log(currentLabel.tagName);
                }
            }
        }

        var testIndex, matchedWith;

        // Search for ending labels for every starting label.
        //Unfortunately, this is quadratic... TODO Fix this.
        for (labelIndex = 0; labelIndex < startingLabels.length; labelIndex++)
        {
            currentLabel = startingLabels[labelIndex];

            if (currentLabel.getDisabled())
            {
                continue;
            }

            matchedWith = undefined;

            for (testIndex = 0; testIndex < endingLabels.length; testIndex++)
            {
                if (endingLabels[testIndex].tagName === currentLabel.tagName && (endingLabels[testIndex].startIndex >= currentLabel.endIndex && currentLabel.endIndex !== SyntaxHelper.END_OF_LINE)
                    && (!matchedWith || matchedWith.endIndex > endingLabels[testIndex].endIndex || matchedWith.endIndex === SyntaxHelper.END_OF_LINE))
                {
                    matchedWith = endingLabels[testIndex];
                }
            }

            if (matchedWith)
            {
                me.labels[currentLabel.tagName].push(new SyntaxLabel(currentLabel.tagName, currentLabel.endIndex, matchedWith.endIndex, SyntaxHelper.LABEL_SINGLE));

                if (matchedWith.linkedTo)
                {
                    matchedWith.linkedTo.disable();
                }

                // If the label can be multi-line, and the next line has that label,
                if (me.nextLine && me.syntaxSelector.labelCanMultiLine(currentLabel.tagName, highlightScheme) && me.nextLine.syntaxTracker.hasLabelToEndOfLine(currentLabel.tagName))
                {
                    // Update the next line.
                    me.nextLine.requestRefresh();
                }
            }
            else
            {
                // Apply the label to the next line.
                if (me.nextLine && me.syntaxSelector.labelCanMultiLine(currentLabel.tagName, highlightScheme))
                {
                    me.nextLine.requestRefresh();//syntaxTracker.applyContinuingLabel(currentLabel.tagName);
                }

                // Make the label span to the end of the line.
                currentLabel.endIndex = SyntaxHelper.END_OF_LINE;
            }
        }
    };

    // DANGER!! Only to be used after clearing
    //me.labels, as this function adds its
    //continuedLabels to the current ones.
    var refreshContinuedLabels = function(noLink, preventAppendContinued)
    {
        var forbiddenStartIndicies = {}, hasContinuingStart;

        for (var label in me.continuedLabels)
        {
            hasContinuingStart = false;

            if (me.labels[label])
            {
                for (var i = 0; i < me.labels[label].length; i++)
                {
                    if (me.labels[label][i].labelType === SyntaxHelper.LABEL_START)
                    {
                        hasContinuingStart = true;

                        break;
                    }
                }
            }

            let endLabels = me.getEndLabels(label, 1);

            // If the previous line doesn't have
            //the label, don't apply it.
            if (me.previousLine && (!me.previousLine.syntaxTracker.hasLabel(label) || !me.previousLine.syntaxTracker.hasLabelToEndOfLine(label)))
            {
                delete me.continuedLabels[label];

                if (me.labels[label])
                {
                    delete me.labels[label];
                }

                if (me.nextLine && me.nextLine.syntaxTracker.hasLabel(label))
                {
                    me.nextLine.requestRefresh();
                }

                continue;
            }
            else if (me.continuedLabels[label].endIndex !== SyntaxHelper.END_OF_LINE && endLabels.length === 0)
            {
                me.continuedLabels[label].endIndex = SyntaxHelper.END_OF_LINE;

                if (me.nextLine && !me.nextLine.syntaxTracker.hasLabel(label))
                {
                    me.nextLine.requestRefresh();
                }
            }
            else if (endLabels.length > 0 && me.continuedLabels[label].endIndex !== endLabels[0].startIndex)
            {
                me.continuedLabels[label].endIndex = endLabels[0].startIndex;

                if (me.nextLine && me.nextLine.syntaxTracker.hasLabel(label))
                {
                    me.nextLine.requestRefresh();
                }
            }

            if (me.continuedLabels[label].endIndex !== SyntaxHelper.END_OF_LINE && me.nextLine && me.nextLine.syntaxTracker.hasLabelToEndOfLine(label))
            {
                me.nextLine.requestRefresh();
            }

            if (me.continuedLabels[label].endIndex === SyntaxHelper.END_OF_LINE && me.nextLine && !me.nextLine.syntaxTracker.hasLabel(label))
            {
                me.nextLine.requestRefresh();
            }

            if (!me.labels[label])
            {
                me.labels[label] = [];
            }

            if (!preventAppendContinued)
            {
                me.labels[label].push(me.continuedLabels[label]);
            }

            if (me.continuedLabels[label].endIndex != SyntaxHelper.END_OF_LINE)
            {
                forbiddenStartIndicies[me.continuedLabels[label].endIndex] = true;

                forbiddenStartIndicies[me.continuedLabels[label].startIndex] = true;
            }
        }

        if (!noLink)
        {
            linkLabels(forbiddenStartIndicies);
        }

        return forbiddenStartIndicies;
    };

    var lastRefreshTime = 0,//(new Date()).getTime(),
        awaitingTimeout = false,
        minRefreshDeltaT = 500;

    this.refreshHighliting = function(ignoreForDeltaT)
    {
        var nowTime = (new Date()).getTime();
        var dt = nowTime - lastRefreshTime;

        var doneRefreshing = false;

        var oncomplete = () => { doneRefreshing = true; };

        if (dt > minRefreshDeltaT || ignoreForDeltaT)
        {
            me.labels = me.syntaxSelector.getLabelIndicies(me.currentLine.text);

            // Check the previous line for multi-line labels to be extended.
            if (me.previousLine)
            {
                me.previousLine.syntaxTracker.applyAnyToBeContinuedLabels(me);
            }

            refreshContinuedLabels();

            //linkLabels();
            me.updateLabelDeps();

            me.checkAndHandleOtherHighlightSchemes(0, me.currentLine.text.length); // Check whether the current highlighter requests a change in highlighting. Discover new labels if it does.

            lastRefreshTime = nowTime;

            awaitingTimeout = false;

            oncomplete();
        }
        else if (!awaitingTimeout)
        {

            setTimeout(() => 
            {
                me.refreshHighliting();

                oncomplete();
            }, minRefreshDeltaT - dt);

            awaitingTimeout = true;
        }

        return new Promise((resolve, reject) =>
        {
            if (!doneRefreshing)
            {
                oncomplete = () => resolve();
            }
            else
            {
                resolve();
            }
        });
    };

    this.getTextInLabel = function(labelName, labelIndex)
    {
        var label = me.labels[labelName][labelIndex];
        var endIndex = label.endIndex;
        var startIndex = label.startIndex;

        //console.log("   End (prior to check in getText): " + endIndex);

        if (endIndex == SyntaxHelper.END_OF_LINE)
        {
            endIndex = me.currentLine.text.length;
        }

        //console.log("  Getting text from label, " + labelName + ", at index " + labelIndex + ". The text starts at " + startIndex + " and ends at " + endIndex + ".");

        return me.currentLine.text.substring(startIndex, endIndex);
    };

    var noteNewLabels = function(labelsMap)
    {
        let i = 0;

        for (var labelName in labelsMap)
        {
            if (!me.hasLabel(labelName))
            {
                me.labels[labelName] = [];
            }

            for (i = 0; i < labelsMap[labelName].length; i++)
            {
                me.labels[labelName].push(labelsMap[labelName][i]);
            }
        }
    };

    this.checkAndHandleOtherHighlightSchemes = function(startIndex, stopIndex, currentHighlighter, recursionDepth)
    {
        let i = 0, newHighlighter, additionalLabels,
            currentStart, currentEnd,
            currentLabel,
            getEndIndex = (labelObj) =>
            {
                return labelObj.endIndex !== SyntaxHelper.END_OF_LINE ? labelObj.endIndex : me.currentLine.text.length;
            };

        // If recursing more than 15 times, an error probably has occurred! Log and return.
        if (recursionDepth > 15)
        {
            console.error("recursionDepth > 15 (checkAndHandleOtherHighlightSchemes).");

            return false;
        }

        let handleLabel = (labelText, startIndex, endIndex) =>
        {
            newHighlighter = currentHighlighter.highlightSchemeSpecificLabels[labelName];

            additionalLabels = me.syntaxSelector.getLabelIndicies(labelText,
                        startIndex, newHighlighter
                        );



            noteNewLabels(additionalLabels);

            if (me.previousLine)
            {
                me.previousLine.syntaxTracker.applyAnyToBeContinuedLabels(me, true, newHighlighter);
            }


            let forbiddenStartIndicies = refreshContinuedLabels(true, true);
            linkLabels(forbiddenStartIndicies, additionalLabels, newHighlighter);
            me.updateLabelDeps();

            me.checkAndHandleOtherHighlightSchemes(currentStart,
                    currentEnd, newHighlighter, recursionDepth + 1);
        };

        currentHighlighter = currentHighlighter || me.syntaxSelector.highlightScheme;

        for (var labelName in currentHighlighter.highlightSchemeSpecificLabels)
        {
            if (me.hasLabel(labelName))
            {
                //console.log("Got the label " + labelName + "! START_CHECK: " + startIndex + "; STOP_CHECK: " + stopIndex + ", list: " + me.labels[labelName].join(", "));

                if (me.labels[labelName].length === 0)
                {
                    handleLabel(me.currentLine.text, 0, me.currentLine.text.length);
                }

                for (i = 0; i < me.labels[labelName].length; i++)
                {
                    currentLabel = me.labels[labelName][i];
                    currentStart = currentLabel.startIndex;

                    if (currentStart >= startIndex && currentStart <= stopIndex)
                    {
                        handleLabel(me.getTextInLabel(labelName, i), currentStart, getEndIndex(currentLabel));
                    }
                }
            }
        }
    };

    this.getEndLabels = function(label, maxNumber)
    {
        if (!(label in me.labels))
        {
            return [];
        }

        maxNumber = maxNumber || me.labels[label].length;

        var result = [];

        for (var i = 0; i < me.labels[label].length; i++)
        {
            if (me.labels[label][i].labelType === SyntaxHelper.LABEL_END)
            {
                result.push(me.labels[label][i]);

                if (result.length >= maxNumber)
                {
                    break;
                }
            }
        }

        return result;
    }

    this.getColorAtIndex = function(characterIndex)
    {
        var result = me.syntaxSelector.getBaseColor();

        var applicableLabels = {};

        var handleLabel = function(label)
        {
            if (label.startIndex <= characterIndex
                && (label.endIndex > characterIndex
                    || label.endIndex === SyntaxHelper.END_OF_LINE))
            {
                if (!applicableLabels[label.tagName])
                {
                    applicableLabels[label.tagName] = [];
                }

                applicableLabels[label.tagName].push(label);

                d += ", " + label.tagName;
            }
        };

        var d = "";
        var i;
        for (var labelName in me.labels)
        {
            for (i = 0; i < me.labels[labelName].length; i++)
            {
                handleLabel(me.labels[labelName][i]);
            }
        }

        //console.log(d);
        //console.log(me.labels);

        return me.syntaxSelector.getColor(applicableLabels);
    };

    this.applyContinuingLabel = function(label)
    {
        var endIndex = SyntaxHelper.END_OF_LINE;

        /* If the label does not exist... */
        if (!me.labels[label])
        {
            me.labels[label] = [];
        }
        else
        {
            var endLabel;

            for (var i = 0; i < me.labels[label].length; i++)
            {
                if (me.labels[label][i].labelType === SyntaxHelper.LABEL_END && (me.labels[label][i].startIndex < endIndex || endIndex === -1))
                {
                    endIndex = me.labels[label][i].startIndex;

                    endLabel = me.labels[label][i];
                    break;
                }
            }

            if (endLabel && endLabel.linkedTo)
            {
                endLabel.linkedTo.disable();
            }
        }

        let newLabel = new SyntaxLabel(label, 0, endIndex, SyntaxHelper.LABEL_CONTINUED);

        // DO NOT apply the label if it already exists.
        if (!me.continuedLabels[label] || !newLabel.equivalentTo(me.continuedLabels[label]))
        {
            me.labels[label].push(newLabel);
            me.continuedLabels[label] = newLabel;

            /* Wait, then apply the label to the following line. */
            if (me.nextLine && me.nextLine.syntaxTracker && endIndex == SyntaxHelper.END_OF_LINE)
            {
                me.nextLine.requestRefresh();
            }
        }
    };

    this.hasLabel = function(label)
    {
        return (label in me.labels);
    };

    this.hasLabelToEndOfLine = function(label)
    {
        if (!me.hasLabel(label))
        {
            return false;
        }

        for (var i = 0; i < me.labels[label].length; i++)
        {
            if (me.labels[label][i].endIndex === SyntaxHelper.END_OF_LINE && me.labels[label][i].labelType !== SyntaxHelper.LABEL_END)
            {
                return true;
            }
        }

        return false;
    };

    this.applyAnyToBeContinuedLabels = function(toLine, excludeContinuedLabels, highlighter)
    {
        var appliedLabels = {};

        if (!excludeContinuedLabels)
        {
            for (var label in me.continuedLabels)
            {
                if (label.endIndex === SyntaxHelper.END_OF_LINE && !appliedLabels[label] && me.hasLabelToEndOfLine(label) && !toLine.hasLabelToEndOfLine(label))
                {
                    toLine.applyContinuingLabel(label);
                    appliedLabels[label] = true;
                }
            }
        }

        for (var label in me.labels)
        {
            if (me.syntaxSelector.labelCanMultiLine(label, highlighter) && me.hasLabelToEndOfLine(label) && !appliedLabels[label] && !toLine.hasLabelToEndOfLine(label))
            {
                toLine.applyContinuingLabel(label);
                appliedLabels[label] = true;
            }
        }
    };

    /*
    Determine and set the precedence of all labels
    applied to this line. ACQUIRE THIS LIST BEFORE
    CALLING THIS.
    */
    this.updateLabelDeps = function()
    {
        let allLabels = [];
        let i = 0, j = 0;

        // TODO: Consider caching a copy of allLabels to
        //prevent its regeneration.
        for (var key in me.labels)
        {
            for (i = 0; i < me.labels[key].length; i++)
            {
                allLabels.push(me.labels[key][i]);

                me.labels[key][i].clearDependencies();
                me.labels[key][i].updateLabelDeps__tempEndIndex = undefined;
            }
        }

        // Sort the labels by starting-index.
        allLabels.sort((a, b) =>
        {
            return a.startIndex - b.startIndex;
        });

        let getLength = (label) =>
        {
            let endIndex = label.endIndex;

            if (label.endIndex === SyntaxHelper.END_OF_LINE)
            {
                endIndex = me.currentLine.text.length;
            }

            if (label.updateLabelDeps__tempEndIndex !== undefined)
            {
                endIndex = label.updateLabelDeps__tempEndIndex;
            }

            return endIndex - label.startIndex;
        };

        if (allLabels.length > 0)
        {
            let currentLength = 0;
            let currentEndIndex = 0;

            for (i = 0; i < allLabels.length; i++)
            {
                currentLength = getLength(allLabels[i]);
                currentEndIndex = allLabels[i].startIndex + currentLength;

                if (currentLength <= 1 || allLabels[i].labelType === SyntaxHelper.LABEL_START || allLabels[i].labelType === SyntaxHelper.LABEL_END)
                {
                    continue;
                }

                for (j = i + 1; j < allLabels.length && allLabels[j].startIndex < currentEndIndex; j++)
                {
                    allLabels[j].addDependency(allLabels[i]);

                    if (allLabels[j].startIndex + getLength(allLabels[j]) > currentEndIndex)
                    {
                        allLabels[j].endIndex = currentEndIndex;
                    }
                }
            }

            return true;
        }

        return false;
    };
}
