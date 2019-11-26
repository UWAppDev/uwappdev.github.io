"use strict";

/*
 A simple implementation of matricies in JavaScript.
 Just after construction, any such matrix is the zero
 matrix.
*/

function Mat(width, height)
{
    var me = this;
    
    this.content = [];
    
    var w = width;
    var h = height;
    
    var saveStack = [];
    
    var x;
    for (var y = 0; y < h; y++)
    {
        for (x = 0; x < w; x++)
        {
            this.content.push(0);
        }
    }
    
    this.getOrSetAt = function(x, y, setTo)
    {
        var result = 0;
        var index = x + y * w;
        
        if (index < this.content.length)
        {
            result = this.content[index];
            
            if (setTo !== undefined)
            {
                this.content[index] = setTo;
            }
        }
        
        return result;
    };
    
    this.getAt = function(x, y)
    {
        return this.getOrSetAt(x, y);
    };
    
    this.setAt = function(x, y, setTo)
    {
        return this.getOrSetAt(x, y, setTo);
    };
    
    this.swapValues = function(x1, y1, x2, y2)
    {
        var temp = me.getAt(x1, y1);
        
        me.setAt(x1, y1, me.getAt(x2, y2));
        me.setAt(x2, y2, temp);
    };
    
    this.leftMul = function(other)
    {
        return other.rightMul(this);
    };
    
    this.rightMul = function(other)
    {
        // Check to make sure other is not
        //undefined -- because of sloppy coding,
        //this could happen.
        if (other === undefined)
        {
            // Fail here?
            console.warn(`
            ~~~~~~~~~~~~~ WARNING -- POTENTIAL BUG ~~~~~~~~~~~
            Function Mat(${ w }, ${ h }).rightMul(otherMatrix)
            was called with otherMatrix === undefined. A copy
            of Mat(${ w }, ${ h }) was returned.
            `);
            
            // Return a copy -- nothing was to
            //happen.
            return this.getCopy();
        }
        
        var combinedW = w;
        var combinedH = other.getHeight();
        
        var otherWidth = other.getWidth();
        
        var resultMat = new Mat(combinedW, combinedH);
        
        var x, i, sum;
        for (var y = 0; y < combinedH; y++)
        {
            for (x = 0; x < combinedW; x++)
            {
                sum = 0;
                for (i = 0; i < h && i < otherWidth; i++)
                {
                    sum += me.getAt(x, i) * other.getAt(i, y);
                }
                
                resultMat.setAt(x, y, sum);
            }
        }
        
        return resultMat;
    };
    
    this.rightMulAndSet = function(other)
    {
        me.content = me.rightMul(other).getArrayCopy();
    };
    
    this.leftMulAndSet = function(other)
    {
        me.content = me.leftMul(other).getArrayCopy();
    };
    
    this.fromArray = function(array)
    {
        for (var i = 0; i < array.length; i++)
        {
            if (i >= this.content.length)
            {
                this.content.push(0);
            }
            
            this.content[i] = array[i];
        }
        
        return this;
    };
    
    this.getArray = function()
    {
        return this.content;
    };
    
    this.getArrayCopy = function()
    {
        var result = [];
        
        for (var i = 0; i < this.content.length; i++)
        {
            result[i] = this.content[i];
        }
        
        return result;
    };
    
    this.toArray = this.getArrayCopy;
    
    this.scalarMul = function(scalar)
    {
        for (var i = 0; i < this.content.length; i++)
        {
            this.content[i] *= scalar;
        }
    };
    
    this.multiplyScalar = this.scalarMul;

    this.scale = function(...scaleBy)
    {
        var indicies = [];

        if (typeof scaleBy[0] === "object" && scaleBy[0].toArray)
        {
            indicies = scaleBy[0].toArray();
        }
        else
        {
            indicies = scaleBy;
        }

        // Multiply the diagonal by segments of indicies.
        for (let i = 0; i < w && i < h && i < indicies.length; i++)
        {
            this.setAt(i, i, indicies[i] * this.getAt(i, i));
        }
    };
    
    this.getWidth = function()
    {
        return w;
    };
    
    this.getHeight = function()
    {
        return h;
    };
    
    this.toIdentity = function()
    {
        var y;
        for (var x = 0; x < w; x++)
        {
            for (y = 0; y < h; y++)
            {
                if (x == y)
                {
                    this.setAt(x, y, 1);
                }
                else
                {
                    this.setAt(x, y, 0);
                }
            }
        }
        
        return this;
    };
    
    this.toRightMulTranslateMatrix = function(translate)
    {
        this.toIdentity();
        
        for (var i = 0; i < translate.length && i < h - 1; i++)
        {
            this.setAt(w - 1, i, translate[i]);
        }
    };
    
    this.translate = function(translation)
    {
        for (var i = 0; i < translation.length && i < h - 1; i++)
        {
            this.setAt(w - 1, i, this.getAt(w - 1, i) + translation[i]);
        }
    };
    
    this.zoomCenter = function(zoom, width, height)
    {
        if (zoom < 1)
        {
            this.translate([width / 2, height / 2]);
        }
    
        this.multiplyScalar(zoom);
        
        if (zoom > 1)
        {
            this.translate([-width / 2, -height / 2]);
        }
    };
    
    this.getCopy = function()
    {
        return (new Mat(w, h)).fromArray(this.getArrayCopy());
    };
    
    this.multiplyRowByScalar = function(rowIndex, scalar)
    {
        for (var x = 0; x < w; x++)
        {
            this.setAt(x, rowIndex, this.getAt(x, rowIndex) * scalar);
        }
    };
    
    this.addConstantMultipleOfRowToRow = function(rowFromIndex, rowToIndex, scalar)
    {
        var rowFromValue, rowToValue;
        
        for (var x = 0; x < w; x++)
        {
            rowFromValue = this.getAt(x, rowFromIndex);
            rowToValue = this.getAt(x, rowToIndex);
            
            this.setAt(x, rowToIndex, rowToValue + rowFromValue * scalar);
        }
    };
    
    this.getInverse = function()
    {
        var moveToIdentity = this.getCopy();
        
        var moveToInverse = new Mat(w, h);
        moveToInverse.toIdentity();
        
        var x = 0, y = 0, diagonalValue = 0, scalar;
        for (x = 0; x < w; x++)
        {
            diagonalValue = moveToIdentity.getAt(x, x);
            
            // No inverse can be found using this method.
            //Return the closest value to the inverse, log
            //an error message.
            if (diagonalValue === 0)
            {
                console.warn("Error (Finding Inverse): Diagonal values cannot be zero!");
                return moveToInverse;
            }
            
            // Make the diagonal value 1.
            scalar = 1 / diagonalValue;
            
            moveToIdentity.multiplyRowByScalar(x, scalar);
            moveToInverse.multiplyRowByScalar(x, scalar);
            
            // Make all others in that column zero.
            for(y = 0; y < h; y++)
            {
                // If the row indicies match, skip
                //(the diagonal shouldn't be zero!)
                if (x === y)
                {
                    continue;
                }
                
                scalar = -moveToIdentity.getAt(x, y);
                moveToIdentity.addConstantMultipleOfRowToRow(x, y, scalar);
                moveToInverse.addConstantMultipleOfRowToRow(x, y, scalar);
            }
        }
        
        return moveToInverse;
    };
    
    this.transpose = function()
    {
        var result = new Mat(h, w);
        var y;
        
        for (var x = 0; x < w; x++)
        {
            for (y = 0; y < h; y++)
            {
                result.setAt(y, x, me.getAt(x, y));
            }
        }
        
        return result;
    };
    
    this.getTranspose = this.transpose;

    this.transposeAndSet = function()
    {
        me.result = me.transpose().result;

        const oldW = me.w;
        me.w = me.h;
        me.h = oldW;
    };
    
    this.save = function()
    {
        saveStack.push(this.getArrayCopy());
        
        // If the save stack is getting long, warn.
        if (saveStack.length > 10000)
        {
            console.warn("SaveStack.length = " + saveStack.length + ". Check for resource leaks.");
            window.leakedMat = this;
        }
    };
    
    this.restore = function()
    {
        if (saveStack.length > 0)
        {
            var restoreTo = saveStack.pop();
            
            this.fromArray(restoreTo); // ".content = restoreTo" should be faster than fromArray.
        }
    };
    
    this.toString = function(roundTo)
    {
        roundTo = roundTo || 3;
        
        var result = "[\n";
        
        var strings = [];
        
        var colStrings = [];
        
        var x, y, currentString, maxStringLengthInCol = 0, roundingMultiplier = Math.pow(10, roundTo);
        for (x = 0; x < w; x++)
        {
            maxStringLengthInCol = 0;
            colStrings = [];
            
            for (y = 0; y < h; y++)
            {
                currentString = (Math.floor(this.getAt(x, y) * roundingMultiplier) / roundingMultiplier) + "";
                
                if (currentString.indexOf(".") == -1)
                {
                    currentString += ".";
                }
                
                colStrings.push(currentString);
                
                maxStringLengthInCol = Math.max(currentString.length, maxStringLengthInCol);
            }
            
            for (y = 0; y < h; y++)
            {
                while (colStrings[y].length < maxStringLengthInCol)
                {
                    colStrings[y] += "0";
                }
            }
            
            strings.push(colStrings);
        } 
        
        for (y = 0; y < h; y++)
        {
            for (x = 0; x < w; x++)
            {
                result += " " + strings[x][y];
            }
            
            result += "\n";
        }
        
        result += "]";
        
        return result;
    };
}

