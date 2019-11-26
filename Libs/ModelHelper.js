"use strict";

var ModelHelper = {};

/*
 Compute normals for a given set of verticies. Normals
 will be set to the average of all at the edge of each
 face.
 
 As in interfaces used to connect to WebGL, the stride
 is the number of components of verticies to be considered
  at a time. NOTE: THIS MUST BE GREATER THAN OR EQUAL TO NINE.
   If greater, only the first three components of each vertex
 will be used to compute normals (the cross product is used).
 Verticies are grouped into triangles with each vertex starting at
 CURRENT_INDEX + FLOOR(stride / 3). Please note that the stride should
 be equal to the number of components of verticies per triangle on the object.
*/
ModelHelper.computeNormals = function(verticies, tolerance, stride, offset)
{
    // Set default values.
    if (tolerance === undefined)
    {
        tolerance = 1.0;
    }
    
    stride = stride || 9;
    offset = offset || 0;
    
    // Check for out-of-bounds offset/stride.
    if (stride < 9 || stride > verticies.length)
    {
        throw "Invalid stride: " + stride + ". !(stride >= 9 && stride <= (verticies.length = " + verticies.length + ") ) is true.";
    }
    else if (offset < 0 || offset >= verticies.length)
    {
        throw "Invalid offset of " + offset + ". Offset must be >= 0 and <= verticies.length. Verticies.length is " + verticies.length;
    }
    
    // Get a 3D point from the verticies
    //array at an index. A Vector3 is 
    //used rather than a Point to allow
    //usage of subtract.
    var getPoint = function(index)
    {
        var result = new Vector3(verticies[index], verticies[index + 1], verticies[index + 2]);
        
        return result;
    };
    
    var getMapKey = function(point)
    {
        return point.asRounded(3).toString();
    };
    
    // Note the existence of a normal at a given point.
    var noteNormalExistence = function(point, normal)
    {
        // If the tolerance is one, DO NOT DO THIS.
        if (tolerance === 1.0)
        {
            return;
        }
        
        var mapKey = getMapKey(point);
        
        // If this is the first time the vertex has been recorded in the map,
        //create the array.
        if (coordinateToNormalMap[mapKey] == undefined)
        {
            coordinateToNormalMap[mapKey] = [];
        }
        
        coordinateToNormalMap[mapKey].push(normal);
    };
    
    // Get the averaged normal for a point.
    //If the dot product's absolute value is
    //greater than the tolerance, do not average.
    //NOTE: THIS MUST BE CALLED AFTER POPULATING
    //THE COORDINATETONORMALMAP.
    var getAveragedNormal = function(point, normal)
    {
        // If the tolerance is one, just return the normal.
        if (tolerance === 1.0)
        {
            return normal;
        }
        
        // Otherwise, find similar normals within |cos(dtheta)| <= tolerance.
        var mapKey = getMapKey(point);
        var surroundingNormals = coordinateToNormalMap[mapKey] || [];
        var normalsToAverage = [];
        
        for (var i = 0; i < surroundingNormals.length; i++)
        {
            if (surroundingNormals[i] !== normal && normal.dot(surroundingNormals[i]) >= tolerance)
            {
                normalsToAverage.push(surroundingNormals[i]);
            }
        }
        
        var result = normal;
        
        // Average all acceptable normals.
        //Note that division does not occur
        //until after the summation, leaving 
        //result inaccurate until normalization
        //occurs. Normalization has been added.
        for (var j = 0; j < normalsToAverage.length; j++)
        {
            result.addAndSet(normalsToAverage[j]);
        }
        
        result.normalize();
        
        return result;
    };
    
    // Compute the normal vector for a single point
    //on a triangle.
    var getNormal = function(triangleStart, considerIndexStart)
    {
        // Find the current point.
        var current = getPoint(considerIndexStart);
        
        // Find the two points.
        var triangleVertexIndex = (considerIndexStart - triangleStart) / elementsPerVertex;
        
        //console.log("Vertex: " + triangleVertexIndex);
        
        // Determine the indicies of the other points.
        var other1Index = ((triangleVertexIndex + 1) % 3) * elementsPerVertex + triangleStart;
        var other2Index = ((triangleVertexIndex + 2) % 3) * elementsPerVertex + triangleStart;
        
        // Actually access and store the points.
        var other1 = getPoint(other1Index);
        var other2 = getPoint(other2Index);
        
        // Find the vectors from the current point to the other two.
        var to1 = current.subtract(other1);
        var to2 = current.subtract(other2);
        
        // Cross to1 and to2 to find a vector perpindicular to
        //both. TODO Ensure this vector is in the correct direction.
        var normal = to1.cross(to2);
        
        // Normalize the normal.
        normal.normalize();
        
        //console.log(considerIndexStart + ", " + other1Index + ", " + other2Index 
        //        + " => (" + to1.toString() + "; " + to2.toString() + ") => " + normal.toString());
        
        // Note the normal's existance.
        noteNormalExistence(current, normal);
        
        return normal;
    };
    
    // Prepare output.
    var normals = [];
    var elementsPerVertex = Math.floor(stride / 3);
    var componentIndex = 0;
    
    // We need to be able to average the normals at each point...
    var coordinateToNormalMap = {};
    
    // Ensure we stop computation of normals before an error
    //involving array indicies occurs.
    for (var i = offset; i < verticies.length; i += stride)
    {
        for (componentIndex = 0; componentIndex < stride; componentIndex += elementsPerVertex)
        {
            normals.push(getNormal(i, componentIndex + i));
        }
    }
    
    // If tolerance is not one,
    if (tolerance !== 1.0)
    {
        var unaveragedNormals = normals;
        var averagedNormals = [];
        
        // Average normals, if necessary.
        for (var i = 0; i < unaveragedNormals.length; i++)
        {
            averagedNormals.push
            (
                getAveragedNormal
                (
                    getPoint(i * elementsPerVertex), 
                    unaveragedNormals[i]
                )
            );
        }
        
        normals = averagedNormals;
    }
    
    return normals;
};

