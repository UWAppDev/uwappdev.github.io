"use strict";

/**
 * A simple sript to permit editing of pages.
 */

const PageEditor = {};

// An editor for html-based pages!
PageEditor.__Editor = function(parent)
{
    const me = this;
    
    me.content = document.createElement("div");
    me.content.classList.add("pageEditor");
    
    // Create containers.
    me.textEditorContainer = document.createElement("div");
    me.codeEditorContainer = document.createElement("div");
    me.previewContainer    = document.createElement("div");
    me.keyboardContainer   = document.createElement("div");
    me.actionsContainer    = document.createElement("div");
    
    me.pageNameInput = HTMLHelper.addInput("Page Name", "", "text", me.content, 
            undefined, me.updatePageName);
    
    // Create editors.
    me.codeEditorDiv = document.createElement("div");
    
    me.codeEditor = new Editor(me.codeEditorDiv, me.keyboardContainer,
                               document.createElement("div"), me.previewContainer);
    me.textEditor = document.createElement("textarea");
    
    me.codeEditorContainer.appendChild(me.codeEditorDiv);
    me.textEditorContainer.appendChild(me.textEditor);
    
    // Styling.
    me.codeEditorContainer.classList.add("codeEditorContainer");
    me.textEditorContainer.classList.add("textEditorContainer");
    me.previewContainer.classList.add("previewContainer");
    me.actionsContainer.classList.add("actionsContainer");
    me.pageNameInput.classList.add("pageNameInput");
    me.codeEditor.editCanvas.style.backgroundColor = "black";
    
    // Navigation & tabs.
    me.tabOptions = HTMLHelper.addTabGroup
    ({
        "Code Editor": me.codeEditorContainer,
        "Raw Text Editor": me.textEditorContainer,
        "Preview": me.previewContainer,
        "Actions": me.actionsContainer
     }, me.content, "Code Editor");
    
    // Set the content of the code editor.
    me.setCodeEditorText = (content) =>
    {
        me.codeEditor.clear();
        me.codeEditor.displayContent(content);
        me.codeEditor.render();
    };
    
    me.getTextEditorContent = () =>
    {
        return me.textEditor.value;
    };
    
    me.setTextEditorContent = (newContent) =>
    {
        me.textEditor.value = newContent;
    };
    
    // Get and set contents.
    let getContent = () => { return me.codeEditor.getText() };
    let setContent = me.setCodeEditorText;
    let currentPageKey;
    
    // Configure tabs.
    me.tabOptions.setOnTabChange((tabContents,
             newTabName, oldTabName) =>
    {
        // Use the old tab's contents to update that of the
        //new tab.
        let oldContent = undefined;
        
        if (oldTabName === "Code Editor")
        {
            oldContent = me.codeEditor.getText();
        }
        else if (oldTabName === "Raw Text Editor")
        {
            oldContent = me.textEditor.value;
        }
        else if (oldTabName === "Preview")
        {
            me.codeEditor.toggleRun(false);
            oldContent = getContent();
        }
        else
        {
            // Otherwise, in the actions tab.
            oldContent = getContent();
        }
        
        // Update the current view.
        if (newTabName === "Code Editor")
        {
            if (oldContent !== undefined && me.codeEditor.getText() !== oldContent)
            {
                me.setCodeEditorText(oldContent);
            }
            
            getContent = () => { return me.codeEditor.getText() };
            setContent = me.setCodeEditorText;
        }
        else if (newTabName === "Raw Text Editor")
        {
            if (oldContent !== undefined)
            {
                me.textEditor.value = oldContent;
            }
            
            getContent = me.getTextEditorContent;
            setContent = me.setTextEditorContent;
        }
        else if (newTabName === "Preview")
        {
            if (oldContent !== undefined && me.codeEditor.getText() !== oldContent)
            {
                me.setCodeEditorText(oldContent);
            }
            
            me.codeEditor.toggleRun(true);
        }
        else // Otherwise, we're in the Actions tab.
        {
            
        }
    });
    
    // Show
    parent.appendChild(me.content);
    
    // Public function definitions.
    this.grayRegion = function()
    {
        me.content.classList.add("inactive");
    };
    
    this.editPage = async function(pageName)
    {
        me.content.classList.remove("inactive");
        
        // Show its title.
        me.pageNameInput.value = pageName;
        
        let pageContent = await PageDataHelper.getPageContent(pageName);
        currentPageKey = pageName;
        
        // Display content in both the editor
        //and the text editor.
        me.codeEditor.clear();
        me.codeEditor.displayContent(pageContent);
        me.codeEditor.render();
        
        me.textEditor.value = pageContent;
    };
    
    this.updatePageName = function()
    {
        let newPageName = me.pageNameInput.value;
        
        
    };
    
    // Note that nothing has been loaded.
    me.grayRegion();
};

// Public constructor for __Editor.
PageEditor.create = (parentElement) =>
{
    return new PageEditor.__Editor(parentElement);
};
