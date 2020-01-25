"use strict";

/**
 * A simple sript to permit editing of pages.
 */

const PageEditor = {};

// An editor for html-based pages!
PageEditor.__Editor = function(parent)
{
    const me = this;
    
    const ACTION_RENAME = 1, ACTION_NEW = 2, ACTION_UPDATE = 3,
            ACTION_DELETE = 4;
    const EDITOR_CHANGE_PAGE_EVENT = "PageEditor__Editor_ChangePageEvent";
            
    let currentPageKey, getContent, setContent;
    
    me.content = document.createElement("div");
    me.content.classList.add("pageEditor");
    
    // Create containers.
    me.textEditorContainer = document.createElement("div");
    me.codeEditorContainer = document.createElement("div");
    me.previewContainer    = document.createElement("div");
    me.keyboardContainer   = document.createElement("div");
    me.actionsContainer    = document.createElement("div");
    
    me.pageNameInput = HTMLHelper.addInput("Page Name", "", "text", me.content, 
            undefined, () => me.updatePageName());
    
    // Create editors.
    me.codeEditorDiv = document.createElement("div");
    
    me.codeEditor = new Editor(me.codeEditorDiv, me.keyboardContainer,
                               document.createElement("div"), me.previewContainer);
    me.textEditor = document.createElement("textarea");
    
    me.codeEditorContainer.appendChild(me.codeEditorDiv);
    me.textEditorContainer.appendChild(me.textEditor);
    
    // Add content to the actions tab.
    HTMLHelper.addButtons(
    {
        "Update": () =>
        {
            me.updatePage(); // No need to reload page content/data. UpdatePage
                             //does this for us!
        },
        "Delete": async () =>
        {
            let doDelete = await SubWindowHelper.confirm("Really delete?", "Relally delete " + currentPageKey + "?", "Yes", "No");
            
            if (doDelete)
            {
                await me.updatePage(currentPageKey, ACTION_DELETE);
                
                me.grayRegion();
                currentPageKey = undefined;
                setContent("DELETED");
                
                PageDataHelper.reloadPages();
                
                me.pageNameInput.value = "";
            }
        },
        "Publicization Options": () =>
        {
            me.configurePublicization();
        }
    }, me.actionsContainer);
    
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
     
    // Further styling.
    me.tabOptions.rootElement.classList.add("pageEditTabOptions");
    
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
    getContent = () => { return me.codeEditor.getText() };
    setContent = me.setCodeEditorText;
    
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

    // Work around a chrome formatting bug.
    me.tabOptions.rootElement.style.display = "block";
    me.tabOptions.rootElement.style.height = "100%";
    
    // Show
    parent.appendChild(me.content);
    
    // Public function definitions.
    this.grayRegion = function()
    {
        me.tabOptions.rootElement.classList.add("inactive");
    };
    
    this.editPage = async function(pageName)
    {
        me.tabOptions.rootElement.classList.remove("inactive");
        
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
        
        // Note that we're editing the page.
        JSHelper.Notifier.notify(EDITOR_CHANGE_PAGE_EVENT);
    };
    
    this.updatePage = async (pageName, action) =>
    {
        // If the user hasn't selected a page...
        if (!currentPageKey && !pageName)
        {
            await SubWindowHelper.alert("Error/no-page-name-set", "No page name set! Please select a page name (and make sure you pressed enter)!");

            return;
        }

        action = action || ACTION_UPDATE;
        pageName = pageName || currentPageKey;
    
        // Get database/user components.
        const user = firebase.auth().currentUser;
        
        try
        {
            let database = await CloudHelper.awaitComponent(CloudHelper.Service.FIRESTORE);
            
            const pageDoc = database.collection("pages").doc(pageName);
            const pageData = pageDoc.get();
            
            if (pageData.exists && action !== ACTION_UPDATE
                && action !== ACTION_DELETE)
            {
                await SubWindowHelper.alert("Conflict!", "A page with the name, " + pageName + ", already exists! It may not be public.");
                
                return false;
            }
            else if (action !== ACTION_DELETE)
            {
                let newContent = 
                {
                    title: pageName,
                    content: getContent(),
                    timestamp: (new Date()).getTime()
                };
                
                // Push to Firestore!
                await pageDoc.set(newContent);
                await me.updatePublicization(newContent);
                
                PageDataHelper.noteDocUpdate(newContent);
                JSHelper.Notifier.notify(ContentManager.UPDATE_PAGE_NOTIFY + pageName);
            }
            
            // Delete the old page, if renaming/deleting
            if (action === ACTION_RENAME || action === ACTION_DELETE)
            {
                await me.unpublish();
                
                let oldPageDoc = database.collection("pages").doc(currentPageKey);
                await oldPageDoc.delete();
            }
        }
        catch(error)
        {
            await SubWindowHelper.alert(error.code || "Error/unknown", error.message);
            return false;
        }
        
        // Set the current page name.
        currentPageKey = pageName;
        
        return true;
    };
    
    this.renamePage = async (pageName) =>
    {
        let result = false;
        
        if (pageName !== currentPageKey)
        {
            result = me.updatePage(pageName, ACTION_RENAME);
        }
        else
        {
            await SubWindowHelper.alert("Error/same name", "The old and new names must differ.");
        }
        
        
        // If a success...
        if (result)
        {
            await SubWindowHelper.alert("Done!", "Done renaming!");
            
            PageDataHelper.reloadPages();
            
            return true;
        }
        
        return false;
    };
    
    this.newPage = async (pageName) =>
    {
        await me.updatePage(pageName, ACTION_NEW);
        await me.editPage(pageName);
        
        PageDataHelper.reloadPages();
    };
    
    this.updatePageName = async function()
    {
        let newPageName = me.pageNameInput.value;
        
        if (newPageName === currentPageKey)
        {
            return;
        }
        
        let optionsWindow = SubWindowHelper.create({ title: "Options" });
        
        optionsWindow.enableFlex("column");
        
        if (currentPageKey)
        {
            HTMLHelper.addButton("Rename page to '" + newPageName + "'", optionsWindow, () =>
            {
                optionsWindow.close();
                me.renamePage(newPageName);
            });
            
            HTMLHelper.addButton("Make a copy of the page and name it '" + newPageName + "'.", 
                            optionsWindow,
                            () =>
            {
                optionsWindow.close();
                me.newPage(newPageName);
            });
        }
        else
        {
            HTMLHelper.addButton("New page called '" + newPageName + "'", optionsWindow, () =>
            {
                optionsWindow.close();
                me.newPage(newPageName);
            });
        }
    };
    
    this.unpublish = async () =>
    {
        let published = PageDataHelper.isPublished(currentPageKey);
        
        if (published)
        {
            try
            {
                await PageDataHelper.unpublish(currentPageKey);
            }
            catch(error)
            {
                await SubWindowHelper.alert("Error: " + error.code, error.message);
                
                return false;
            }
            
            return true;
        }
        
        return false;
    };
    
    // If the current page has already been published, update
    //the publication's timestamp.
    this.updatePublicization = async () =>
    {
        let published = PageDataHelper.isPublished(currentPageKey);
        
        if (published)
        {
            try
            {
                await PageDataHelper.publish(currentPageKey);
            }
            catch(error)
            {
                await SubWindowHelper.alert("Error: " + error.code, error.message);
                
                return false;
            }
            
            return true;
        }
        
        return false;
    };
    
    // Publish the page.
    this.publish = async () =>
    {
        try
        {
            await PageDataHelper.publish(currentPageKey);
        }
        catch(error)
        {
            await SubWindowHelper.alert("Error: " + error.code, error.message);
            
            return false;
        }
        
        return true;
    };
    
    this.configurePublicization = async () =>
    {
        if (!currentPageKey)
        {
            SubWindowHelper.alert("Error!", "Select a page first!");
            return;
        }
    
        let configWindow = SubWindowHelper.create({ title: "Publicization Options" });
        configWindow.enableFlex("column");
        
        let published = PageDataHelper.isPublished(currentPageKey);
        
        if (published)
        {
            HTMLHelper.addButton("Unpublish", configWindow, () =>
            {
                configWindow.close();
                
                me.unpublish();
            });
        }
        else
        {
            HTMLHelper.addButton("Publish", configWindow, () =>
            {
                configWindow.close();
                
                me.publish();
            });
        }
        
        // Get whether this page is linked to.
        let linkedTo = PageDataHelper.hasButtonLink(currentPageKey);
        
        if (linkedTo && published)
        {
            HTMLHelper.addButton("Remove Link", configWindow, async () =>
            {
                configWindow.close();
                
                try
                {
                    await PageDataHelper.registerButtonLink(currentPageKey, 0, true); // De-register.
                }
                catch(error)
                {
                    SubWindowHelper.alert("Err: " + error.code, error.message);
                }
            });
        }
        else if (published)
        {
            HTMLHelper.addButton("Add Link", configWindow, async () =>
            {
                configWindow.close();
                
                try
                {
                    let linkPrecedence = (await SubWindowHelper.prompt("Precedence", 
                        "Set the button's precedence.", { "Precedence": "number" }))["Precedence"];
                    await PageDataHelper.registerButtonLink(currentPageKey, false); // De-register.
                }
                catch(error)
                {
                    SubWindowHelper.alert("Err: " + error.code, error.message);
                }
            });
        }
    };
    
    this.close = () =>
    {
        me.closed = true;
    };
    
    this.getPageName = () =>
    {
        return currentPageKey;
    };
    
    // Note that nothing has been loaded.
    me.grayRegion();
    
    // Published/not-based styling.
    (async () =>
    {
        while (!me.closed)
        {
            if (PageDataHelper.isPublished(currentPageKey))
            {
                me.actionsContainer.classList.add("publishedPageNotice");
            }
            else
            {
                me.actionsContainer.classList.remove("publishedPageNotice");
            }
            
            await JSHelper.Notifier.waitForAny(
                                PageDataHelper.PAGE_PUBLISHED + currentPageKey,
                                PageDataHelper.PAGE_UNPUBLISHED + currentPageKey,
                                PageDataHelper.PAGES_RELOAD,
                                EDITOR_CHANGE_PAGE_EVENT);
        }
    })();
};

// Public constructor for __Editor.
PageEditor.create = (parentElement) =>
{
    return new PageEditor.__Editor(parentElement);
};