function Mat44()
{
    var me = this;
    
    this.__proto__ = new Mat(4, 4);
    this.rightMulTransform = true;
    
    var transform = function(transformMatrix)
    {
        if (me.rightMulTransform)
        {
            me.rightMulAndSet(transformMatrix);
        }
        else
        {
            me.leftMulAndSet(transformMatrix.transpose());
        }
    };

    this.translate = function(array)
    {
        var translateMatrix = new Mat44();

        translateMatrix.toRightMulTranslateMatrix(array);

        if (me.rightMulTransform)
        {
            me.rightMulAndSet(translateMatrix);
        }
        else
        {
            translateMatrix.transposeAndSet();

            me.leftMulAndSet(translateMatrix);
        }
    };
    
    this.rotateX = function(dTheta)
    {
        var transformMatrix = Mat44Helper.getXRotationMatrix(dTheta);
        
        transform(transformMatrix);
    };
    
    this.rotateY = function(dTheta)
    {
        var transformMatrix = Mat44Helper.getYRotationMatrix(dTheta);
        
        transform(transformMatrix);
    };
    
    this.rotateZ = function(dTheta)
    {
        var transformMatrix = Mat44Helper.getZRotationMatrix(dTheta);
        
        transform(transformMatrix);
    };
}

var MatHelper = {};
var Mat33Helper = {};
var Mat44Helper = {};

