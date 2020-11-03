
const DROPDOWN_LINKS =
{
    'Home': '/index.html',
    'About': '/pages/about.html',
    'Calendar': '/pages/calendar.html',
    'Join Us': '/pages/join.html',
    'Resources':
    {
        'GitHub': 'https://github.com/uwappdev',
        'HuskyLink': '/404',
        'More': '/404',
    },
};

function createNavigationDropdowns()
{
    const container = document.createElement("div");
    container.classList.add("navDropdown");

    let handleDropdowns;

    const handleDropdown = (title, data, containerElem) =>
    {
        const titleElem = document.createElement("a");
        titleElem.innerText = title;
        containerElem.appendChild(titleElem);

        titleElem.setAttribute("role", "button");
        titleElem.setAttribute("tabindex", 0);

        // A link...
        if (typeof data === "string")
        {
            titleElem.classList.add("dropdownLink");

            titleElem.setAttribute("href", data);
        }
        else
        {
            titleElem.classList.add("dropdownLabel");

            const clickEvt = () =>
            {
                console.log("Click event fired.");
            };

            titleElem.addEventListener("click", clickEvt);
            titleElem.addEventListener("keydown", (evt) =>
            {
                if (evt.key === "Enter")
                {
                    clickEvt();
                }
            });

            // A list of links.
            handleDropdowns(data, contents);
        }
    };

    handleDropdowns = (data, container) =>
    {
        for (const name in data)
        {
            handleDropdown(name, data[name], container);
        }
    };

    handleDropdowns(DROPDOWN_LINKS, container);

    return container;
}

export { createNavigationDropdowns };