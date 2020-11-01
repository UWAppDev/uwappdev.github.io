/**
 * This script defines and fills the content of
 * standard elements; e.g. the footer.
 * 
 * Import it as a module.
 */

import { makeDropdownsAnimatable } from "./dropdowns.js";
import { replaceHeader, replaceSelectors } from "./contentReplacements.js";
 

// On page load...
async function main()
{
    await replaceSelectors();
    await replaceHeader();
    await makeDropdownsAnimatable();
}

main();