"use strict";

const PYODIDE_WEB_WORKER_URL = "Pyodide/webworker.js";
const USE_PYTHON_WORKER = false;
const PYTHON_WORKER = USE_PYTHON_WORKER ? new Worker(PYODIDE_WEB_WORKER_URL) : undefined;
let PYTHON_CONSOLE_GLOBAL_ID_COUNTER = 0; // Lets python access an associated editor.

function PythonConsole()
{
    // Create UI.
    let consoleWindow = EditorHelper.openWindowedEditor("%%% PY", undefined, 
    {
        title: "Python Console",
        configureWindows: (runWindow, importExportWindow, keyboardWindow, viewerWindow) =>
        {
            // Close unneeded windows.
            runWindow.close();
            importExportWindow.close();
        }
    });
    let pythonConsoleConnection = { push: (content) => { console.error("NOT INITIALIZED"); } };
    let promptColor = "orange";
    const STDOUT_COLOR = "#33ffaa";
    const STDERR_COLOR = "#ffaaaa";
    const CONTINUED_LINE_PROMPT_TEXT = "... ";
    const PROMPT_TEXT = ">>> ";
    const AUTO_INDENT_INDENT_CHARS = "    ";
    const EDITOR_GLOBAL_ID = "_PythonConsoleObject" + PYTHON_CONSOLE_GLOBAL_ID_COUNTER++;
    
    // Make it accessible.
    self[EDITOR_GLOBAL_ID] = this;
    
    // Get the background worker.
    const pythonWorker = PYTHON_WORKER;
    
    // Note that this is a python console.
    consoleWindow.editControl.setDefaultHighlightScheme("py");
    
    // Handle events from python.
    if (pythonWorker) // The pythonWorker does not seem to work in all browsers...
                      // If it hasn't been defined, don't use it.
    {
        pythonWorker.onmessage = (event) =>
        {
            const { results, errors } = event.data;
            
            if (onMessageListeners.length > 0)
            {
                // Notify the first.
                if (results || !errors)
                {
                    (onMessageListeners[0])(results);
                }
                else
                {
                    (onMessageListeners[0])(errors);
                }
                
                onMessageListeners = onMessageListeners.splice(1);
            }
            else
            {
                console.log(results);
                console.warn(errors);
            }
        };
        
        pythonWorker.onerror = (event) =>
        {
            if (onMessageListeners.length > 0)
            {
                onMessageListeners[0]({ filename: event.filename, line: event.lineno,
                                                      message: event.message });
                
                onMessageListeners = onMessageListeners.splice(1);
            }
            else
            {
                console.warn(event.message + " ( " + event.filename + ":" + event.lineno + " ) " );
            }
        };
    }
    
    let onMessageListeners = []; //  A stack of everyone waiting for
                                 // a response from Python.
    
    // Register a listener for events from the python
    //worker. Paramater doNotRejectErrors represents
    //whether to "throw" an exception by calling reject
    //with the content of the error.
    let nextResponsePromise = (doNotRejectErrors) =>
    {
        let result = new Promise((resolve, reject) =>
        {
            onMessageListeners.push((results, failures) =>
            {
                resolve(results);
                
                if (failures && !doNotRejectErrors)
                {
                    reject(failures);
                }
            });
        });
        
        return result;
    };
    
    let runPython = (code) =>
    {
        // Can we use the worker?
        if (pythonWorker)
        {
            pythonWorker.postMessage(
            {
                python: code
            });
            
            return nextResponsePromise();
        } // If not,
        else
        {
            return pyodide.runPythonAsync(code);
        }
    };
    
    window.runPython = runPython;
    
    let handlePyResult = async function()
    {
        let stdoutContent = await runPython("sys.stdout.getvalue()");
        let stderrContent = await runPython("sys.stderr.getvalue()");
        
        await runPython("sys.stdout.truncate(0)\nsys.stdout.seek(0)");
        await runPython("sys.stderr.truncate(0)\nsys.stderr.seek(0)");
        
        if (stdoutContent)
        {
            consoleWindow.displayContent(stdoutContent, (line) =>
            {
                if (!line)
                {
                    return;
                }
                
                line.setColorFunction = (index) =>
                {
                    return STDOUT_COLOR;
                };
                
                line.editable = false;
            });
        }
        
        if (stderrContent)
        {
            consoleWindow.displayContent(stderrContent, (line) =>
            {
                if (!line)
                {
                    return;
                }
                
                line.setColorFunction = (index) =>
                {
                    return STDERR_COLOR;
                };
                
                line.editable = false;
            });
        }
    
        requestAnimationFrame(() =>
        {
            consoleWindow.render();
        });
    };
    
    let indentContinuedLine = (newPromptText, previousPromptText) =>
    {
        // Indent.
        for (let i = 0; i < previousPromptText.length; i++)
        {
            if (previousPromptText.charAt(i) == " ")
            {
                newPromptText += " ";
            }
            else
            {
                break;
            }
        }
        
        // Did the previous line end in a colon?
        if (previousPromptText.trim().endsWith(":"))
        {
            newPromptText += AUTO_INDENT_INDENT_CHARS;
        }
        
        // Did the previous line end in spaces?
        if (previousPromptText.endsWith(AUTO_INDENT_INDENT_CHARS))
        {
            newPromptText = CONTINUED_LINE_PROMPT_TEXT;
        }
        
        return newPromptText;
    };
    
    let promptLine = undefined;
    let createPrompt = (promptText) =>
    {    
        promptText = promptText || PROMPT_TEXT;
        
        let newLine = consoleWindow.editControl.appendLine(promptText);
        
        newLine.setColorFunction = (index) =>
        {
            if (index < promptText.length)
            {
                return promptColor;
            }
        };
        
        newLine.focus();
        consoleWindow.scrollToFocus();
        promptLine = newLine;
        
        
        newLine.onentercommand = () =>
        {
            try
            {
                newLine.onentercommand = function()
                {
                    if (promptLine)
                    {
                        promptLine.text = newLine.text;
                        
                        // Postpone focusing -- the
                        //enter command might still be 
                        //being processed.
                        requestAnimationFrame(() =>
                        {
                            promptLine.focus();
                            
                            consoleWindow.scrollToFocus();
                            
                            consoleWindow.render();
                        });
                    }
                };
                
                newLine.editable = false;
                
                let codeToRun = newLine.text.substring(promptText.length);
                
                pythonConsoleConnection.push(codeToRun).then(
                (result) =>
                {
                    if (!result)
                    {
                        handlePyResult().then(() =>
                        {
                            createPrompt(PROMPT_TEXT);
                        });
                    }
                    else
                    {
                        let newPrompt = createPrompt(CONTINUED_LINE_PROMPT_TEXT);
                        
                        newPrompt.text = indentContinuedLine(newPrompt.text, codeToRun);
                    }
                }).catch((error) =>
                {
                    error = error + "";
                    runPython("sys.stderr.write('''" + error.split("'''").join(",") + "''')");
                    
                    let onComplete = () =>
                    {
                    
                        handlePyResult().then(() =>
                        {
                            createPrompt(PROMPT_TEXT);
                        });
                    };
                    
                    // Push more code to the console. This completes
                    //the command for which an error was thrown.
                    pythonConsoleConnection.push("print('...')").then(onComplete).catch(onComplete);
                });
            }
            catch(e)
            {
                consoleWindow.displayContent("" + e);
                
                createPrompt(promptText);
            }
        };
        
        // Display changes.
        requestAnimationFrame(() =>
        {
            // Move the cursor.
            newLine.cursorPosition = newLine.text.length;
            
            // Render.
            consoleWindow.render();
        });
        
        // Return the line.
        return newLine;
    };
    
    // Run python.
    pythonConsoleConnection = 
    {
        push: (code) =>
        {
            // If we're using the worker,
            if (pythonWorker)
            {
                requestAnimationFrame(() =>
                {
                    pythonWorker.postMessage
                    (
                        {
                            __code: code,
                            python: "from js import __code\n_pushCode" + EDITOR_GLOBAL_ID + "(__code)"
                        }
                    );
                });
                
                return nextResponsePromise();
            }
            else
            {
                return new Promise((resolve, reject) =>
                {
                    try
                    {
                        window.__code = code;
                        resolve(pyodide.runPython("from js import __code\n_pushCode" + EDITOR_GLOBAL_ID + "(__code)"));
                    }
                    catch(e)
                    {
                        reject(e);
                    }
                });
            }
        }
    };
    
    this.codeRefresh = function()
    {
        handlePyResult();
    };
    
    languagePluginLoader.then(() =>
    {
        runPython(
            `
import io, code, sys
from js import self, pyodide

sys.stdout = io.StringIO()
sys.stderr = io.StringIO()

def _formattedPrint(inputObject, currentDepth = 0):
    MAX_LINE_LEN = 100 # Wrap lines at 100 chars
    
    indent = " " * currentDepth
    
    output = str(inputObject)
    
    # Wrap the output at MAX_LINE_LEN characters.
    lines = output.split("\\n")
    wrappedOutput = ""
    
    wordSeparators = [' ', ',', '.', '/']
    
    for i in lines:
        curLine = str(i)
        
        while len(curLine) > MAX_LINE_LEN:
            # Does it have an ending space?
            breakIndex = -1
            
            fullLine = curLine
            curLine = curLine[0:MAX_LINE_LEN]
            
            # Try to make breakIndex not -1.
            for sep in wordSeparators:
                if breakIndex != -1:
                    break
                breakIndex = curLine.rfind(sep)
            
            if breakIndex == -1:
                breakIndex = MAX_LINE_LEN
            
            wrappedOutput += curLine[0:breakIndex] + "\\n"
            curLine = fullLine[breakIndex:]
        
        wrappedOutput += curLine + "\\n"
    
    # Print the wrapped output, excluding the final line-break.
    print (wrappedOutput[0:len(wrappedOutput) - 1])    

# When the editor detects a returned promise...
def _Console_promiseFinished${EDITOR_GLOBAL_ID}(objectName, message):
    from js import ${EDITOR_GLOBAL_ID}
    
    print (objectName)
    _formattedPrint(message, 1) # Show the message
    
    # Refresh the editor.
    ${EDITOR_GLOBAL_ID}.codeRefresh();

# Prefix the console class!
# If running in the window's cPython runtime,
#it might be shared with other consoles!
class Console${EDITOR_GLOBAL_ID}(code.InteractiveConsole):
    def runcode(self, code):
        from js import pyodide
        
        out = pyodide.runPython("\\n".join(self.buffer))
      
        if out != None:
            _formattedPrint(out)
            
            # Is it a promise?
            if "then" in dir(out):
                try:
                    out.then(
                            lambda message: 
                                _Console_promiseFinished${EDITOR_GLOBAL_ID}
                                                    ("%s: " % out, message)
                            )
                except Exception as e:
                    sys.stderr.write("Internal Error: " + str(e))

_mainConsole${EDITOR_GLOBAL_ID} = Console${EDITOR_GLOBAL_ID}(locals=globals())

def _pushCode${EDITOR_GLOBAL_ID}(code):
    return _mainConsole${EDITOR_GLOBAL_ID}.push(code)

# Define a pyodide-specific help menu.
# TODO Finish this
def help_pyodide():
    print ("Welcome to the Python console.")
    print ("This help message (not created")
    print ("by Pyodide) is currently under")
    print ("development! It is a TODO.")
    print ("------Loading Libraries-----")
    print ("1.  from js import pyodide")
    print ("2.  pyodide.loadPackage('package_name_here')")
    print ()
    print ("   The first line requests that")
    print ("  the pyodide object defined in")
    print ("  JavaScript be imported --    ")
    print ("  that python be given access to")
    print ("  it.")
    print ("   On line two, having gotten")
    print ("  access to this package, we ")
    print ("  load a package with name   ")
    print ("  package_name_here.")
    print ("   Packages available in this")
    print ("  way include matplotlib,    ")
    print ("  numpy, pandas, and others. ")
    print (" (See Pyodide's documentation)")
    print ()
    print ()
    print ("------Interacting With JavaScript-------")
    print ("    from js import document")
    print ()
    print ("    As explained previously, objects can")
    print ("  imported from JavaScript! The example")
    print ("  makes the object document visible to")
    print ("  Python.")
    print ()
    print ()
    print ("------Limitations---------------------")
    print ("    Currently, input() calls result in")
    print (" a prompt requesting input. This is not")
    print (" desirable. Additional information")
    print (" might be put here in the future.")

# Display a banner.
print (sys.version)
print ("Python from Pyodide")
print ("(From Mozilla. See https://github.com/iodide-project/pyodide)")
print ("See the provided site for Pyodide's source and license.")
print (" Try typing help(), license() or credits for more information.")
print (" For pyodide-related help, try help_pyodide().")
print ("--------------------------------------------------------------")

license.MAXLINES = 1000 # As of the time of this writing, input() displays
                        # a prompt dialogue. This is undesirable, so the
                        # entire license message should be printed (or
                        # close to it).
`).then(() =>
        {
            handlePyResult().then(() =>
            {
                consoleWindow.editControl.appendLine("");
                
                requestAnimationFrame(() =>
                {
                    createPrompt();
                });
            });
        });
    });
}
