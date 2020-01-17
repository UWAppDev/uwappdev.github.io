"use strict";

// Supplies useful HTML helper-functions.
var HTMLHelper = {};

HTMLHelper.inputTypeToElementNSDictionary = 
{
    "text": "input",
    "checkbox": "input",
    "textarea": "textarea",
    "number": "input",
    "richtext": "div"
};

// Get the content of an input. This is necessary for inputs
//like those with type=checkbox.
HTMLHelper.getInputContent = function(inputElement, inputType)
{
    var result;

    switch (inputType)
    {
        case "checkbox":
            return inputElement.checked;
        case "richtext":
            return inputElement.innerHTML;
        case "number":
            result = inputElement.value;
            
            try
            {
                result = parseFloat(result);
            }
            catch(e)
            {
                console.warn(e);
            }
            
            return result;
        default:
            return inputElement.value;
    }
};

HTMLHelper.setInputContent = function(inputElement, inputType, setTo)
{
    switch (inputType)
    {
        case "checkbox":
            inputElement.checked = setTo;
            break;
        case "richtext":
            inputElement.innerHTML = setTo;
            break;
        default:
            inputElement.value = setTo;
            break;
    }
};

HTMLHelper.getSuitableInputType = function(inputs)
{
    
};

// Adds an element containing HTML text to parent, with NS of elementName.
HTMLHelper.addTextElement = function(content, parent, elementName)
{
    var element = document.createElement(elementName || "div");
    element.innerHTML = content;
    
    parent.appendChild(element);
    
    return element;
};

// Calls HTMLHelper.addTextElement with a default elementName
//of "h1". Included to improve readability.
HTMLHelper.addHeader = function(content, parent, elementName)
{
    elementName = elementName || "h1";
    
    return HTMLHelper.addTextElement.apply(this, arguments);
};

// Like HTMLHelper.addHeader, but with "p" as the default NS.
HTMLHelper.addParagraph = function(content, parent, elementName)
{
    elementName = elementName || "p";

    return HTMLHelper.addTextElement.apply(this, arguments);
};

// Adds a line break!
HTMLHelper.addBR = function(parent)
{
    return HTMLHelper.addTextElement("", parent, "br");
};

// Adds a header-row element.
HTMLHelper.addHR = function(parent)
{
    return HTMLHelper.addTextElement("", parent, "hr");
};

// Adds a div with class spacer.
HTMLHelper.addSpacer = function(parent)
{
    const result = HTMLHelper.addTextElement("", parent, "div");
    
    result.classList.add("spacer");
    
    return result;
};

// Adds an element (by default, a span) to parent and gives
//it a class of label.
HTMLHelper.addLabel = function(labelText, parent, element)
{
    var label = HTMLHelper.addTextElement(labelText, parent, element || "span");
    
    label.setAttribute("class", "label");
    
    return label;
};

// Adds a button! OnSubmit's this variable is set
//to the button.
HTMLHelper.addButton = function(content, parent, onSubmit)
{
    var element = document.createElement("button");
    element.innerHTML = content;
    
    parent.appendChild(element);
    
    element.addEventListener("click", function()
    {
        onSubmit.apply(this, arguments);
    });
    
    return element;
};

// Adds an input of inputType to parent. OnInput is called
//when an "input" event is fired -- when the user changes
//the content of the input. This DOES support checkboxes,
//but at the time of this writing, not radio-boxes or spinners
//(selects).
HTMLHelper.addInput = function(placeHolder, initialContent, inputType, parent, onInput, onEnterKey)
{
    var inputElementType = "input";
    
    if (inputType in HTMLHelper.inputTypeToElementNSDictionary)
    {
        inputElementType = HTMLHelper.inputTypeToElementNSDictionary[inputType];
    }
    
    onInput = onInput || function() {};
    
    var input = document.createElement(inputElementType);
    
    input.setAttribute("type", inputType);
    
    HTMLHelper.setInputContent(input, inputType, initialContent);
    
    input.setAttribute("placeholder", placeHolder);
    
    parent.appendChild(input);
    
    input.addEventListener("input", function(event)
    {
        var inputContent = HTMLHelper.getInputContent(input, inputType);
        
        onInput.call(this, inputContent, arguments);
        
        return true;
    }, true);
    
    // Handle enter key presses.
    if (onEnterKey)
    {
        input.addEventListener("keyup", function(event)
        {
            // If the user hit enter,
            if (event.keyCode === 13)
            {
                var inputContent = HTMLHelper.getInputContent(input, inputType);
                
                onEnterKey.call(this, inputContent, arguments);
                
                return true;
            }
        });
    }
    
    return input;
};