/*
    Convert an array of Vector3 objects into a
    Float32Array with three elements per vector.
*/
ModelHelper.vectorArrayToFloat32Array = function(vectorArray)
{
    var result = [];
    
    for (var i = 0; i < vectorArray.length; i++)
    {
        result.push(vectorArray[i].x);
        result.push(vectorArray[i].y);
        result.push(vectorArray[i].z);
    }
    
    return new Float32Array(result);
};

/*
    Connect a set of points, forming verticies.
    Given points must be grouped as an array of columns
    (or rows, depending on the viewpoint) that form
    the object.
*/
ModelHelper.connectVerticies = function(verticies)
{
    var result = [];
    
    // Fix a point's location on the result.
    //Appends point to result.
    var fixPoint = function(point)
    {
        result.push(point.x);
        result.push(point.y);
        result.push(point.z);
    };
    
    var connectQuad = function(point1, point2, point3, point4)
    {
        fixPoint(point1);
        fixPoint(point3);
        fixPoint(point2);
        
        fixPoint(point2);
        fixPoint(point3);
        fixPoint(point4);
    };
    
    var previousRowIndex = verticies.length - 1;
    var j;
    
    var currentRow, previousRow;
    
    // For every row of verticies,
    for (let i = 0; i < verticies.length; i++)
    {
        currentRow = verticies[i];
        previousRow = verticies[previousRowIndex];
        
        // Connect the two rows.
        for (j = 0; j < currentRow.length - 1; j ++)
        {
            connectQuad(previousRow[j], previousRow[j + 1], currentRow[j], currentRow[j + 1]);
        }
        
        previousRowIndex = i;
    }
    
    return result;
};

