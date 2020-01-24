"use strict";

/**
 *  A simple object to manage page content. At present,
 * we don't have a Content Management Service/back-end,
 * so this file might change soon.
 */

const PageDataHelper =
{
    loaded: false,
    awaitLoad: 
    (async () =>
    {
        if (!PageDataHelper.loaded)
        {
            for (let page in PageDataHelper.pagesLocal)
            {
                PageDataHelper.pages[page] = PageDataHelper.pagesLocal[page];
            }
            
            PageDataHelper.loaded = true;
            
            // We will be using the Firebase CMS.
            let db = await CloudHelper.awaitComponent(CloudHelper.Service.FIRESTORE);
            
            const pageTitleQuery   = await db.collection("pageTitles").get();
            const linkedPagesDoc = await db.collection("config").doc("buttonLinks").get();
            const nowTime = (new Date()).getTime();
            
            // For every page...
            const handleDoc = (docData) =>
            {   
                PageDataHelper.setPublished(docData.title, pageTitleQuery.docs[docData.title] ? true : false);
                
                if (!PageDataHelper.hasCached(docData.title, docData.timestamp || nowTime)) // getTime is already in UTC.
                {
                    PageDataHelper.pages[docData.title] = 
                    async () =>
                    {
                        let pageContent = docData.content;
                        
                        if (!docData.content)
                        {
                            const pageDoc = await db.collection("pages").doc(docData.title).get();
                            pageContent = pageDoc.data().content;
                        }
                        
                        // Store the content in the pages database.
                        PageDataHelper.pages[docData.title] = pageContent;
                        
                        // Cache it.
                        PageDataHelper.cachePage(docData.title, pageContent, docData.timestamp);
                        
                        return pageContent;
                    };
                }
                else if (docData.content)
                {
                    PageDataHelper.pages[docData.title] = docData.content;
                }
                else
                {
                    PageDataHelper.recallCachedPage(docData.title);
                }
            };
            
            // Let clients note document updates.
            PageDataHelper.noteDocUpdate = handleDoc;
            
            // If not an admin, search the published pages.
            if (!(await AuthHelper.isAdmin()))
            {
                pageTitleQuery.forEach((doc) =>
                {
                    handleDoc(doc.data());
                });
            }
            else // Otherwise, search ALL pages.
            {
                let allPages = await db.collection("pages").get();
                
                allPages.forEach((doc) =>
                {
                    handleDoc(doc.data());
                });
            }
            
            // Set pages linked to with large buttons.
            if (linkedPagesDoc.exists)
            {
                let pageLinks = linkedPagesDoc.data();
                
                for (let i in pageLinks)
                {
                    PageDataHelper.linkedPages.push(pageLinks[i]);
                }
            }
        }
        
        // Now, allow the user to load the page.
        return PageDataHelper.pages;
    }),
    
    noteDocUpdate: null, // Not loaded yet.
    pageBackgrounds: {"About": "empty", "Events": "logoAndWalls", "Join": "logo"},
    linkedPages: ["Join"],
    publishedPages: {},
    pages: {},
    pagesLocal:
    {
        "About":
        `
            <h1>About</h1>
            <h2>Our Mission</h2>
            <center><i>To provide an inclusive environment where the beginner and the experienced alike can learn and participate in the design, development, marketing, launching, and operating processes of real-world, market-suitable mobile apps.</i></center>
            <h2>Join</h2>
            <p>Come to Sieg 329 this Tuesday! Show up at 5:30 PM and start learning!</p>
        `,
        
        "Events":
        `
        <h1>Local Hack Day: Build @ UW</h1>
        <p>On December 7<sup>th</sup> from 8:00 AM to 9:00 PM, 
           Mobile Development Club will be hosting a hackathon! Come to get <strong>swag and laptop stickers</strong>, study for finals together, or learn something new through our workshops.
           Come build something awesome! Win prizes like the <strong>Amazon Echo Dot</strong>!</p>
        <button class = "hugeButton" onclick = "window.open('http://organize.mlh.io/participants/events/2874-local-hack-day-uw/register');">Register for FREE</button>

        <div id="schedule">
        <h2>Schedule</h2>
            <ul class="lhdSchedule">
                <li><b>8:00 &nbsp;AM</b> Check-in and registration!</li>
                <li><b>8:45 &nbsp;AM</b> Opening Ceremony</li>
                <li><b>10:00 AM</b> <span class="lhdWorkshop">iOS Development with Swift and SwiftUI</span></li>
                <li><b>10:00 AM</b> <span class="lhdStudyGroup">CSE 142 Study Group</span></li>
                <li><b>11:00 AM</b> <span class="lhdWorkshop">Android Development with Java</span></li>
                <li><b>11:00 AM</b> <span class="lhdWorkshop">How to Collaborate with GitHub</span></li>
                <li><b>12:00 PM</b> Lunch Break</li>
                <li><b>1:00 &nbsp;PM</b> <span class="lhdWorkshop">Algorithms: Hack the Technical Interview</span></li>
                <li><b>1:00 &nbsp;PM</b> <span class="lhdWorkshop">Build and Deploy Node.js Apps with Microsoft Azure</span></li>
                <li><b>2:00 &nbsp;PM</b> <span class="lhdStudyGroup">CSE 143 Study Group</span></li>
                <li><b>2:00 &nbsp;PM</b> <span class="lhdWorkshop">Python: Basic Training <span class = "dash"></span> Intro to Python Skills for AI</span></li>
                <li><b>3:00 &nbsp;PM</b> <span class="lhdWorkshop">Add an FAQ Bot to Your Webpage with Microsoft Azure</span></li>
                <li><b>6:00 &nbsp;PM</b> Dinner Break</li>
                <li><b>8:00 &nbsp;PM</b> End of Hacking, Start of Demos</li>
                <li><b>8:30 &nbsp;PM</b> Awards!</li>
                <li><b>9:00 &nbsp;PM</b> Event Ends</li>
            </ul>
            <p> The schedule is not final <span class = "dash"></span> it might change before the event without prior notification.</p>
        </div>
        
        <div>
            <h2 id="faq">Frequently Asked Questions</h2>
            <ul class="qaSection">
                <li>
                    <details open>
                        <summary>
                            I have a math final on that day!
                        </summary>

                        Many students have a math midterm on December 7<sup>th</sup>,
                        even several of the organizers will be leaving for midterms! <br> <br>
                        Think of the hackathon as a way to de-stress before or after your midterm.
                        If you need to leave early or arrive late, this is expected. Come.
                    </details>
                </li>
                <li>
                    <details open>
                        <summary>
                            Who can attend?
                        </summary>
                        
                        You must be a current student or staff at the University of Washington.
                    </details>
                </li>
                <li>
                    <details open>
                        <summary>
                            Do I have to attend all the workshops/study groups?
                        </summary>
                            
                        No! You can work on whatever you want, but bringing a pair of headphones with you is a good idea.
                    </details>
                </li>
                <li>
                    <details open>
                        <summary>
                            How do I win the awards?
                        </summary>
                        
                        We'll announce the award categories later, but it's as easy as
                        showing us the project you worked on <em>during</em> this hackathon!
                    </details>
                </li>
                <li>
                    <details open>
                        <summary>
                            Will there be food?
                        </summary>
                        
                        We recommend brining your own food with you.
                    </details>
                </li>
                <li>
                    <details open>
                        <summary>
                            I have other questions...
                        </summary>

                        Check the <a href="https://localhackday.mlh.io/build/locations/2874/" target="_blank" rel="noopener noreferrer">Major League Hacking FAQ</a>,
                        or contact us through 
                        <a href="mailto:appdev@uw.edu">email</a>, <a href="https://twitter.com/uwappdev" target="_blank" rel="noopener noreferrer">twitter</a>, 
                        or <a href="https://t.me/UWAppDev" target="_blank" rel="noopener noreferrer">telegram.</a>
                    </details>
                </li>
            </ul>
        </div>
        `,
        
        "Join":
        `
            <h1>Join</h1>
            <p>Attend one of our meetings! We meet Tuesdays in Sieg Hall, 
            room 329 from <b>5:30 PM</b> to <b>7:00 PM</b>.</p>
            
        `
    },
    
    defaultPage: "About"
};

