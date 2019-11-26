"use strict";

var ArrayHelper = {};

// Whether array a and array b are equivalent.
ArrayHelper.equals = function(a, b)
{
    if (a.length !== b.length)
    {
        return false;
    }
    
    for (var i = 0; i < a.length; i++)
    {
        if (a[i] !== b[i])
        {
            return false;
        }
    }
    
    return true;
};

ArrayHelper.softCopy = function(array)
{
    var result = [];
    
    for (var i = 0; i < array.length; i++)
    {
        result.push(array[i]);
    }
    
    return result;
};

