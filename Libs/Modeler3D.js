"use strict";

function Modeler3D(verticies, onSubmit)
{
    const IN_WEBGL_2 = false;
    
    var vertexShaderSource = 
    `
    attribute vec4 a_position;
    attribute vec3 a_normal;
    attribute vec4 a_color;
       
    uniform mat4 u_worldMatrix;
    uniform mat4 u_worldInverseTranspose;
    uniform mat4 u_viewMatrix;
    uniform mat4 u_cameraMatrix;
    
    uniform vec4 u_cameraPosition;
    uniform vec4 u_lightPosition;
    uniform vec4 u_color;
    
    varying vec3 v_color;
    varying vec3 v_normal;
    varying vec3 v_toCamera;
    varying vec3 v_toLight;
    
    void main()
    {
        gl_Position = u_viewMatrix * u_cameraMatrix * u_worldMatrix * a_position;// * u_worldMatrix * u_cameraMatrix * u_viewMatrix;
        
        vec4 worldPosition = u_worldMatrix * a_position;
        
        v_toLight = (u_lightPosition - worldPosition).xyz;
        v_toCamera = (u_cameraPosition - worldPosition).xyz;
        
        v_normal = mat3(u_worldInverseTranspose) * a_normal.xyz;
        
        v_color = a_color.rgb; // (v_normal + vec3(0.5, 0.5, 0.5)) / 2.0;
    }
    `;
    
    var fragmentShaderSource = 
    `
    precision highp float;
    
    uniform float u_shine;
    
    varying vec3 v_color;
    varying vec3 v_normal;
    varying vec3 v_toCamera;
    varying vec3 v_toLight;
    
    void main()
    {
        // Normalize all varying vectors.
        vec3 normal = normalize(v_normal);
        vec3 toLight = normalize(v_toLight);
        vec3 toCamera = normalize(v_toCamera);
        
        // The vector halfway between the camera and light.
        vec3 halfVector = normalize(toCamera + toLight);
        
        // The lighting is proportional to the cosine of the angle between
        //the normal and the vector to the light.
        float lighting = dot(normal, toLight);
        
        // The specular (before being brought to a power) is proportional to the cosine of the angle between
        //the half-vector and the normal (a greater cosine value signifying
        //a greater correlation).
        float specular = dot(halfVector, toCamera);
        
        if (specular > 0.0 && lighting > 0.0)
        {
            specular = pow(specular, u_shine);
        }
        else
        {
            specular = 0.0;
        }
        
        if (lighting <= 0.0)
        {
            lighting = 0.0;
        }
        
        if (lighting >= 0.9)
        {
            lighting = 0.9;
        }
        
        vec4 resultantColor = vec4(v_color.rgb, 1.0);
        
        resultantColor.rgb += specular;
        resultantColor.rgb *= lighting;
        
        gl_FragColor = resultantColor;
    }
    `;
    
    var compileShader = function(gl, shaderType, shaderSource)
    {
        var shader = gl.createShader(shaderType);
        
        gl.shaderSource(shader, shaderSource);
        
        gl.compileShader(shader);
        
        // Check whether the shader was compiled successfully.
        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        {
            return shader;
        } // If not, note that an error occurred.
        else
        {
            var errorMessage = gl.getShaderInfoLog(shader);
            
            gl.deleteShadeer(shader);
            
            // Throw the error.
            throw errorMessage;
        }
    };
    
    var linkProgram = function(gl, vertexShader, fragmentShader)
    {
        var program = gl.createProgram();
        
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        
        gl.linkProgram(program);
        
        // Check whether the program was linked successfully.
        if (gl.getProgramParameter(program, gl.LINK_STATUS))
        {
            // If it linked successfully, return the program.
            return program;
        } // Otherwise, throw the error.
        else
        {
            var errorMessage = gl.getProgramInfoLog(program);
            
            gl.deleteProgram(program);
            
            // Throw the error.
            throw errorMessage;
        }
    };
    
    var canvas = document.createElement("canvas");
    canvas.style.width = "calc(100% - 2px)";
    canvas.style.height = "calc(100% - 25px)";
    canvas.style.touchAction = "none";
    
    var silhouettePoints = [];
    var editControlSilhouettePoints = [];
    var silhouetteDivisions = 8;
    var maxDivisions = 256;
    const GENERATION_MODES = { "EXTRUDE": 0, "ROTATE": 1 };
    let generationMode = GENERATION_MODES.ROTATE;
    let extrudeDirection = new Vector3(0, 0, 60);
    let noCap = false;
    
    // Generates verticies from a silhouette and renders.
    //If showProgress, show a progress window to the user.
    var recreateVerticies = function(silhouette, showProgress)
    {
        silhouette = silhouette || silhouettePoints; // Default values.
        
        let showProgressFunction = function(progress, status) {}; // A default, do nothing
                                                                  //update function.
        
        let hideProgressDialog = function() {};
        
        // If to display progress, display
        //the progress dialog.
        if (showProgress)
        {
            let progressDialog = SubWindowHelper.makeProgressDialog();
            
            // Update the progress.
            showProgressFunction = function(progress, status)
            {
                progressDialog.update(progress, status);
            };
            
            // Hide the dialog -- make the function.
            hideProgressDialog = function()
            {
                progressDialog.close();
            };
        }
        
        showProgressFunction(0.0, "Generating verticies...");
        
        // Create the vertex generation task.
        let vertexGenerationTask = (silhouette, silhouetteDivisions, generationMode, GENERATION_MODES, extrudeDirection, excludeCap) =>
        new Promise((resolve, reject) =>
        {
            var newVerticies;
            
            if (generationMode === GENERATION_MODES.EXTRUDE)
            {
                newVerticies = ModelHelper.extrude(silhouette, extrudeDirection, excludeCap, 0);
            }
            else
            {
                newVerticies = ModelHelper.silhouetteToVerticies(silhouette, 0, Math.PI * 2, silhouetteDivisions);
            }
            
            resolve(newVerticies);
        });
        
        var vertexGenerationPromise;
        
        // Decide whether to run the task directly, or on a background thread.
        if (silhouetteDivisions * silhouette.length > 200) // If more than 200 verticies...
        {
            // Create a background thread.
            let thread = ThreadHelper.makeLibLinkedThread();
            thread.putFunction("generateVerticies", ["silhouette", "silhouetteDivisions", "generationMode", "GENERATION_MODES", "extrudeDirection", "noCap"], vertexGenerationTask);
            
            // Compile the thread.
            thread.compile();
            
            // Create the promise.
            vertexGenerationPromise = thread.callFunction("generateVerticies", [silhouette, silhouetteDivisions, generationMode, GENERATION_MODES, extrudeDirection, noCap]);
        }
        else
        {
            // Run on the main thread.
            vertexGenerationPromise = vertexGenerationTask(silhouette, silhouetteDivisions, generationMode, GENERATION_MODES, extrudeDirection, noCap);
        }
        
        // Render after reloading verticies.
        vertexGenerationPromise.then((newVerticies) =>
        {
            verticies = newVerticies;
            //console.log(verticies);
            //window.v = verticies;
            
            return reloadVerticies((progress, message) => showProgressFunction(progress * 0.75 + 0.25, message), newVerticies);
        }).then(() =>
        {
            hideProgressDialog(); // Note: Even if the progress dialog wasn't created,
                                  //this function should be defined.
            
            render(rotateX, rotateY, rotateZ, tX, tY, tZ);
        }).catch(reason =>
        {
            hideProgressDialog();
            
            SubWindowHelper.alert("Error", "Vertex generation failed with error: " + reason);
        });
    };
    
    var controlsContainer = document.createElement("div");
    var cachedUndoBuffer = [], cachedRedoBuffer = [];
    
    // Allow the user to edit the shape's silhouette.
    var editPointsButton = HTMLHelper.addButton("Edit Silhouette", controlsContainer, function()
    {
        var pointsEditor = new Modeler2D(function(silhouette, editControlPoints, undoBuffer, redoBuffer)
        {
            silhouettePoints = silhouette; // Store the silhouette's point for later modification.
            editControlSilhouettePoints = editControlPoints; // The actual objects manipulated by the editor.
            
            // Cache the undo and redo buffers for ease of use.
            cachedUndoBuffer = undoBuffer;
            cachedRedoBuffer = redoBuffer;
            
            recreateVerticies(silhouette, true); // DO show progress.
        },  editControlSilhouettePoints, cachedUndoBuffer, cachedRedoBuffer);
    });
    
    var editModelButton = HTMLHelper.addButton("Edit Model", controlsContainer, function()
    {
        // Make a new window that allows the user to select a model and modify it.
        var optionsWindow = SubWindowHelper.create({ title: "Model Options" });
        
        var revolutionContainer = document.createElement("div");
        var extrudeContainer = document.createElement("div");
        
        var tabbedDisplay = HTMLHelper.addTabGroup(
        {
            "Solid of Revolution": revolutionContainer,
            "Extrusion": extrudeContainer
        }, optionsWindow, "Solid of Revolution");
        
        // Set default value.
        if (generationMode === GENERATION_MODES.ROTATE)
        {
            tabbedDisplay.selectTab("Solid of Revolution");
        }
        else
        {
            tabbedDisplay.selectTab("Extrusion");
        }
        
        // Solid of revolution options.
        HTMLHelper.addLabel("Number of Divisions: ", revolutionContainer);
        
        // Let the user edit the number of divisions (place holder, initial content, input type, parent,
        //onInput).
        var editDivisionsInput = HTMLHelper.addInput("Edit Divisions", silhouetteDivisions, "number", revolutionContainer);
        
        HTMLHelper.addHR(revolutionContainer);
        
        HTMLHelper.addButton("Submit", revolutionContainer, function()
        {
            var divisions;
            
            try
            {
                divisions = parseFloat(editDivisionsInput.value);
            }
            catch(event)
            {
                SubWindowHelper.alert("Warning", "Check divisions for number formatting errors.");
                
                return;
            }
            
            // Ensure the selected number of divisions is reasonable.
            if (divisions > 0 && divisions <= maxDivisions)
            {
                // Note that a solid of revolution is to be used.
                generationMode = GENERATION_MODES.ROTATE;
            
                // Update the divisions.
                silhouetteDivisions = divisions;
                recreateVerticies(undefined, true); // No changes to the silhouette,
                                                    //but still show progress.
                
                optionsWindow.close();
            }
            else
            {
                if (divisions <= 0)
                {
                    SubWindowHelper.alert("Error", "Divisions must be greater than zero.");
                }
                else if (divisions > maxDivisions)
                {
                    SubWindowHelper.alert("Error", "Divisions must be less than " + maxDivisions + ".");
                }
            }
        });
        
        editDivisionsInput.setAttribute("class", "smallInput");
        
        // Extrusion options.
        HTMLHelper.addHeader("Direction", extrudeContainer, "h3");
        HTMLHelper.addHR(extrudeContainer);
        
        var extrudeVectorToEdit = extrudeDirection.copy();
        HTMLHelper.addVectorEditor(extrudeVectorToEdit, 3, extrudeContainer);
        
        HTMLHelper.addHR(extrudeContainer);
        
        var resultantNoCap = noCap;
        
        HTMLHelper.addHeader("Exclude Cap", extrudeContainer, "h3");
        HTMLHelper.addInput("Exclude Cap", noCap, "checkbox", extrudeContainer, function(checked)
        {
            resultantNoCap = checked;
        });
        
        HTMLHelper.addHR(extrudeContainer);
        
        HTMLHelper.addButton("Submit", extrudeContainer, function()
        {
            generationMode = GENERATION_MODES.EXTRUDE;
            
            extrudeDirection = extrudeVectorToEdit;
            
            noCap = resultantNoCap;
            
            recreateVerticies(undefined, true); // No changes to the silhouette, but show generation progress.
            
            optionsWindow.close();
        });
    });
    
    var manipulationMode = "ROTATE";
    
    // Change the tool.
    var toggleToolButton = HTMLHelper.addButton("Zoom", controlsContainer, function()
    {
        if (manipulationMode === "ROTATE")
        {
            this.innerHTML = "Rotate";
            manipulationMode = "ZOOM";
        }
        else
        {
            this.innerHTML = "Zoom";
            manipulationMode = "ROTATE";
        }
    });
    
    var gl = canvas.getContext(IN_WEBGL_2 ? "webgl2" : "webgl");
    
    // If the user's browser does not support WebGL 2,
    //display an error message and exit.
    if (gl == undefined) // Note the use of a double, rather than a tripple equals-sign.
                         //a webkit-based browser on Linux sets gl to null, rather than 
                         //undefined. THIS IS NOT A MISTAKE.
    {
        SubWindowHelper.alert("WebGL", "Oh, no! Your browser does not support WebGL! Please try a different browser (or if using WebKit, try to use this program again later).");
        
        return;
    }
    
    // Set up program.
    var vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    var program = linkProgram(gl, vertexShader, fragmentShader);
    
    // Bind the program.
    gl.useProgram(program);
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    // Create matricies.
    var worldMatrix = new Mat44();
    worldMatrix.toIdentity();
    
    var cameraMatrix = new Mat44();
    cameraMatrix.toIdentity();
    
    var viewMatrix;
    
    var updateView = function()
    {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        
        var aspect = gl.drawingBufferHeight / gl.drawingBufferWidth;
        var fovY = 70 / 180.0 * Math.PI;
        var zMin = 1;
        var zMax = 3000;
        
        viewMatrix = Mat44Helper.frustumViewMatrix(aspect, fovY, zMin, zMax);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        
        return viewMatrix;
    };
    
    updateView();
    
    // Uniform locations.
    var worldMatrixUniformLocation = gl.getUniformLocation(program, "u_worldMatrix");
    var worldInverseTrLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
    var cameraMatrixUniformLocation = gl.getUniformLocation(program, "u_cameraMatrix");
    var viewMatrixUniformLocation = gl.getUniformLocation(program, "u_viewMatrix");
    var lightPositionUniformLocation = gl.getUniformLocation(program, "u_lightPosition");
    var cameraPositionUniformLocation = gl.getUniformLocation(program, "u_cameraPosition");
    var shineAmountUniformLocation = gl.getUniformLocation(program, "u_shine");
    
    // Attribute locations.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var normalsLocation = gl.getAttribLocation(program, "a_normal") || 1;
    var vertexColorLocation = gl.getAttribLocation(program, "a_color") || 2;
    
    //console.log("a_position: " + positionLocation + "; a_normal: " + normalsLocation + "; a_color: " + vertexColorLocation + ";");
    
    var subWindow = SubWindowHelper.create({ title: "Modeler 3D", minWidth: 200, minHeight: 150 });
    subWindow.appendChild(canvas);
    subWindow.appendChild(controlsContainer);
    
    subWindow.content.style.display = "flex";
    subWindow.content.style.flexDirection = "column";
    canvas.style.flexGrow = "1";

    let computedNormals = [];
    
    // Tabs.
    var fileMenu = new SubWindowTab("File");
    
    if (onSubmit)
    {
        fileMenu.addCommand("Submit", function()
        {
            onSubmit(verticies, computedNormals);
        });
    }
    
    fileMenu.addCommand("Exit", function()
    {
        subWindow.close();
    });
    
    subWindow.addTab(fileMenu);
    
    // WebGL Settings.
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    var vertexAttribArray;
    
    // Copied from WebGL3.html
    verticies = verticies ||
    [
        // Face 1
        50, 50, 0,
        50, 0, 0,
        0, 0, 0,
        
        50, 50, 0,
        0, 0, 0,
        0, 50, 0,
        
        // Face 2
        50, 0, 50,
        50, 50, 50,
        0, 50, 50,
        
        50, 0, 50,
        0, 50, 50,
        0, 0, 50,
        
        // Face 3
        0, 50, 0,
        0, 0, 0,
        0, 0, 50,
                
        0, 50, 0,
        0, 0, 50,
        0, 50, 50,
        
        // Face 4
        50, 0, 0,
        50, 50, 0,
        50, 50, 50,
        
        50, 0, 0,
        50, 50, 50,
        50, 0, 50,
        
        // Face 5
        50, 50, 50,
        50, 50, 0,
        0, 50, 0,
        
        50, 50, 50,
        0, 50, 0,
        0, 50, 50,
        
        // Face 6
        50, 0, 50,
        0, 0, 50,
        0, 0, 0,
        
        50, 0, 50,
        0, 0, 0, 
        50, 0, 0
    ];
    
    let numberOfTrianglesToRender = 0; // Updated after verticies are buffered.
    
    // Create a progress-estimating function.
    let normalComputationProgressEstimator = new ProgressEstimator((n) => n);
    
    // Returns a promise. An optional updateProgress function
    //can be provided, with arguments estimated progress and message.
    //Note: Estimated progress is a real number, from zero to one.
    
    var reloadVerticies = function(updateProgressArg, newVerticies)
    {
        // If a set of new verticies were specified,
        if (newVerticies)
        {
            // Update the list of verticies.
            verticies = newVerticies;
        }
        
        // Variables for progress tracking.
        const totalSegments = 6;
        let currentSegment = 0;
        
        let lastProgressMessage = "";
        let lastProgressAmount = 0;
        
        // Allows progress to be displayed to the user.
        const updateProgress = function(message)
        {
            // If no argument was given,
            if (updateProgressArg === undefined)
            {
                return; // Stop.
            }
            
            lastProgressMessage = message;
            lastProgressAmount = currentSegment;
            
            // Make sure totalSegments is updated.
            console.assert(currentSegment < totalSegments);
            
            // Otherwise, note the progress change.
            let progress = currentSegment / totalSegments;
            updateProgressArg( progress, message );
            
            // Note that a new segment has begun.
            currentSegment++;
        };
        
        updateProgress("Preparing to generate normals and vertex colors...");
        
        // Decide whether to create a background thread.
        let usingThreads = verticies.length > 300;
        var thread;
        
        // Only if using threads,
        if (usingThreads)
        {
            // Create a thread so that tasks can be be on a different OS-level
            //thread.
            thread = ThreadHelper.makeLibLinkedThread();
        }
        
        // Create tasks for async processing.
        const normalsTolerance = 0.3; // When cos(angle between normals) is greater than normalsTolerance,
                                      // those normals are blended.
        
        const computeNormalsTask = (verticies, normalsTolerance) =>
        new Promise((resolve, reject) =>
        {
            // Compute normals from verticies.
            let normals = ModelHelper.computeNormals(verticies, normalsTolerance);
            
            resolve(normals);
        });
        
        const createColorsTask = (verticies) =>
        new Promise((resolve, reject) =>
        {
            var colors = [];
            var currentPart = [];
            var j;
            for (var i = 0; i < verticies.length; i++)
            {
                currentPart = JSHelper.getRandomColorArray(false, // No rounding.
                        0.3, 0.4, // Min and max for red.
                        0.3, 0.4, // Min and max for green.
                        0.4, 0.9); // Min and max for blue.
                        
                // Append each part of the current to the full color array.
                for (j = 0; j < currentPart.length && j < 3; j++)
                {
                    colors.push(currentPart[j]);
                }
            }
            
            resolve(colors);
        });
        
        // Push the tasks to the background thread,
        //if using threads.
        if (usingThreads)
        {
            thread.putFunction("computeNormals", ["verticies", "normalsTolerance"], computeNormalsTask);
            thread.putFunction("createColors", ["verticies"], createColorsTask);
        
            // Compile the thread.
            thread.compile();
        }
        
        // Run this after finding normals and vertex colors.
        const bufferDataTask = (normals, vertexColors) =>
        new Promise((resolve, reject) =>
        {
            updateProgress("Preparing to buffer data...");
            
            // Push to the end of the task queue, so
            //that the user can be notified of any 
            //progress changes.
            setTimeout(() =>
            {
                // Create buffers.
                const positionBuffer = gl.createBuffer();
                const normalsBuffer = gl.createBuffer();
                const colorsBuffer = gl.createBuffer();
                
                // Create the vertex attributes array.
                if (IN_WEBGL_2)
                {
                    vertexAttribArray = gl.createVertexArray();
                    gl.bindVertexArray(vertexAttribArray);
                }
                
                // Buffer verticies.
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                
                // Enable the vertex buffer.
                gl.enableVertexAttribArray(positionLocation);
                
                // Attribute data buffering...
                gl.vertexAttribPointer(positionLocation, 3, // 3 elements/calling.
                        gl.FLOAT,
                        false, // No normalization
                        0, 0); // Zero stride, zero offset.
                
                
                // Send the data to WebGL.
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticies), gl.STATIC_DRAW);
                
                
                // Select the normals buffer.
                gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
                
                gl.enableVertexAttribArray(normalsLocation);
                
                // Set up the pointer to the buffer.
                gl.vertexAttribPointer(normalsLocation, 3, // 3 elements/calling of shader
                        gl.FLOAT,
                        false,  // Do not normalize the normals.
                        0, 0); // No stride, no offset.
                
                
                // Send WebGL the data.
                gl.bufferData(gl.ARRAY_BUFFER, ModelHelper.vectorArrayToFloat32Array(normals), gl.STATIC_DRAW);
                
                
                // Select the colors buffer.
                gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
                
                gl.enableVertexAttribArray(vertexColorLocation);
                
                // Set up the pointer to the color attribute.
                gl.vertexAttribPointer(vertexColorLocation, 3, // Each color has three components.
                        gl.FLOAT, // Color components are floats.
                        false, // Don't normalize the colors.
                        0, 0); // Stride and offset are set to zero -- there is no ADDITIONAL STRIDE.
                        
                // Send the data to WebGL.
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);
                
                // Update the number of triangles to render.
                numberOfTrianglesToRender = verticies.length / 3;
                
                // Note the completion of this segment.
                updateProgress("Buffered data!");
                
                resolve(gl);
            }, 0);
        });
        
        // Create promises for both tasks.
        
        var colorsCalledResult, normalsCalledResult, startTime;
        
        // Note: The createColorsTask will finish before
        //the computeNormalsTask -- this allows estimated
        //progress to be displayed during the often-long-running
        //computeNormalsTask.
        if (usingThreads)
        {
            colorsCalledResult = thread.callFunction("createColors", [verticies]);
            normalsCalledResult = thread.callFunction("computeNormals", [verticies, normalsTolerance]);
        }
        else
        {
            colorsCalledResult = createColorsTask(verticies);
            normalsCalledResult = computeNormalsTask(verticies, normalsTolerance);
        }
        
        // Start recording the running time...
        normalComputationProgressEstimator.startRecord();
        
        const computeColorsPromise = colorsCalledResult.then(
        (colors) => 
        {
            updateProgress("Created colors! Now computing normals...");
            
            return colors;
        });
        
        const computeNormalsPromise = normalsCalledResult.then(
        (normals) => 
        {
            updateProgress("Found normals!");
            
            // Stop recording progress.
            normalComputationProgressEstimator.stopRecord(verticies.length);
            
            return normals;
        });
        
        // If displaying progress,
        if (updateProgressArg)
        {
            // Loop, updating the progress bar.
            normalComputationProgressEstimator.predictProgressLoop(verticies.length, progress =>
            {
                // Underestimate progress.
                let progressPercentString = "~ " + Math.floor(progress * 0.8 * 100) + "%";
                
                if (progress > 1.0)
                {
                    progressPercentString = "...";
                }
                
                updateProgressArg(lastProgressAmount / totalSegments + progress / totalSegments, lastProgressMessage + " (" + progressPercentString + ")");
            });
        }
        
        // After both the normals and random colors for verticies have generated,
        return Promise.all([computeNormalsPromise, computeColorsPromise]).then(values =>
        {
            // Unpack arguments.
            const normals      = values[0],
                  vertexColors = values[1];
            
            updateProgress("Done finding normals and vertex colors! Now buffering data...");

            // Cache the normals.
            computedNormals = normals;

            // Returns a promise, so .then/.catch can be used.
            return bufferDataTask(normals, vertexColors);
        });
    };
    
    reloadVerticies().then(render);
    
    // Where the camera is to look.
    var cameraLookAt = new Vector3(12, 0, 10);
    var upDirection = new Vector3(0, 1, 0);
    var cameraPosition = new Vector3(0, 0, 405);
    
    var updateWorldMatrix = function()
    {
        gl.uniformMatrix4fv(worldMatrixUniformLocation, false, worldMatrix.getTranspose().getArray());
        gl.uniformMatrix4fv(worldInverseTrLocation, false, worldMatrix.getInverse().getArray());
    };
    
    var updateMatricies = function()
    {
        // DO transpose.
        //Note: In WebGL 1.0, transpose must be false, so
        //this transposition is done by JS.
        updateWorldMatrix();
        gl.uniformMatrix4fv(viewMatrixUniformLocation, false, viewMatrix.getTranspose().getArray());
        gl.uniformMatrix4fv(cameraMatrixUniformLocation, false, cameraMatrix.getTranspose().getArray());
    };
    
    var setLightPosition = function(position)
    {
        gl.uniform4fv(lightPositionUniformLocation, [position.x, position.y, position.z, 1]);
    };
    
    var setCameraPosition = function(position)
    {
        cameraMatrix = Mat44Helper.createLookAtMatrix(position, cameraLookAt, upDirection);
        gl.uniform4fv(cameraPositionUniformLocation, [position.x, position.y, position.z, 1]);
        
        //cameraMatrix.rotateY(0.5);
        
        gl.uniformMatrix4fv(cameraMatrixUniformLocation, false, cameraMatrix.getTranspose().getArray());
    };
    
    // Set specular amount. Should be large floats.
    var setShine = function(shine)
    {
        gl.uniform1f(shineAmountUniformLocation, shine);
    };
    
    // Set initial light and camera positions.
    setLightPosition(new Vector3(1, -36, 800));
    setCameraPosition(cameraPosition);
    setShine(5000.0);
    
    var timesAnimated = 0;
    
    var render = function(xRotation, yRotation, zRotation, tX, tY, tZ)
    {
        if (canvas.width != canvas.clientWidth || canvas.height != canvas.clientHeight)
        {
            updateView();
        }
        
        var time = (new Date()).getTime();
        
        if (xRotation === undefined)
        {
            xRotation = Math.cos(time / 1000) * 0.2;
        }
        
        if (yRotation === undefined)
        {
            yRotation = Math.sin(time / 2000) * 6.28;
        }
        
        tX = tX || 0.0;
        tY = tY || 0.0;
        tZ = tZ !== undefined ? tZ : 300 + Math.sin(time / 6000) * 20;
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        
        worldMatrix.save();
        
        worldMatrix.rotateY(yRotation);
        worldMatrix.rotateX(xRotation);
        worldMatrix.rotateZ(zRotation || 0.0);
        worldMatrix.translate([tX, tY, tZ]);
        
        setCameraPosition(cameraPosition);
        updateMatricies();
        
        gl.drawArrays(gl.TRIANGLES, 0, numberOfTrianglesToRender);
        
        worldMatrix.restore();
    };
    
    var animationRunning = false;
    var animate = function()
    {
        render();
        animationRunning = true;
        
        if (timesAnimated < 2000)
        {
            timesAnimated++;
            
            requestAnimationFrame(animate);
        }
        else
        {
            timesAnimated = 0;
            animationRunning = false;
        }
    };
    
    var tX = 0, tY = 0, tZ = 230,
        rotateX = 0.1, rotateY = 0.2, rotateZ = 0.3;
    render(rotateX, rotateY, rotateZ, tX, tY, tZ);
    
    var pointerDown = false;
    var lastX, lastY;
    
    JSHelper.Events.registerPointerEvent("down", canvas, function(e)
    {
        e.preventDefault();
        
        pointerDown = true;
        
        lastX = e.clientX;
        lastY = e.clientY;
    });
    
    JSHelper.Events.registerPointerEvent("move", canvas, function(e)
    {
        if (pointerDown)
        {
            e.preventDefault();
            
            var x = e.clientX;
            var y = e.clientY;
            
            var dx = x - lastX;
            var dy = y - lastY;
            
            if (manipulationMode === "ROTATE")
            {
                rotateX += dx / (canvas.width || 100) * 6.28;
                rotateY += (dx * dy) / (canvas.width + canvas.height) * 3.14;
                rotateZ += dy / (canvas.height || 100) * 6.28;
            }
            else
            {
                cameraPosition.z -= dy;
            }
            
            render(rotateX, rotateY, rotateZ, tX, tY, tZ);
            
            lastX = x;
            lastY = y;
        }
    });
    
    JSHelper.Events.registerPointerEvent("stop", canvas, function(e)
    {
        e.preventDefault();
        
        pointerDown = false;
    });
    
    /*
    canvas.onclick = function(e)
    {
        e.preventDefault();
        
        if (!animationRunning)
        {
            timesAnimated = 0;
            
            console.log("Starting animation.");
            
            animate();
        }
    };*/
}