// Helper methods.

PageDataHelper.PAGES_RELOAD = "PAGE_DATA_RELOAD_EVENT";

// Reload pages.
PageDataHelper.reloadPages      = 
async function()
{
    PageDataHelper.pages = {};
    PageDataHelper.loaded = false;
    
    JSHelper.Notifier.notify(PageDataHelper.PAGES_RELOAD);
};

// Get whether a page with the given name exists/has been published.
PageDataHelper.isPublished      = 
function(pageName)
{
    return PageDataHelper.publishedPages[pageName] === true; // Filters out true-like objects
                                                             //(not that there are any...)
};

// Note that a page has been published/unpublished
//locally (does not contact the server).
PageDataHelper.setPublished     =
function(pageName, newPublished)
{
    PageDataHelper.publishedPages[pageName] = newPublished === undefined ? true : newPublished;
};

// Actively unpublish a page. Note: This will fail
//unless the user has admin privileges (or something
//is very wrong).
PageDataHelper.unpublish        =
async function(pageName)
{
    const db = await CloudHelper.awaitComponent(CloudHelper.Service.FIRESTORE);
    const publicPages = await db.collection("pageTitles").doc(pageName);
    
    // Delete the title, thereby unpublishing the page.
    await publicPages.delete();
    
    // We don't want local records to note that the page is
    //published.
    PageDataHelper.setPublished(pageName, false);
    
    return true;
};

