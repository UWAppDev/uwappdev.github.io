"use strict";

/**
 *  A very simple content management system for uwappdev.github.io.
 * Although it is intended to be usable for changes to page content,
 * its primary goal is for management of tools that might be exposed
 * through the website. For example, displaying a survey without a commit
 * to Github.
 */
 
const ContentManager = {};

ContentManager.URL_PAGE_SPECIFIER_START = "?="; // Use this string to request a specific page.
ContentManager.currentPage = null;

/**
 *  Display a single page. If doNotAddToHistory is set,
 * the page will not be added to the window's set of backstacked pages.
 */
ContentManager.displayPage = 
async function(name, doNotAddToHistory)
{
    // Get elements.
    let contentZone = document.querySelector("#mainData");
    
    // Animate it!
    contentZone.parentElement.classList.add("shrinkGrow");
    
    // Check: Are we already on the page?
    if (ContentManager.currentPage === name)
    {
        return; // No need to load it twice.
    }
    
    await PageDataHelper.awaitLoad(); // Make sure we've loaded the page.
    
    ContentManager.currentPage = name;
    
    // Default values
    name = name || PageDataHelper.defaultPage;
    
    // Set content.
    contentZone.innerHTML = await PageDataHelper.getPageContent(name);
    
    // Did the page request a background?
    JSHelper.Notifier.notify(BACKGROUND_CHANGE_EVENT, PageDataHelper.pageBackgrounds[name]);
    
    // Cleanup animation
    setTimeout(() =>
    {
        contentZone.parentElement.classList.remove("shrinkGrow");
    }, ANIM_SHRINK_GROW_DURATION); // We assume it's safe after a ANIM_SHRINK_GROW_DURATION.
    
    // Push to backstack.
    if (window.history && !doNotAddToHistory)
    {
        const state = { pageName: name },
              title = '',
              url   = ContentManager.URL_PAGE_SPECIFIER_START + name;
              
        window.history.pushState(state, title, url);
    }
};

// Load a page after a change in
//the backstack data!
ContentManager.onBackstackTransit =
function()
{
    let requestedPage = ContentManager.getURLRequestedPage() || PageDataHelper.defaultPage;
    
    ContentManager.displayPage(requestedPage,
                               true); // Don't push to back stack again.
};

/**
 * Create buttons and connect them to actions.
 */
ContentManager.initializePages = 
async function()
{
    const createPage = (pageName, buttonZones) =>
    {
        for (let i = 0; i < buttonZones.length; i++)
        {
            HTMLHelper.addButton(pageName, buttonZones[i], () =>
            {
                ContentManager.displayPage(pageName);
            });
        }
    };
    
    // Load page shortcuts.
    const loadButtons = () =>
    {
        let buttonAreas = document.querySelectorAll(".navigationButtons");
        let pageName;
    
        // Create a button for every linked page.
        for (let pageIndex = 0; pageIndex < PageDataHelper.linkedPages.length; pageIndex++)
        {
            pageName = PageDataHelper.linkedPages[pageIndex];
            
            createPage(pageName, buttonAreas);
        }
    };

    await PageDataHelper.awaitLoad();
    
    loadButtons();
    
    // Check the URL -- has a specific page been linked to?
    let requestedPage = ContentManager.getURLRequestedPage() || PageDataHelper.defaultPage;
    
    // Display it.
    ContentManager.displayPage(requestedPage);
};

/**
 * Get the name of the page requested by the page's address bar.
 * If no page is requested, undefined is returned.
 */
ContentManager.getURLRequestedPage = () =>
{
    const specifierIndex = location.href.indexOf(ContentManager.URL_PAGE_SPECIFIER_START);
    let requestedPage = undefined;
    
    // Find the requested page.
    if (location.href && specifierIndex > location.href.lastIndexOf("/"))
    {
        // Get the page's name.
        requestedPage = location.href.substring
        (
            specifierIndex + ContentManager.URL_PAGE_SPECIFIER_START.length
        );
    }
    
    return requestedPage;
};

/**
 * Display UI letting users edit/manage pages.
 */
ContentManager.editPages = () =>
{
    const pageEditWindow = SubWindowHelper.create(
    { 
        title: "TODO",
        className: "pageManagementWindow"
    });
};

/**
 * Add any global content-management controls to the page.
 * For example, a sign-in button and survey management tools.
 */
