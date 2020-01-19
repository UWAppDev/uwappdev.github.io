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
    
    // Create editors.
    me.codeEditorDiv = document.createElement("div");
    
    me.codeEditor = new Editor(me.codeEditorDiv, me.keyboardContainer,
                               me.textEditorContainer, me.previewContainer);
                               
    me.codeEditorContainer.appendChild(me.codeEditorDiv);
    
    // Styling.
    me.codeEditorContainer.classList.add("codeEditorContainer");
    me.textEditorContainer.classList.add("textEditorContainer");
    
    // Create tabs.
    me.tabOptions = HTMLHelper.addTabGroup
    ({
        "Code Editor": me.codeEditorContainer,
        "Raw Text Editor": me.textEditorContainer,
        "Preview": me.previewContainer
     }, me.content, "Code Editor");
    
    parent.appendChild(me.content);
    
    setInterval(me.notifyResize, 100);
    
    // Public function definitions.
    this.grayRegion = function()
    {
        me.content.classList.add("inactive");
    };
    
    this.loadPage = function(pageName)
    {
        me.content.classList.remove("inactive");
        
        // TODO
    };
    
    me.grayRegion();
};

// Public constructor for __Editor.
PageEditor.create = (parentElement) =>
{
    return new PageEditor.__Editor(parentElement);
};
