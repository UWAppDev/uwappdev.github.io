"use strict";

// An object that inherits from Point.
//Is a Vector3 a Point? NO! TODO Refactor
//this. Inheritance should fulfill an IS-A
//relationship.
function Vector3(x, y, z)
{
    Point.call(this, x, y, z); // Inherit from Point.
    this.IS_VECTOR = true;

    var me = this;
    
    this.x = x;
    this.y = y;
    this.z = z;
    
    /*
    A useful menomic for the cross product:
        | i  j  k  |       | y1 z1 |       | x1 z1 |       | x1 y1 |
    R = | x1 y1 z1 | = i * | y2 z2 | - j * | x2 z2 | + k * | x2 y2 |
        | x2 y2 z2 |   
    
    R = i * (y1 * z2 - z1 * y2) - j * (x1 * z2 - x2 * z1) + k * (x1 * y2 - x2 * y1)
    R = i * (y1 * z2 - z1 * y2) + j * (x2 * z1 - x1 * z2) + k * (x1 * y2 - x2 * y1)
    */
    this.cross = function(other)
    {
        var result = new Vector3(me.y * other.z - me.z * other.y, me.z * other.x - other.z * me.x, me.x * other.y - other.x * me.y);
        
        return result;
    };
    
    this.copy = function()
    {
        var result = new Vector3(me.x, me.y, me.z);
        
        return result;
    };
    
    this.mulScalar = function(scalar)
    {
        var result = new Vector3(me.x * scalar, me.y * scalar, me.z * scalar);
        
        return result;
    };
    
    this.multiplyScalar = this.mulScalar;
    
    this.mulScalarAndSet = function(scalar)
    {
        me.x *= scalar;
        me.y *= scalar;
        me.z *= scalar;
    };
    
    this.multiplyScalarAndSet = this.mulScalarAndSet;
    
    this.add = function(other)
    {
        var result = new Vector3(me.x + other.x, me.y + other.y, me.z + other.z);
        
        return result;
    };
    
    this.addAndSet = function(other)
    {
        me.x += other.x;
        me.y += other.y;
        me.z += other.z;
    };
    
    this.subtract = function(other)
    {
        var result = new Vector3(me.x - other.x, me.y - other.y, me.z - other.z);
        
        return result;
    };
    
    this.subtractAndSet = function(other)
    {
        me.x -= other.x;
        me.y -= other.y;
        me.z -= other.z;
    };
    
    // Demonstration/Informal Proof.
    // Given: v = <x, y>, e**(it) = cos t + i sin t.
    //To rotate by PI/2 radians, multiply v by e**(iPI/2),
    //because cos (t + X) + i sin (t + X) = e**(i(t + X)) = e**(it) * e**(iX).
    //Similarly, e**(iPI/2) = i because cos(PI / 2) = 0 and sin(PI/2) = 1.
    //Representing v using imaginary numbers, v = x + iy, so, to 
    //rotate by PI/2 radians, v = i * (x + iy) = ix - y, so,
    //v' = <-y, x> = <-v_y, v_x>. This is the same as crossing v
    //with the z-axis.
    this.perpindicular2D = function()
    {
        return new Vector3(me.y, -me.x, me.z);
    };
    
    this.dot = function(other)
    {
        return other.x * me.x + other.y * me.y + other.z * me.z;
    };
    
    this.getLength = function()
    {
        return Math.sqrt(me.x * me.x + me.y * me.y + me.z * me.z);
    };
    
    this.getLength2D = function()
    {
        return Math.sqrt(me.x * me.x + me.y * me.y);
    };
    
    this.normalize = function()
    {
        var length = me.getLength();
        
        if (length !== 0)
        {
            me.x /= length;
            me.y /= length;
            me.z /= length;
        }
        
        return me;
    };
    
    this.normalize2D = function()
    {
        var length = me.getLength2D();
        
        if (length !== 0)
        {
            me.x /= length;
            me.y /= length;
        }
        
        return me;
    };
    
    this.toString = function()
    {
        return "<" + me.x + ", " + me.y + ", " + me.z + ">";
    };
}
