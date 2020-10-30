/**
 * Find all <details> ... </details> elements
 * and make their resize animatable.
 */
async function makeDropdownsAnimatable()
{
    const DROPDOWN_ANIMATION_TIME_MS = 500;

    const dropdowns = document.querySelectorAll("details");
    let nextDropdownIdNumber = 0;

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

        // Completely decorative.
        // Ref: https://a11yportal.com/advanced/design/images-svg-and-canvas.html
        arrow.setAttribute("role", "presentation");

        const contentContainerId = 'dropdown' + (nextDropdownIdNumber++);
        contentContainer.setAttribute('id', contentContainerId);

        // Resize the arrow (should be resized also by CSS).
        arrow.width = 200;
        arrow.height = 200;
        renderArrow(arrow);

        const updateAccessibilityState = () =>
        {
            const isVisible = dropdownContainer.classList.contains('expanded');

            titleContainer.setAttribute('aria-expanded', isVisible);
            contentContainer.setAttribute('aria-hidden', !isVisible);
        };

        const updateContentDisplay = () =>
        {
            const visible = dropdownContainer.classList.contains('expanded');

            if (visible)
            {
                contentContainer.style.display = "block";
            }
            else
            {
                contentContainer.style.display = "none";
            }
        };

        // Events.
        const toggleState = () =>
        {
            if (dropdownContainer.classList.contains('expanded'))
            {
                dropdownContainer.classList.remove('expanded');
                setTimeout(updateContentDisplay, DROPDOWN_ANIMATION_TIME_MS);
            }
            else
            {
                dropdownContainer.classList.add('expanded');
                updateContentDisplay();
            }

            updateAccessibilityState();
        };

        titleContainer.addEventListener('click', () => { toggleState(); });
        titleContainer.addEventListener('keydown', (e) => { if (e.keyCode == 13) { toggleState(); }}); // On enter-key press.

        // Usability.
        titleContainer.setAttribute('tabIndex', 0);
        titleContainer.setAttribute('role', 'button');
        titleContainer.setAttribute('aria-controls', contentContainerId);

        updateAccessibilityState();
        updateContentDisplay();

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

export { makeDropdownsAnimatable };