/**
 * This script defines and fills the content of 
 * standard elements; e.g. the footer.
 */

 const CONTENT_REPLACEMENTS =
 {
    '.footer':
    `
    <div class = "img" style = "background-image: Url(/images/joinUs.png);"></div>
    <div class = "content">
        <p><a href = "/pages/join.html"><i>Join Us!</i></a>
            Do you have a project you want to share? 
            A framework you want to learn? A team you want to create? 
            Something else? Join us! All University of Washington 
            students are welcome!
        </p>
        <p>
            We have taught Flutter, SwiftUI, and even introductory Android
            development! Want to learn or teach a different platform?
            <a href = "mailto:appdev@uw.edu">Let us know.</a>
        </p>
    </div>
    `,

    '.header': 
    `
        <a href = "/pages/about.html">About</a>
        <a href = "/pages/support.html">Support Us</a>
        <a href = "/pages/join.html">Join Us</a>
    `,
};

/**
 *  replaceSelectors replaces all selectors provided in CONTENT_REPLACEMENTS
 * with their content, as defined in CONTENT_REPLACEMENTS.
 */
function relpaceSelectors()
{
    for (const selector in CONTENT_REPLACEMENTS)
    {
        const elements = document.querySelectorAll(selector);

        for (const element of elements)
        {
            element.innerHTML = CONTENT_REPLACEMENTS[selector];
        }
    }
}

function makeDropdownsAnimatable()
{
    const dropdowns = document.getElementsByTagName("details");

    // Render an arrow onto a canvas. The arrow points
    //right and can be rotated using CSS.
    const renderArrow = (canvas) =>
    {
        const ctx = canvas.getContext('2d');

        ctx.beginPath();

        ctx.moveTo(0, 0);
        ctx.lineTo(ctx.canvas.width, ctx.canvas.height / 2);
        ctx.lineTo(0, ctx.canvas.height);
        ctx.lineTo(0, 0);
    };

    // Configure a single dropdown element.
    // requires that each dropdown's first child is its title.
    // Content MUST be wrapped in a div after the title.
    const configureDropdown = (elem) =>
    {
        if (!elem || !elem.children 
            || elem.children.length !== 2) // Only animate if exactly two children.
        {
            return;
        }

        const titleHTML = elem.children[0].innerHTML; // Assumes elem.children[0] is the title.
        const contentHTML = elem.children[1].innerHTML;

        const parentElem = elem.parentElement;

        // Add the container.
        const dropdownContainer = parentElem.insertBefore(
                document.createElement('div'), // New node
                elem); // referenceNode (what newNode is inserted before).

        // Remove the element.
        parentElem.removeChild(elem);

        // Create portions of the new dropdown.
        const titleContainer = document.createElement("div");
        const contentContainer = document.createElement("div");

        // Create portions of the title.
        const arrow = document.createElement("canvas");
        const title = document.createElement("div");

        // Styling
        title.classList.add('titleContent');
        arrow.classList.add('arrow');
        titleContainer.classList.add('title');
        contentContainer.classList.add('content');
        dropdownContainer.classList.add('dropdown');
    };

    for (const elem of dropdowns)
    {
        configureDropdown(elem);
    }
}

// On page load...
replaceSelectors();
makeDropdownsAnimatable();