// Adds a sequence of inputs to the container that permits the editing
//of a given vector.
HTMLHelper.addVectorEditor = function(vector, numComponents, parent)
{
    var componentKeys = ['x', 'y', 'z', 'w'];
    
    var handleInput = (key) =>
    {
        var newInput = HTMLHelper.addInput(key, vector[key], "number", parent, function(newValue)
        {
            vector[key] = newValue;
        });
        
        newInput.style.width = "50px";
    };
    
    for (var i = 0; i < numComponents; i++)
    {
        handleInput(componentKeys[i]);
    }
};

// Create a progress bar! Returns an element with
//properties container, track, and a method setProgress.
HTMLHelper.addProgressBar = function(initialProgress, parent)
{
    const container = document.createElement("div");
    container.setAttribute("class", "progressBarContainer");
    
    const track = document.createElement("div");
    track.setAttribute("class", "progressBarTrack");
    
    let setProgress = function(progressDecimal) // Progress should be from zero to one.
    {
        progressDecimal = Math.max(0, Math.min(progressDecimal, 1));
    
        track.style.width = Math.floor(progressDecimal * 100) + "%";
    };
    
    container.appendChild(track);
    
    parent.appendChild(container);
    
    // Set the initial progress.
    setProgress(initialProgress);
    
    // Although this dictionary could
    //be returned directly by wrapping it 
    //in parentheses (and eliminating the
    //need for a separate result variable),
    //this has only been tested in Chrome,
    //and seems liable to break.
    let result = 
    {
        container: container,
        track: track,
        setProgress: setProgress
    };
    
    return result;
};