/*
    Create a solid of revolution with plane-points given by silhouettePoints.
    Returns a contiguous array of floats, 3 elements per vertex.
*/
ModelHelper.silhouetteToVerticies = function(silhouettePoints, startAngle, endAngle, divisions)
{
    // Default values.
    divisions = divisions || 8;
    
    // The rotation matrix.
    var rotationMatrix = new Mat44();
    rotationMatrix.toIdentity();
    rotationMatrix.rotateY(startAngle);
    
    //console.log(rotationMatrix.toString());
    
    var deltaTheta = (endAngle - startAngle) / divisions;
    //console.log("dtheta: " + deltaTheta);
    
    
    var verticies = [];
    var currentRow = [];
    
    var i, currentPoint;
    
    for (var theta = startAngle; theta <= endAngle; theta += deltaTheta)
    {
        currentRow = [];
        
        for (i = 0; i < silhouettePoints.length; i++)
        {
            // Make a copy of the point to prevent modification of the
            //silhouette itself.
            currentPoint = new Vector3(silhouettePoints[i].x || 0, silhouettePoints[i].y || 0, silhouettePoints[i].z || 0);
            
            currentPoint.transformBy(rotationMatrix);
            
            currentRow.push(currentPoint);
        }
        
        verticies.push(currentRow);
        
        rotationMatrix.rotateY(deltaTheta);
    }
    
    let connectedResult = ModelHelper.connectVerticies(verticies);
    
    return connectedResult;
};

/*
    Extrude a silhouette.
*/
ModelHelper.extrude = function(silhouette, extrudeDirection, noCap, capResolution)
{
    var partitions = []; // Not the best variable name...
    var subCaps = [];
    var part, j;
    
    var currentPosition;
    var averagePosition = { x: 0, y: 0, z: 0 };
    
    if (!noCap)
    {
        let leftmostExtreme = 0;
        
        subCaps.push([]);
    
        for (var i = 0; i < silhouette.length; i++)
        {
            averagePosition.x += silhouette[i].x || 0;
            averagePosition.y += silhouette[i].y || 0;
            averagePosition.z += silhouette[i].z || 0;
        }
        
        averagePosition.x /= silhouette.length;
        averagePosition.y /= silhouette.length;
        averagePosition.z /= silhouette.length;
        
        averagePosition = new Vector3(averagePosition.x, averagePosition.y, averagePosition.z);
        
        if (capResolution !== 0)
        {
            var centeredCurrent;
            for (i = 0; i < silhouette.length; i++)
            {
                centeredCurrent = new Vector3(silhouette[i].x || 0, silhouette[i].y || 0, silhouette[i].z || 0);
                centeredCurrent.subtractAndSet(averagePosition);
                
                if (centeredCurrent.x < leftmostExtreme || i === 0)
                {
                    leftmostExtreme = centeredCurrent.x;
                }
                
                subCaps[0].push(centeredCurrent);
            }
            
            var newSubCap = [];
            var wantedX;
            var totalDeltaX = -leftmostExtreme;
            var multiplier = 1;
            
            // For every resolution level,
            for (i = 1; i < capResolution && leftmostExtreme < 0; i++)
            {
                wantedX = totalDeltaX / capResolution * i;
                multiplier = Math.abs(wantedX / leftmostExtreme);
                
                newSubCap = [];
                
                // For every sub-point,
                for (j = 0; j < subCaps[i - 1].length; j++)
                {
                    newSubCap.push(subCaps[i - 1][j].multiplyScalar(multiplier));
                }
                
                subCaps.push(newSubCap);
                
                leftmostExtreme *= multiplier;
            }
        }
    }
    
    for (var i = 0; i < silhouette.length; i++)
    {
        currentPosition = new Vector3(silhouette[i].x || 0, silhouette[i].y || 0, silhouette[i].z || 0);
        
        part = [];
        
        if (!noCap && capResolution === 0)
        {
            part.push(averagePosition);
        }
        else if (!noCap)
        {
            for (j = 1; j < subCaps.length; j++)
            {
                part.push(averagePosition.add(subCaps[j][i]));
            }
            
            part.push(averagePosition);
        }
        
        part.push(currentPosition);
        part.push(currentPosition.add(extrudeDirection));
        
        if (!noCap && capResolution === 0)
        {
            part.push(averagePosition.add(extrudeDirection));
        }
        else if (!noCap)
        {
            for (j = 1; j < subCaps.length; j++)
            {
                part.push(averagePosition.add(extrudeDirection).add(subCaps[j][i]));
            }
            
            part.push(averagePosition.add(extrudeDirection));
        }
        
        partitions.push(part);
    }
    
    let result = ModelHelper.connectVerticies(partitions);
    
    return result;
};