/*
 This can be derived using y = r*sin(a), x = r*cos(a),
 y' = r*sin(a + da), and x' = r*cos(a + da). y' and x' can
 then be expanded using trigenometric identities (derivable from
 exp(ix + iy) = cos(x+y) + i*sin(x + y) 
 exp(ix + iy) = exp(ix) * exp(iy) = (cos(x) + i*sin(x))*(cos(y) + i*sin(y)).
*/
Mat33Helper.getRotationRightMulMatrix = function(deltaTheta)
{
    var result = new Mat(3, 3);
    result.toIdentity();
    
    result.setAt(0, 0, Math.cos(deltaTheta));
    result.setAt(1, 0, -Math.sin(deltaTheta));
    result.setAt(0, 1, Math.sin(deltaTheta));
    result.setAt(1, 1, Math.cos(deltaTheta));
    
    return result;
};

Mat44Helper.getXRotationMatrix = function(deltaTheta)
{
    var result = new Mat(4, 4);
    result.toIdentity();
    
    var cosValue = Math.cos(deltaTheta);
    var sinValue = Math.sin(deltaTheta);
    
    result.setAt(1, 1, cosValue);
    result.setAt(2, 1, sinValue);
    result.setAt(1, 2, -sinValue);
    result.setAt(2, 2, cosValue);
    
    return result;
};

Mat44Helper.getYRotationMatrix = function(deltaTheta)
{
    var result = new Mat(4, 4);
    result.toIdentity();
    
    var cosValue = Math.cos(deltaTheta);
    var sinValue = Math.sin(deltaTheta);
    
    result.setAt(0, 0, cosValue);
    result.setAt(2, 0, -sinValue);
    result.setAt(0, 2, sinValue);
    result.setAt(2, 2, cosValue);
    
    return result;
};

