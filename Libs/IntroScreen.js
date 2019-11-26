"use strict";

function IntroScreen(options)
{
    var me = this;

    options = options || { };

    // TODO: Fill normals, verticies, and colors, if
    //not provided in options.

    let canvas = document.createElement("canvas");
    let textureCanvas = document.createElement("canvas");

    if (!options.parentElement)
    {
        me.subWindow = SubWindowHelper.create({ title: "An Intro Screen", minWidth: 200, minHeight: 200 });
        me.subWindow.appendChild(canvas);

        me.subWindow.setOnCloseListener(() =>
        {
            me.stop();
        });
        
        me.subWindow.enableFlex();
    }
    else
    {
        options.parentElement.appendChild(canvas);
    }

    canvas.style.width = "calc(100% - 2px)";
    canvas.style.height = "auto";
    textureCanvas.width = 400;
    textureCanvas.height = 400;

    let ctx = canvas.getContext("2d");
    let textureCtx = textureCanvas.getContext("2d");

    this.renderer = new Renderer();

    this.renderer.setFogColor(new Vector3(1.0, 1.0, 1.0));
    this.renderer.setZMax(2000);

    let backgroundObject = this.renderer.registerObject();
    backgroundObject.bufferData("a_normal", options.normals);
    backgroundObject.bufferData("a_position", options.verticies);
    backgroundObject.bufferData("a_color", options.vertexColors);
    backgroundObject.bufferData("a_texCoord", options.texCoords);

    let startButton = this.renderer.registerObject();
    startButton.bufferData("a_normal", ModelHelper.Objects.Cube.getNormals());
    startButton.bufferData("a_position", ModelHelper.Objects.Cube.getVerticies());
    startButton.bufferData("a_texCoord", ModelHelper.Objects.Cube.getTexCoords());
    startButton.bufferData("a_color", JSHelper.getArrayOfRandomColors(
        ModelHelper.Objects.Cube.getVerticies().length,
        false, 3, 0.0, 0.1, 0.0, 0.2, 0.2, 0.3));

    let startButtonZ = 0;

    JSHelper.Events.registerPointerEvent("move", canvas, function(e)
    {
        var bbox = canvas.getBoundingClientRect();

        me.renderer.setMousePosition(new Point(e.clientX - bbox.left, (canvas.clientHeight - (e.clientY - bbox.top))));
    });

    canvas.addEventListener("click", function(e)
    {
        var mouseAttributes = me.renderer.getMouseAttributes();

        if (mouseAttributes.selectedObject === startButton)
        {
            startButtonZ -= 100;
        }
    });

    let rotateY = 0, rotateX = 0, crunch = 1, buttonWobble = 0, fogDecay = 10000;

    // Draw textures onto the texture canvas. Currently a test texture. This will change.
    var renderTextures = () =>
    {
        textureCtx.clearRect(0, 0, textureCanvas.width, textureCanvas.height);

        textureCtx.fillStyle = "orange";
        textureCtx.fillRect(0, 0, textureCtx.canvas.width, textureCtx.canvas.height);


        textureCtx.fillStyle = "white";

        let y, count;
        const dx = 20,
              dy = 20;

        count = 0;

        for (let x = 0; x < textureCanvas.width; x += dx)
        {
            for (y = (count % 2) * dy; y < textureCanvas.height; y += dy * 2)
            {
                textureCtx.fillRect(x, y, dx, dy);
            }

            count++;
        }

        textureCtx.fillStyle = "red";

        textureCtx.font = "40pt serif";
        textureCtx.textBaseline = "top";
        textureCtx.fillText("Click to Start...", 0, 30);

    };

    renderTextures();

    this.render = () =>
    {
        // Resize the WebGL context, if needed.
        me.renderer.updateViewIfNeeded(canvas.clientWidth, canvas.clientHeight, false);

        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight)
        {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }

        // Clear the context.
        me.renderer.clear();
        
        me.renderer.updateCamera();

        me.renderer.setFogDecay(fogDecay);

        startButton.bindBuffers(); // Draw the start button first.

        me.renderer.worldMatrix.save();
        me.renderer.worldMatrix.translate([0, 0, startButtonZ]);
        me.renderer.worldMatrix.rotateY(buttonWobble);
        me.renderer.worldMatrix.rotateX(buttonWobble * buttonWobble / 2.0);

        me.renderer.worldMatrix.scale(4, 1, 1);
        me.renderer.worldMatrix.translate([-25, 0, 0]);

        me.renderer.updateWorldMatrix();

        me.renderer.setTexture(textureCanvas);

        // Draw it.
        me.renderer.render(startButton);

        me.renderer.worldMatrix.restore();

        // Note that the main object is to be drawn.
        backgroundObject.bindBuffers();

        me.renderer.worldMatrix.save();

        me.renderer.worldMatrix.translate([0, 0, -800]);

        me.renderer.worldMatrix.rotateY(rotateY);

        me.renderer.setTexture(textureCanvas);

        for (var i = 0; i < 50; i++)
        {
            me.renderer.worldMatrix.save();
            me.renderer.worldMatrix.translate([Math.sin(i * 4) * 300, Math.cos(i) * 300 * crunch, Math.cos(i * 2) * 400]);

            me.renderer.worldMatrix.rotateX(rotateX * (i + 1));

            me.renderer.worldMatrix.translate([0, Math.min(Math.max(Math.tan(i) * (i + 1), -200), 200), 0]);

            me.renderer.updateWorldMatrix();
            me.renderer.worldMatrix.restore();

            // Draw it.
            me.renderer.render(backgroundObject);
        }

        me.renderer.worldMatrix.restore();

        // Copy the contents of the background canvas to the
        //display.
        me.renderer.display(ctx);
    };

    var lastTime = undefined;
    this.animate = () => 
    {
        if (!lastTime)
        {
            lastTime = (new Date()).getTime();
        }

        let nowTime = (new Date()).getTime();
        let deltaTime = nowTime - lastTime;

        rotateY += deltaTime / 1000;
        rotateX += deltaTime / 8000;
        crunch = Math.abs(Math.sin(nowTime / 500) + Math.random() / 8) * 2;
        buttonWobble = Math.sin(nowTime / 1000) * 0.4;
        fogDecay = (Math.sin(nowTime / 5000) + 1.01) * 10000;

        lastTime = nowTime;
    };

    let shouldStop = false;

    this.mainloop = () =>
    {
        if (!shouldStop)
        {
            me.render();
            me.animate();

            requestAnimationFrame(() =>
            {
                me.mainloop.apply(me);
            });
        }
    };

    this.stop = () =>
    {
        shouldStop = true;

        if (me.subWindow)
        {
            me.subWindow.close();
        }
    };
}

const IntroScreenHelper = 
{
    test: () =>
    {
        const modeler = new Modeler3D(undefined, (verticies, normals) =>
        {
            var options = {};

            options.verticies = verticies;
            options.normals = normals; // 0.3 is the tolerance for the normals.
            options.vertexColors = JSHelper.getArrayOfRandomColors(
                verticies.length,
                false,
                3,
                0.3, 0.9,
                0.1, 0.7,
                0.1, 0.7);

            options.texCoords = ModelHelper.getTexCoords(verticies);

            (new IntroScreen(options)).mainloop();
        });
    }
};