/*
    Get suitable texture coordinates for a set of given
    verticies.
*/
ModelHelper.getTexCoords = (verticies, componentsPerVertex) =>
{
    let result = [];

    if (!componentsPerVertex)
    {
        // Attempt to infer the number of components per
        //vertex.

        if (verticies.length % 3 === 0)
        {
            componentsPerVertex = 3;
        }
        else if (verticies.length % 4 === 0)
        {
            componentsPerVertex = 4;
        }
        else
        {
            componentsPerVertex = 2;
        }
    }

    // Get the contents of a vertex
    //as a Vector3.
    const getVertex = (startIndex) =>
    {
        // Find the contents of each component.
        let x = verticies[startIndex],
            y = verticies[startIndex + 1],
            z = 0; // Default to the plane for which z = 0.
        
        // If a z-component could exist, find it.
        if (componentsPerVertex >= 3)
        {
            z = verticies[startIndex + 2];
        }

        // Return a vector with the found components.
        return new Vector3(x, y, z);
    };

    const handleTriangle = (startIndex) =>
    {
        // Determine the triangle's corners.
        const corners = 
        [
            getVertex(startIndex),
            getVertex(startIndex + componentsPerVertex),
            getVertex(startIndex + componentsPerVertex * 2)
        ];

        // Turn these vectors from the origin into 
        //vectors from the first vertex.
        corners[1] = corners[1].subtract(corners[0]);
        corners[2] = corners[2].subtract(corners[0]);
        corners[0] = new Vector3(0, 0, 0);

        // Ensure that the greatest of these vectors'
        //components are being used...
        // Note that the corners were copied through
        //subtraction above, so this should be safe.
        corners[1].y = Math.max(Math.abs(corners[1].z), Math.abs(corners[1].y));
        corners[2].y = Math.max(Math.abs(corners[2].z), Math.abs(corners[2].y));
        corners[1].x = Math.max(Math.abs(corners[1].z), Math.abs(corners[1].x));
        corners[2].x = Math.max(Math.abs(corners[2].z), Math.abs(corners[2].x));

        // Make normalization work correctly.
        corners[1].z = 0;
        corners[2].z = 0;

        // Normalize these vectors.
        corners[1].normalize();
        corners[2].normalize();

        let runNext = false;

        // Absolute value all components.
        for (let i = 1; i < corners.length; i++)
        {
            corners[i].x = Math.abs(corners[i].x);
            corners[i].y = Math.abs(corners[i].y);

            // Check for zero vectors.
            if (corners[i].x < 0.3 && corners[i].y < 0.3 || runNext)
            {
                corners[i].x = 1.0 * Math.floor(i / 2);
                corners[i].y = 1.0 * Math.floor(2 / i);

                runNext = true;
            }
        }

        if (corners[1].x === corners[2].x)
        {
            corners[1].x = 1.0;
            corners[2].x = 0.5;
        }

        if (corners[1].y === corners[2].y)
        {
            corners[1].y = 0.5;
            corners[2].y = 1.0;
        }

        // Store the length of the result,
        //before adding texture-coordinates.
        const oldLength = result.length;

        // Add these segments to the result.
        result.push(0.0);//corners[0].x);
        result.push(0.0);//corners[0].y);
        result.push(corners[1].x);
        result.push(corners[1].y);
        result.push(corners[2].x);
        result.push(corners[2].y);

        // Make sure the values just added are positive.
        for (let i = result.length - 1; i > oldLength; i--)
        {
            result[i] = Math.abs(result[i]);
        }
    };

    // For now, assume we are working with triangles.
    for (let i = 0; i < verticies.length; i += componentsPerVertex * 3)
    {
        handleTriangle(i);
    }

    return result;
};

// Pre-created objects.
ModelHelper.Objects = {};

/**
 *    Registers an object from an STL ASCII file.
 * Format Ref: https://en.wikipedia.org/wiki/STL_(file_format)
 * 
 */
