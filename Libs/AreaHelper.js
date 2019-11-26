"use strict";

var AreaHelper = {};

// SAT stands for the "Separating Axis Theorem".
//It is applied to collisions through the repeated
//projection of both shapes onto a shared axis.
// Each shape should be an array of Vector3s --
//from the origin to each point on the shape.
//This is designed for a pair of shapes -- it
//returns whether there is separation between
//AT LEAST two of the shapes.
AreaHelper.runSATCollisionTest2D = function(shapes, axis)
{
    var pointIndex, currentShape, edge, axis, projection, testIndex, shapeLength;

    let testAxis = (axis, testShapeIndex) =>
    {
        var projection, pointIndex;
        var leftermostTest, rightermostTest;
        
        for (pointIndex = 0; pointIndex < shapes[testShapeIndex].length; pointIndex++)
        {
            projection = axis.dot(shapes[testShapeIndex][pointIndex]);
            
            if (pointIndex === 0 || projection < leftermostTest)
            {
                leftermostTest = projection;
            }
            
            if (pointIndex === 0 || projection > rightermostTest)
            {
                rightermostTest = projection;
            }
        }
        
        // For all shapes,
        for (shapeIndex = 0; shapeIndex < shapes.length; shapeIndex ++)
        {
            if (shapeIndex === testShapeIndex)
            {
                continue;
            }
        
            // Project each point onto the axis.
            for (pointIndex = 0; pointIndex < shapes[shapeIndex].length; pointIndex++)
            {
                projection = axis.dot(shapes[shapeIndex][pointIndex]);
                
                // If the point is within the test area,
                if (projection > leftermostTest && projection < rightermostTest)
                {
                    // A collision occured.
                    return true;
                }
            }
        }
        
        // There were no collisions on this axis.
        return false;
    };

    // For every shape,
    for (var shapeIndex = 0, l = shapes.length; shapeIndex < l; shapeIndex ++)
    {
        currentShape = shapes[shapeIndex];
    
        // For every point on the shape,
        for (pointIndex = 0, shapeLength = currentShape.length; pointIndex < shapeLength; pointIndex++)
        {
            testIndex = (pointIndex + 1) % shapeLength;
            
            // An edge cannot be created from two of the same points!
            if (testIndex === pointIndex)
            {
                break;
            }
        
            // Compute the edge vector for the current point.
            edge = currentShape[pointIndex].subtract(currentShape[pointIndex + 1]);
            
            // Zero-vectors have no direction, and so cannot be normalized.
            if (edge.x == 0 && edge.y == 0)
            {
                break;
            }
            
            // The axis to project onto is perpindicular to that edge.
            axis = edge.perpindicular2D().normalize2D();
            
            // Project onto that axis.
            if (!testAxis(axis, shapeIndex))
            {
                return false;
            }
        }
    }
    
    // A collision occurred.
    return true;
};