ContentManager.addCMSControls = 
async function(parent)
{
    AuthHelper.insertAuthCommands(parent);
    
    // Any windows opened by the CMS.
    let CMSWindows = [];
    
    // Wrap all content-management utilities in
    //a div.
    let cmsWrapper = document.createElement("div");
    
    cmsWrapper.style.display = "none";
    cmsWrapper.style.flexDirection = "column";
    
    // Add buttons to the CMS.
    HTMLHelper.addButton("Page Editor", cmsWrapper, () =>
    {
        ContentManager.setBladeClosed(true);
        
        ContentManager.editPages();
    });
    
    // Show the content-management system.
    const showCMS = () =>
    {
        cmsWrapper.style.display = "flex";
    };
    
    // Hide the content-management system.
    const hideCMS = () =>
    {
        cmsWrapper.style.display = "none";
    };
    
    // Add the wrapper.
    parent.appendChild(cmsWrapper);
    
    while (true)
    {
        if (!AuthHelper.isSignedIn())
        {
            await JSHelper.Notifier.waitFor(AuthHelper.SIGN_IN_EVENT);
        }
        
        showCMS();
        
        await JSHelper.Notifier.waitFor(AuthHelper.SIGN_OUT_EVENT);
        
        hideCMS();
    }
};

/**
 * Add a search bar that permits searches through page titles and content.
 */
ContentManager.addPageSearch = 
function(parent)
{
    let searchInput, searchResultsDiv; // Define elements here so they can be accessed in helper
                                    //functions.
    
    const submitSearch = () =>
    {
        const searchText = searchInput.value;
        
        // Get search results!
        const results = PageDataHelper.query(searchText);
        
        // Clear the results list.
        searchResultsDiv.innerHTML = "";
        
        const makePageLink = (pageTitle, relevancy) =>
        {
            HTMLHelper.addButton(pageTitle + " (+" + relevancy + ")", searchResultsDiv,
            () =>
            {
                ContentManager.toggleBlade();
                ContentManager.displayPage(pageTitle);
                
                // Clear the search input.
                searchInput.value = "";
            });
        };
        
        // Note the number of results.
        let foundText = HTMLHelper.addTextElement("Found " + results.length + " result" + 
                                                 (results.length == 1 ? '' : 's') + ".",
                                                  searchResultsDiv);
        
        // Link to each.
        for (let i = 0; i < results.length; i++)
        {
            makePageLink(results[i][0], results[i][1]);
        }
        
        // Focus the results.
        searchResultsDiv.setAttribute("tabindex", 2);
        searchResultsDiv.focus();
        
        foundText.setAttribute("tabIndex", 2);
        foundText.focus();
    };

    searchResultsDiv = document.createElement("div"); 
    const searchDiv     = document.createElement("div");
    searchInput  = HTMLHelper.addInput("Search Pages", "", "text", 
                                            searchDiv, undefined, submitSearch);
    const searchButton = HTMLHelper.addButton("⥋", searchDiv, submitSearch);
    
    searchDiv.classList.add("searchContainer");
    searchResultsDiv.classList.add("searchResults");
    
    parent.appendChild(searchResultsDiv);
    parent.appendChild(searchDiv);
};

// Show/hide the blade.
ContentManager.toggleBlade = () => {};
ContentManager.setBladeClosed = (closed) => {};

/**
 *  Connects the main menu's UI to actions, among other things, connecting its
 * logo element to a menu.
 */
ContentManager.initializeMainMenu = 
async function()
{
    let logoDisplay = document.querySelector(".navabar .logo");
    let menuBlade = document.querySelector("#mainBlade"); // Lets call them "blades" --
                                                          //I think that's what they're called.
    
    const showHideBlade = () =>
    {
        menuBlade.classList.toggle("bladeClosed");
        menuBlade.classList.toggle("bladeOpen");
        
        logoDisplay.classList.toggle("requestRotate");
    };
    
    // Click listeners for showing/hiding.
    logoDisplay.addEventListener("click", showHideBlade);
    logoDisplay.setAttribute("tabindex", 1); // Allow focusing.
    logoDisplay.setAttribute("title", "Push Button. Push to access the main menu.");
    
    ContentManager.toggleBlade = showHideBlade;
    ContentManager.setBladeClosed = (closed) =>
    {
        if (closed)
        {
            menuBlade.classList.add("bladeClosed");
            menuBlade.classList.remove("bladeOpen");
            logoDisplay.classList.remove("requestRotate");
        }
        else
        {
            menuBlade.classList.remove("bladeClosed");
            menuBlade.classList.add("bladeOpen");
            logoDisplay.classList.add("requestRotate");
        }
    };
    
    // Add a sign-in button and a search bar.
    ContentManager.addCMSControls(menuBlade);
    HTMLHelper.addSpacer         (menuBlade);
    ContentManager.addPageSearch (menuBlade);
    
    while (true)
    {
        await JSHelper.Notifier.waitFor(AuthHelper.AUTH_MENU_USED);
        ContentManager.setBladeClosed  (true);
    }
};

// Handle all tasks related to initialization.
//Should be called by main.
ContentManager.init = () =>
{
    const me = ContentManager;
    
    me.initializePages();
    me.initializeMainMenu();
};

// Await page load, but push the request to a
//background frame to ensure JSHelper has loaded.
requestAnimationFrame(
async () =>
{
    await JSHelper.Notifier.waitFor(JSHelper.PAGE_SETUP_COMPLETE, true);
    
    // Enable backstack navigation.
    window.addEventListener("popstate", ContentManager.onBackstackTransit);
});
