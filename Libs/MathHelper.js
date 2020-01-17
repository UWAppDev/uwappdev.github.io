"use strict";

var MathHelper = {};

MathHelper.distance2D = function(point1, point2)
{
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
};

MathHelper.numberScheme = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

MathHelper.parseCharacter = function(character, numberScheme)
{
    numberScheme = numberScheme || MathHelper.numberScheme;
    
    let numberIndex = numberScheme.indexOf(character);

    return numberIndex;
};

// Parses a number and does not throw invalid formatting exceptions.
//InputString is the number's string representation, radix its base,
//and initialPlaceValue the place-value of the rightermost portion.
//Note that initialPlaceValue is zero by default. To auto-detect
//this initialPlaceValue, use MathHelper.forceParseFloat.
MathHelper.forceParseNumber = function(inputString, radix, initialPlaceValue)
{
    radix = radix || 10;

    let currentChar, result = 0, placeValue = initialPlaceValue || 0;
    
    // For every character in the string.
    //  Add its single-char parse times radix**position
    //   to the result.
    for (var i = inputString.length - 1; i >= 0; i--, placeValue++)
    {
        currentChar = inputString.charAt(i);
        
        // Accumulate!
        result += Math.pow( 
                              radix, placeValue // Multiply radix^placeValue
                          )
                          *
                              MathHelper.parseCharacter(currentChar); // with the value
                                                                       //signified by the
                                                                       //current character.
    }
    
    return result;
};

MathHelper.forceParseInt = function(inputString, radix)
{
    return MathHelper.forceParseNumber(inputString, radix, 0);
};

MathHelper.forceParseFloat = function(inputString, radix)
{
    let dotLocation = inputString.indexOf('.');
    let initialPlaceValue;
    let smallHalf = "", largeHalf = "";
    
    if (dotLocation === -1)
    {
        initialPlaceValue = 0;
        
        largeHalf = inputString;
    }
    else
    {
        initialPlaceValue = inputString.length - dotLocation - 1;
        
        // Divide into before/after the dot.
        smallHalf = inputString.substring(dotLocation + 1);
        largeHalf = inputString.substring(0, dotLocation);
    }
    
    let result = 0;
    
    result += MathHelper.forceParseNumber(smallHalf, radix, -initialPlaceValue);
    result += MathHelper.forceParseNumber(largeHalf, radix, 0);
    
    return result;
};