/*
        Create a tabbed view. The argument, tabDescriptors, 
    should be formatted such that each tab label is paired with
    a function of the container or an HTML Element to display.
    
        An object containing methods addTab, removeTab, hideTab,
    showTab, and selectTab is returned. The argument, reRunTabActions
    is included to permit a re-run of provided tab actions on tab switching,
    rather than re-using a previously generated content.
*/
HTMLHelper.addTabGroup = function(tabDescriptors, parent, defaultTab, reRunTabActions)
{
    let tabContents = {};
    let tabActiveFunctions = {};
    let tabLabels = {}; // The selectable labels.
    let selectedTab = null;
    
    // Create containers.
    let groupContainer = document.createElement("div"); // Contains everything in this display.
    let tabLabelContainer = document.createElement("div"); // Contains just the parent element of the tabs.
    let contentContainer = document.createElement("div"); // Contains the content to be displayed.
    
    // Set container styles.
    groupContainer.setAttribute("class", "tabGroupContainer"); // TODO groupContainer should have display flex, etc.
    tabLabelContainer.setAttribute("class", "tabDisplay");
    contentContainer.setAttribute("class", "tabDisplayContent");
    
    // Hierarchy.
    groupContainer.appendChild(tabLabelContainer);
    groupContainer.appendChild(contentContainer);
    parent.appendChild(groupContainer);
    
    let addTab = (tabName, tabAction) =>
    {
        let newTabElement = null;
        
        // If the tab's action is a function,
        //create an element to provide it.
        if (typeof (tabAction) === "function")
        {
            newTabElement = document.createElement("span");
            
            // Run the action on the element,
            //if not re-running the activation function
            //each time the tab is shown.
            if (!reRunTabActions)
            {
                tabAction(newTabElement);
            }
            else
            {
                tabActiveFunctions[tabName] = tabAction;
            }
        } // Otherwise, use the provided element.
        else
        {
            newTabElement = tabAction;
        }
        
        tabContents[tabName] = newTabElement;
        
        // Add the element to its container, but set its display to none.
        contentContainer.appendChild(newTabElement);
        newTabElement.classList.add("tabContentHidden");
        
        // Create the tab's label.
        let tabLabel = document.createElement("span");
        
        tabLabel.setAttribute("class", "tabLabel tabLabelUnselected"); // Styling.
        tabLabel.textContent = tabName;
        
        // Click.
        tabLabel.onclick = (event) =>
        {
            selectTab(tabName);
        };
        
        tabLabels[tabName] = tabLabel; // Stored for deletion purposes.
        
        // Add it to the tab container.
        tabLabelContainer.appendChild(tabLabel);
    };
    
    let removeTab = (tabName) =>
    {
        // If the tab doesn't seem to exist,
        if (!tabContents[tabName])
        {
            return false; // Return failure.
        }
        
        // If the tab to remove is currently displayed,
        //hide it.
        if (selectedTab === tabName)
        {
            tabContents[tabName].style.display = "none";
            selectedTab = null; // Reset the selected tab to null.
        }
        
        // Remove contents.
        tabContents[tabName].innerHTML = "";
        contentContainer.removeChild(tabContents[tabName]);
        delete tabContents[tabName]; // Let its memory free.
        
        // Remove label.
        tabLabelContainer.removeChild(tabLabels[tabName]);
        delete tabLabels[tabName]; // Allow memory to be freed.
        
        // Remove its activation function (if applicable).
        if (tabName in tabActiveFunctions)
        {
            delete tabActiveFunctions[tabName];
        }
        
        // Return success.
        return true;
    };
    
    let showTab = (tabName) =>
    {
        tabLabels[selectedTab].setAttribute("class", "tabLabel tabLabelShown");
    };
    
    let hideTab = (tabName) =>
    {
        tabLabels[selectedTab].setAttribute("class", "tabLabel tabLabelHidden");
    };
    
    let selectTab = (tabName) =>
    {
        // If a tab is already selected,
        //deselect it.
        if (selectedTab !== null && selectedTab in tabContents && selectedTab in tabLabels)
        {
            tabContents[selectedTab].classList.add("tabContentHidden"); // Instead of using display = none,
                                                                        //this allows the tab to smoothly
                                                                        //transition out of view.
            
            tabContents[selectedTab].classList.remove("tabContentShown");
                                                                        
            tabLabels[selectedTab].setAttribute("class", "tabLabel tabLabelUnselected");
        }
        
        // Note the newly-selected tab.
        selectedTab = tabName;
        
        // Not using the className/classList attributes because the author
        //is less familiar with them and this should do what is wanted.
        tabLabels[selectedTab].setAttribute("class", "tabLabel tabLabelSelected");
        
        // Show the content.
        tabContents[selectedTab].classList.add("tabContentShown");
        tabContents[selectedTab].classList.remove("tabContentHidden");
        
        // If the tab has a registered activation function,
        if (selectedTab in tabActiveFunctions)
        {
            tabActiveFunctions[selectedTab].call(this, tabContents[selectedTab]);
        }
    };
    
    for (var i in tabDescriptors)
    {
        addTab(i, tabDescriptors[i]);
    }
    
    if (defaultTab)
    {
        selectTab(defaultTab);
    }
    
    let result = 
    {
        selectTab: selectTab,
        showTab: showTab,
        hideTab: hideTab,
        addTab: addTab,
        removeTab: removeTab
    };
    
    return result;
};

/*
    Adds a simple color chooser to the parent element.
    InitialColor should be a vector3 with minimum 0 and
    maximum 1 for each component.
 */