// Publishes a page. Requires admin privileges.
//Also use this on update of a page to ensure even distribution --
//if not called, the publication timestamp will be incorrect, potentially
//leading to old cache data.
PageDataHelper.publish          =
async function(pageName)
{
    const db = await CloudHelper.awaitComponent(CloudHelper.Service.FIRESTORE);
    const publicPages = await db.collection("pageTitles").doc(pageName);
    
    // Publish the page.
    await publicPages.set
    ({
        title: pageName,
        timestamp: (new Date()).getTime()
     });
    
    // Note that the page was published.
    PageDataHelper.setPublished(pageName, true);
    
    return true;
};

// Get a page.
PageDataHelper.getPageContent   = 
async function(pageName)
{
    let content = PageDataHelper.pages[pageName];
    
    if (typeof content == "function")
    {
        PageDataHelper.pages[pageName] = await content();
    }
    
    return PageDataHelper.pages[pageName];
};

// Cache a page.
PageDataHelper.cachePage = function(pageName, pageContent)
{
    console.log("Caching " + pageName);
    StorageHelper.put(pageName, pageContent);
};

// Read a page from the cache and store it.
PageDataHelper.recallCachedPage = function(pageName)
{
    const pageData = StorageHelper.get(pageName);
    
    if (pageData)
    {
        PageDataHelper.pages[pageName] = pageData;
    }
    else
    {
        console.error("Page data: " + pageData + " inaccessable.");
    }
};

// Get whether a page has been cached and whether that cache has
//not expired.
PageDataHelper.hasCached = (pageTitle, pageTimestamp) =>
{
    if (!StorageHelper.has(pageTitle))
    {
        return false;
    }

    const pageData = StorageHelper.getItemDetails(pageTitle);
    
    return !pageData.malformed && pageData.created >= pageTimestamp;
};

// Search for a specific page. The search query is
//case-insensitive. A sorted list of [page name, applicability]
//is returned, where applicability is an arbitrary positive number
//representing the applicability of a result to the search. Greater
//positive numbers are considered more applicable. Results with
//greater applicability should come first in the resultant array.
PageDataHelper.query = async function(query)
{
    let results = [];
    let matchesTitle, matchesInContent;
    
    await PageDataHelper.awaitLoad();
    
    let queryWords = query.toLowerCase().split(" ");
    
    const checkAgainstQuery = (text) =>
    {
        if (typeof text == 'function')
        {
            return 1; // Return 1 -- we haven't gotten the page from
                      //the server yet.
        }
        
        let resultsCount = 0;
        let lowerCaseText = text.toLowerCase();
        
        for (let i = 0; i < queryWords.length; i++)
        {
            resultsCount += lowerCaseText.split(queryWords[i]).length - 1;
        }
        
        return resultsCount;
    };
    
    for (let page in PageDataHelper.pages)
    {
        matchesTitle     = checkAgainstQuery(page);
        matchesInContent = checkAgainstQuery(PageDataHelper.pages[page]); // Content for unloaded
                                                                                //pages might be null.
        
        if (matchesTitle + matchesInContent > 0)
        {
            results.push([page, matchesTitle * 10 + matchesInContent]);
        }
    }
    
    // Sort the results.
    results.sort((a, b) =>
    {
        return b[1] - a[1];
    });
    
    return results;
};