Mat44Helper.getZRotationMatrix = function(deltaTheta)
{
    var result = new Mat(4, 4);
    result.toIdentity();
    
    var cosValue = Math.cos(deltaTheta);
    var sinValue = Math.sin(deltaTheta);
    
    result.setAt(0, 0, cosValue);
    result.setAt(1, 0, -sinValue);
    result.setAt(0, 1, sinValue);
    result.setAt(1, 1, cosValue);
    
    return result;
};

Mat44Helper.fromArray = function(array)
{
    var result = new Mat44();
    result.fromArray(array);
    
    return result;
};

// Get a matrix (for right multiplication) that positions the camera
//such that it sees lookAt and up is up.
Mat44Helper.createLookAtMatrix = function(cameraPosition, lookAt, up)
{
    var zAxis = lookAt.subtract(cameraPosition);
    var yAxis = up.cross(zAxis);
    var xAxis = yAxis.cross(zAxis);
    
    xAxis.normalize();
    yAxis.normalize();
    zAxis.normalize();
    
    return Mat44Helper.createAxisTransformMatrix(xAxis, yAxis, zAxis, cameraPosition);
};

// Create an axis transform matrix.
//See webglfundamentals.org.
//TODO Double-check this refrence URL.
Mat44Helper.createAxisTransformMatrix = function(xAxis, yAxis, zAxis, origin)
{
    var result = Mat44Helper.fromArray(
    [
        xAxis.x, xAxis.y, xAxis.z, origin.x,
        yAxis.x, yAxis.y, yAxis.z, origin.y,
        zAxis.x, zAxis.y, zAxis.z, origin.z,
        0,       0,       0,       1
    ]);
    
    return result;
};