HTMLHelper.addColorChooser = function(initialColor, parent, onChange, inputStep, customizeTabs)
{
    // If not a vector, make it one.
    if (typeof initialColor === "string")
    {
        initialColor = JSHelper.colorToVector(initialColor);
        
        initialColor.x /= 255;
        initialColor.y /= 255;
        initialColor.z /= 255;
    }

    let container = document.createElement("div");
    let currentColor = initialColor.copy();
    let alpha = initialColor.w || 1.0;
    
    inputStep = inputStep || 0.01;
    
    container.classList.add("colorChooserContainer");
    
    let onUpdate = () =>
    {
        let htmlColor = JSHelper.vec3ToRGBString(currentColor, 1.0,
                                                            alpha);
        container.style.backgroundColor = htmlColor;
        
        if (onChange)
        {
            onChange(currentColor, htmlColor);
        }
    };
    
    onUpdate();
    
    let tabGroup = HTMLHelper.addTabGroup(
    {
        "RGB": (parent) =>
        {
            parent.innerHTML = ""; // Clear the tab.
            
            let handleRGBInput = function(component, componentLabel)
            {
                // Multiply and divide by input step -- the range input
                //does not seem to work well with initial values and floats.
                let part = HTMLHelper.addInput(componentLabel, currentColor[component] / inputStep,
                                               "range", parent, (newValue) =>
                {
                    currentColor[component] = newValue * inputStep;
                    
                    onUpdate();
                });
                
                part.min = 0;
                part.max = Math.floor(1 / inputStep);
                part.value = Math.floor(currentColor[component] / inputStep);
                
                part.step = 1;
                
                part.style.flexGrow = 1;
            };
            
            handleRGBInput("x", "Red");
            handleRGBInput("y", "Green");
            handleRGBInput("z", "Blue");
        },
        "Alpha": (parent) =>
        {
            parent.innerHTML = ""; // Clears the tab.
            
            let alphaInput = HTMLHelper.addInput("Transparency", alpha / inputStep, "range", parent,
                                                (newValue) =>
            {
                alpha = newValue * inputStep;
                
                onUpdate();
            });
            
            alphaInput.min = 0;
            alphaInput.max = Math.floor(1 / inputStep);
            alphaInput.step = 1;
            alphaInput.value = Math.floor(alpha / inputStep);
            
            alphaInput.style.flexGrow = 1;
        },
        "Dropper": (parent) =>
        {
            parent.innerHTML = "";
            
            const PRE_SELECT_TEXT = "Select a Color";
            const SELECTING_COLOR_TEXT = "Click on an Untainted Canvas";
            
            let selectColorButton;
            
            selectColorButton = HTMLHelper.addButton("Select a Color", parent, function()
            {
                selectColorButton.innerHTML = SELECTING_COLOR_TEXT;
                
                requestAnimationFrame(() =>
                {
                    let listener;
                    
                    listener = (event) =>
                    {
                        event.preventDefault();
                        
                        // Clear the listener.
                        document.documentElement.removeEventListener("pointerdown", listener);
                        
                        // Note the removed listener.
                        selectColorButton.innerHTML = PRE_SELECT_TEXT;
                        
                        // Unpause events.
                        JSHelper.Events.setPaused(false);
                        
                        let target;
                        target = event.target;
                        
                        if (target.nodeName.toLowerCase() === "canvas")
                        {
                            // Get a color.
                            let canvas = document.createElement("canvas");
                            
                            canvas.width = target.clientWidth;
                            canvas.height = target.clientHeight;
                            
                            let ctx = canvas.getContext("2d");
                            
                            ctx.drawImage(target, 0, 0, ctx.canvas.width, ctx.canvas.height);
                            
                            let imageData = ctx.getImageData(event.offsetX, event.offsetY, 2, 2);
                            let data = imageData.data;
                            
                            currentColor.x = data[0] / 255.0;
                            currentColor.y = data[1] / 255.0;
                            currentColor.z = data[2] / 255.0;
                            alpha = data[3] / 255.0;
                            
                            onUpdate();
                        }
                    };
                    
                    document.documentElement.addEventListener("pointerdown", listener, false);
                    
                    // Pause all events.
                    JSHelper.Events.setPaused(true);
                });
            });
            
            selectColorButton.style.textAlign = "center";
            selectColorButton.style.flexGrow = 1;
        }
    }, container, "RGB", true); // Show the RGB tab by default and DO
                                //run generation functions on each tab switch.
    
    container.style.display = "flex";
    container.style.flexDirection = "row";
    container.style.width = "auto";
    
    // If the user wanted to customize displayed tabs...
    if (customizeTabs)
    {
        customizeTabs.call(this, tabGroup);
    }
    
    parent.appendChild(container);
    
    return container;
};

