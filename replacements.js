'use strict';

/**
 * This script defines and fills the content of
 * standard elements; e.g. the footer.
 */

 const PAGES_DIRECTORY = "/pages";
 const IMAGES_DIRECTORY = "/images";

 const CONTENT_REPLACEMENTS =
 {
    'footer':
    `
    <div class = "img" style = "background-image: Url(${IMAGES_DIRECTORY}/joinUs.png);"></div>
    <div class = "content">
        <p><a href = "${PAGES_DIRECTORY}/join.html"><i>Join Us!</i></a>
            Do you have a project you want to share?
            A framework you want to learn? A team you want to create?
            Something else? Join us! All University of Washington
            students are welcome!
        </p>
        <p>
            We have taught Flutter, SwiftUI, and even introductory Android
            development! Want to learn or teach a different platform?
            <a href = "https://discord.gg/ZyDM5Br">Let us know.</a>
        </p>
    </div>
    `,

    'header':
    `
        <a href = "${PAGES_DIRECTORY}/about.html">About</a>
        <a href = "${PAGES_DIRECTORY}/support.html">Support Us</a>
        <a href = "${PAGES_DIRECTORY}/join.html">Join Us</a>
    `,
};

/**
 *  replaceSelectors replaces all selectors provided in CONTENT_REPLACEMENTS
 * with their content, as defined in CONTENT_REPLACEMENTS. replaceSelectors
 * is async, allowing calling code to push itself to the next animation frame
 * for further DOM manipulations.
 */
async function replaceSelectors()
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

/**
 * Find all <details> ... </details> elements
 * and make their resize animatable.
 */
async function makeDropdownsAnimatable()
{
    const dropdowns = document.querySelectorAll("details");

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

        ctx.fill();
    };

    // Configure a single dropdown element.
    // requires that each dropdown's first child is its title.
    // Content MUST be wrapped in a div after the title.
    const configureDropdown = async (elem) =>
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

        // Add any additional class labels to the dropdown container.
        for (const newClass of elem.classList)
        {
            if (newClass)
            {
                dropdownContainer.classList.add(newClass);
            }
        }

        // Remove the element.
        parentElem.removeChild(elem);

        // Create portions of the new dropdown.
        const titleContainer = document.createElement("div");
        const contentContainer = document.createElement("div");

        // Create portions of the title.
        const arrow = document.createElement("canvas");
        const title = document.createElement("div");

        // Fill content.
        title.innerHTML = titleHTML;
        contentContainer.innerHTML = contentHTML;

        // Styling
        title.classList.add('content'); // title and contentContainer have different parent elements, so both can have class content...
        arrow.classList.add('arrow');
        titleContainer.classList.add('title');
        contentContainer.classList.add('content'); // ...we can still distinguish them.
        dropdownContainer.classList.add('dropdown');

        // Resize the arrow (should be resized also by CSS).
        arrow.width = 200;
        arrow.height = 200;
        renderArrow(arrow);

        // Events.
        const toggleState = () =>
        {
            if (dropdownContainer.classList.contains('expanded'))
            {
                dropdownContainer.classList.remove('expanded');
            }
            else
            {
                dropdownContainer.classList.add('expanded');
            }
        };

        titleContainer.addEventListener('click', () => { toggleState(); });
        titleContainer.addEventListener('keydown', (e) => { if (e.keyCode == 13) { toggleState(); }}); // On enter-key press.

        // Usability.
        titleContainer.setAttribute('tabIndex', 1);

        // Build element hierarchy
        dropdownContainer.appendChild(titleContainer);
        dropdownContainer.appendChild(contentContainer);

        titleContainer.appendChild(arrow);
        titleContainer.appendChild(title);

        return true;
    };

    for (const elem of dropdowns)
    {
        await configureDropdown(elem);
    }
}

// On page load...
async function main()
{
    await replaceSelectors();
    await makeDropdownsAnimatable();
}

main();