// Note: Aspect is height / width.
//zMin = zNear, zMax = zFar. Note that with this 
//view matrix, positive z is into the screen.
// This matrix is designed for right-multiplication,
//so be sure to transpose it if using for left-multiplication!
Mat44Helper.frustumViewMatrix = function(aspect, fovY, zMin, zMax)
{
    /*
        Note: result[x, y] denotes the (y + 1)th row and the (x + 1)th column
        of the resultant matrix.
    
        A reminder on how this works:
            For every point in world-space, x, y, and z must be scaled between -1 and 1 (clip-space).
            This can be done using a frustum (the shape below).
                              yMax (FOR ALL POINTS)
                             /|
                            / |
                  +y       [  |                                 < ---]
                   ^      /[  |                                      ]
                   |  yMin (FOR ALL POINTS)                          ]
                   |    /  [  |                                      ]
                   |   /|  P  |                 < ---]               ]  yMax (FOR THE
                   |  / |  [  |                      ]               ]  CURRENT POINT).
                   | /  |  [  |                      ]  P_y          ]
                   |/   |  [  |                      ]               ]
            CAMERA /)A  | P_z | ----------> +z  < ---]          < ---]
                       zMin  zMax
                       
            Consider a point, P and scaled point Q.
            
            To scale the y-component of P:
                Let A = fovY / 2.
                
                Define yMax to be the maximum P_y that can be displayed for the current P_z (before being clipped). This is labeled as "yMax (FOR THE CURRENT POINT)" on the diagram.
                
                Find yMax (For z = P_z):
                  tan(A)          = yMax / z
                  tan(A) * z      = yMax
                  yMax            = z * tan(A)
                
                Scale P_y:
                  Let y = P_y and y' = Q_y. (Where Q = P')
                  
                  y' = y / yMax                 Scale such that |y'| belongs to [0, 1].
                  y' = y / (z * tan(A))         Substitute.
                  y' = y / tan(A)
                        * (1 / z) < ------------ WebGL automatically divides by the w-component of gl_Position, so, a +1 is placed at result[2, 3] (zero-indexed) to set Q_z to w. 
                 
                  Based on this, result[1, 1] should be set to cot(A) to set y' to y / tan(A).
                
            To scale the x-component of P:
                Again, let x = P_x, y = P_y, z = P_z,
                    x' = Q_x, y' = Q_y, and z' = Q_z.
                
                Rather than providing separate fields of view for the x and y-axes, the x-axis is scaled with the y-axis.
                To prevent shapes generated from seeming "stretched," or "squished," we multiply the scaling factor by an "aspect ratio" -- the width / the height of the screen. This can be thought of as converting units -- from y-axis' units to the x-axis' units.
                
                x' = x * k * aspect_ratio where k = cot(A) * (1 / z) -- the scaling factor for P_y.
                x' = x * cot(A) / z * aspect_ratio (Note that x' is multiplied by -1 in the solution.
                                                    THIS IS A HACK. It compensates for an error somewhere
                                                    in the math and makes things work).
                
                From this, result[0, 0] is set to cot(A) * aspect_ratio. Note that the setting of result[2, 3] causes WebGL to divide x and y by z.
                
            To scale the z-component of P:
                P_z must be mapped from [zMin, zMax] to [-1, 1]. To do this, let
                z' = a / z + b -- scaling and shifting z to map between domains.
                Note that a division by z occurs -- WebGL automatically divides
                all components, even z by w, which we have set to z. This makes
                the math slightly more complicated for the z-component, but 
                less complicated for the x and y-components.
                
                To find a and b:
                    -1.0 = a / zMin + b and 1.0 = a / zMax + b
                    
                    -1.0 - a / zMin = b and 1.0 - a / zMax = b
                    -1.0 - a / zMin      =   1.0 - a / zMax
                    1.0 + a / zMin       =   a / zMax - 1.0
                    a / zMin - a / zMax  =   -2.0
a * zMax / (zMin * zMax) - a * zMin / (zMin * zMax)    =   -2.0
                    a * (zMax - zMin) / (zMin * zMax)  =   -2.0
                    a                                  =   -2.0 * zMin * zMax / (zMax - zMin)
                    
                    1.0 = a / zMax + b
                    1.0 = -2.0 * zMin * zMax / ((zMax - zMin) * zMax) + b
                    b   = 1.0 + 2 * zMin * zMax / (zMax * (zMax - zMin))
                    b   = 1.0 + 2 * zMin / (zMax - zMin), zMax != 0
                    so,
                    
                    z' = (-2.0 * zMin * zMax / (zMax - zMin)) / z + 1.0 + 2 * zMin / (zMax - zMin).
                
                    Assuming w = z,
                    result[3, 2] = a = -2.0 * zMin * zMax / (zMax - zMin)
                    
                    result[2, 2] = b = 1.0 + 2 * zMin / (zMax - zMin) <-- This part is multiplied
                                                                              by z, but then DIVIDED
                                                                              BY z BY WEBGL BECAUSE IT
                                                                              DIVIDES BY W.
        Sources:
            Matrix.js (Written 1 year ago).
            <stackoverflow link here>
    */
    
    // Calculate cot(fovY / 2).
    var cotValue = Math.tan(fovY / 2);
    
    // Uncomment for aid in debugging (like a unit-test,
    //but not as useful).
    //console.warn(1.0 + 2 * zMin / (zMax - zMin) + " b");
    //console.warn(-2.0 * zMin * zMax / (zMax - zMin) + " a");
    
    // Avoid division by zero.
    if (cotValue !== 0)
    {
        cotValue = 1 / cotValue;
    }
    else
    {
        // A very large number to approximate
        //the <u>+</u>Infinity produced by
        //1 / 0.
        cotValue = 999999999;
    }
    
    var result = Mat44Helper.fromArray(
    [
        cotValue * aspect, 0,        0,                              0,
        0,                 -cotValue, 0,                              0,
        0,                 0,        1.0 + 2 * zMin / (zMax - zMin), -2.0 * zMin * zMax / (zMax - zMin),
        0,                 0,        1,                              0
    ]);
    
    return result;
};

Mat33Helper.getTranslateMatrix = function(tX, tY)
{
    var result = new Mat(3, 3);
    result.toRightMulTranslateMatrix([tX, tY]);
    
    return result;
};

MatHelper.transformPoint = function(arrayVector, transformMatrix)
{
    var pointMatrix = new Mat(1, arrayVector.length);
    pointMatrix.content = arrayVector;
    
    pointMatrix.fromArray(pointMatrix.rightMul(transformMatrix).getArray());
};
