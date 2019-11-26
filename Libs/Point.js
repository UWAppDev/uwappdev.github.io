"use strict";


// A simple Point class.
function Point(x, y, z)
{
    this.x = x;
    this.y = y;
    this.z = z || 0;
    
    this.NUM_COMPONENTS = 3;
    
    this.transformBy = function(matrix)
    {
        var arrayToTransform = [this.x, this.y, this.z];
        
        if (matrix.getWidth() === matrix.getHeight() && matrix.getWidth() === 4)
        {
            arrayToTransform.push(1);
        }
        
        MatHelper.transformPoint(arrayToTransform, matrix);
        
        this.x = arrayToTransform[0];
        this.y = arrayToTransform[1];
        this.z = arrayToTransform[2];
    };
    
    // Returns a copy of this object. Subclasses
    //should override this.
    this.copy = function()
    {
        var result = new Point(this.x, this.y, this.z);
        
        return result;
    };
    
    // Returns a rounded copy of the point, rounded to 
    //the specified number of decimal places.
    this.asRounded = function(decimalPlaces)
    {
        var result = this.copy();
        
        var multiplier = Math.pow(10, decimalPlaces);
        
        result.x = Math.floor(this.x * multiplier) / multiplier;
        result.y = Math.floor(this.y * multiplier) / multiplier;
        result.z = Math.floor(this.z * multiplier) / multiplier;
        
        return result;
    };

    this.toArray = function()
    {
        return [this.x, this.y, this.z];
    };
    
    this.fromArray = function(array)
    {
        let arrayCopy = [];
        
        // Ensure the array has sufficient size...
        for (let i = 0; i < this.NUM_COMPONENTS; i++)
        {
            arrayCopy.push(array[i] || 0);
        }
        
        this.x = arrayCopy[0];
        this.y = arrayCopy[1];
        this.z = arrayCopy[2];
    };
    
    this.toString = function()
    {
        return "(" + this.x + ", " + this.y + ", " + this.z + ")";
    };
}