ModelHelper.Objects.registerFromSTL = function(key, stlText)
{
    // Check for a valid header.
    if (stlText.indexOf("solid ") !== 0)
    {
        throw "Invalid STL header.";
    }
    
    let verticies = [];
    let normals = [];
    
    let recomputeNormals = false;
    
    // Tokenizes a line.
    let tokenize = (lineContent) =>
    {
        let result = [];
        let parts = lineContent.split(" ");
        
        for (let i = 0; i < parts.length; i++)
        {
            if (parts[i].length > 0)
            {
                result.push(parts[i]);
            }
        }
        
        return result;
    };
    
    // Get a vector from an array of strings.
    //Note: All elements should be parsable floats.
    //If not, an error may occur (from parseFloat).
    //Note that the vector is assumed to have three
    //components.
    let getVector = (fromArray, startIndex) =>
    {
        let xComponent = fromArray[startIndex],
            yComponent = fromArray[startIndex + 1],
            zComponent = fromArray[startIndex + 2];
            
        let result = new Vector3(parseFloat(xComponent),
                                 parseFloat(yComponent),
                                 parseFloat(zComponent));
        
        return result;
    };
    
    let state = {};
    state.inSolid = true;
    state.inFacet = false;
    state.inFacetLoop = false;
    state.specifiedNormal = undefined;
    
    let parseLine = (lineContent, lineNumber) =>
    {
        const segments = tokenize(lineContent);
        
        if (segments.length === 0)
        {
            return;
        }
        
        let key = segments[0];
        
        if (key === "facet" && !state.inFacet)
        {
            state.inFacet = true;
            
            // Does the file specify a normal?
            if (segments.length > 4 && segments[1] === "normal")
            {
                // Get the normal.
                state.specifiedNormal = getVector(segments, 2);
            }
            else
            {
                // Otherwise, note that no
                //normal was specified.
                state.specifiedNormal = undefined;
            }
        }
        
        // Check for the beginning of a facet loop.
        if (key === "outer" && state.inFacet
                && segments.length > 1 && segments[1] == "loop")
        {
            state.inFacetLoop = true;
        }
        
        // Check for the end of a facet loop.
        if (key === "endloop")
        {
            state.inFacetLoop = false;
        }
        
        // Check for the end of a facet.
        if (key === "endfacet")
        {
            state.inFacet = false;
        }
        
        // If a vertex and in a facet loop,
        //AND we can get the next three tokens...
        if (key === "vertex" && state.inFacetLoop && segments.length > 3)
        {
            // Get the coordinates of the verticies.
            let vertex = getVector(segments, 1);
            
            verticies = verticies.concat(vertex.toArray());
            
            let newNormal = [];
            if (state.specifiedNormal)
            {
                newNormal = state.specifiedNormal.toArray();;
            }
            else
            {
                recomputeNormals = true;
            }
            
            normals = normals.concat(newNormal);
        }
    };
    
    // Parse every line.
    const lines = stlText.split("\n");
    
    for (let i = 0; i < lines.length; i++)
    {
        parseLine(lines[i], i);
    }
    
    // If recomputing normals, do so.
    if (recomputeNormals)
    {
        normals = ModelHelper.computeNormals(verticies, 0.2); // 0.2 is the tolerance for normal-
                                                              //averaging.
    }
    
    return ModelHelper.Objects.register(key, verticies, normals);
};

/**
 *     Notes the existence of a pre-generated object. For example,
 * a cube. It creates an accessible model, stored in ModelHelper.Objects.
 * If the object already exists, nothing is done.
 */
