"use strict";

/**
 *  A simple user-interface permitting the review of
 * a page prior to its publication. This interface
 * runs in its own window and includes a GUI permitting
 * the selection of a page, if none is specified.
 */

const PageReviewer = {};

// A page reviewer. Construct through a factory
// method.
PageReviewer.__Reviewer = function(options)
{
    const me = this;

    options = options || {};

    const observationWindow = SubWindowHelper.create
        (
            JSHelper.mapUnite(options.windowManagerOptions || {}, { title: "Page Reviewer" });
        );

    const requestedPage = options.requestedPage;

    if (!requestedPage)
    {
        
    }
};