ModelHelper.Objects.register = function(key, verticies, normals, texCoords, normalTolerance,
                                        vertexColors)
{
    // Do nothing if the object already exists.
    if (ModelHelper.Objects[key])
    {
        return;
    }
    
    let newObject = {};

    newObject.privateInfo = { verticies: verticies, normals: normals, texCoords: texCoords,
                              normalTolerance: normalTolerance, vertexColors: vertexColors };

    newObject.getVerticies = () =>
    {
        return newObject.privateInfo.verticies;
    };

    newObject.getNormals = () =>
    {
        if (!normals)
        {
            newObject.privateInfo.normals = ModelHelper.computeNormals(verticies, newObject.privateInfo.normalTolerance || 0.4);
        }

        return newObject.privateInfo.normals;
    };

    newObject.getTexCoords = () =>
    {
        if (!texCoords)
        {
            newObject.privateInfo.texCoords = ModelHelper.getTexCoords(verticies, 3);
        }

        return newObject.privateInfo.texCoords;
    };
    
    newObject.getVertexColors = () =>
    {
        if (!vertexColors)
        {
            newObject.privateInfo.vertexColors = // Generate random colors.
                     JSHelper.getArrayOfRandomColors(verticies.length,
                         false, // No rounding
                         3, // Three values/color.
                         0.5, 0.6, // Min red, max red.
                         0.5, 0.6, // Minimum green, maximum green.
                         0.5, 0.6); // Min blue, max blue.
        }
        
        return newObject.privateInfo.vertexColors;
    };
    
    // A wrapper around getVerticies, getNormals, and
    //getTexCoords. Returns a single JS object
    //containing these data. Danger: May cause
    //data to autocalculate.
    newObject.getData = () =>
    {
        let result = {};
        
        result.verticies = newObject.getVerticies();
        result.texCoords = newObject.getTexCoords();
        result.normals = newObject.getNormals();
        result.vertexColors = newObject.getVertexColors();
        
        return result;
    };

    ModelHelper.Objects[key] = newObject;
};

/**
 * Get an object. ObjectKeys should be a list
 * of potential objects in order of preference.
 * If the first is not available, the second
 * will be returned.
 */
ModelHelper.Objects.get = function(...objectKeys)
{
    for (let i = 0; i < objectKeys.length; i++)
    {
        if (objectKeys[i] in ModelHelper.Objects)
        {
            return ModelHelper.Objects[objectKeys[i]];
        }
    }

    // Return a cube if no such object
    //was registered.
    return ModelHelper.Objects.Cube;
};

/**
 * Delete an object, if it exists.
 */
ModelHelper.Objects.remove = function(objectKey)
{
    if (objectKey in ModelHelper.Objects)
    {
        delete ModelHelper.Objects[objectKey];
    }
};

// Register a cube. Note that all other
//objects should be registered in a different file.
//This cube allows potential functions to work
//without extra includes (e.g. allowing
//ModelHelper.Objects.get to default to 
//a cube).
ModelHelper.Objects.register("Cube", 
[
    // Face 1
    50, 50, 0,
    50, 0, 0,
    0, 0, 0,
    
    50, 50, 0,
    0, 0, 0,
    0, 50, 0,
    
    // Face 2
    50, 0, 50,
    50, 50, 50,
    0, 50, 50,
    
    50, 0, 50,
    0, 50, 50,
    0, 0, 50,
    
    // Face 3
    0, 50, 0,
    0, 0, 0,
    0, 0, 50,
            
    0, 50, 0,
    0, 0, 50,
    0, 50, 50,
    
    // Face 4
    50, 0, 0,
    50, 50, 0,
    50, 50, 50,
    
    50, 0, 0,
    50, 50, 50,
    50, 0, 50,
    
    // Face 5
    50, 50, 50,
    50, 50, 0,
    0, 50, 0,
    
    50, 50, 50,
    0, 50, 0,
    0, 50, 50,
    
    // Face 6
    50, 0, 50,
    0, 0, 50,
    0, 0, 0,
    
    50, 0, 50,
    0, 0, 0, 
    50, 0, 0
], undefined,
(
    // Get a cube's normals!
    //Note: Copied from Objects.js
    //in the older version of this WebGL 
    //support library.
    function (verticiesCount)
    {
        var locations = [];
        var points = [];
        var j;
        
        var face = 0;

        for(var i = 0; i < verticiesCount / 2; i++)
        {
            face = i;
            
            points = 
            [
                [0, 0],
                [0, 1],
                [1, 1],
                [0, 0],
                [1, 1],
                [1, 0]
            ];
            
            for(j = 0; j < points.length; j++)
            {
                if(face === 0 || face === 2)
                {
                    locations.push(1 - points[j][0]);
                    locations.push(1 - points[j][1]);
                }
                else
                {
                    locations.push(points[j][0]);
                    locations.push(points[j][1]);
                }
            }
        }
        
        return locations;
    }
)(36));
