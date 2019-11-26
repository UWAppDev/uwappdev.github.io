"use strict";

function SimpleGame(options)
{
    const me = this;
    
    options = options || {};
    
    let canvas = document.createElement("canvas");
    let textureCanvas = document.createElement("canvas");
    let shouldStop = false;
    
    if (!options.parentElement)
    {
        me.subWindow = SubWindowHelper.create({ title: "Simple Game", minWidth: 200, minHeight: 200 });
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
    
    me.renderer = new Renderer();
    
    me.renderer.setFogColor(new Vector3(1.0, 1.0, 1.0));
    me.renderer.setZMax(2000);
    
    let cubeObject = me.renderer.registerObject();
    cubeObject.bufferData("a_normal", ModelHelper.Objects.Cube.getNormals());
    cubeObject.bufferData("a_position", ModelHelper.Objects.Cube.getVerticies());
    cubeObject.bufferData("a_texCoord", ModelHelper.Objects.Cube.getTexCoords());
    cubeObject.bufferData("a_color", JSHelper.getArrayOfRandomColors(
        ModelHelper.Objects.Cube.getVerticies().length,
        false, 3, 0.5, 0.6, 0.8, 0.9, 0.4, 0.5));
    
    let lastTime = (new Date()).getTime();
    
    let world = WorldHelper.createBasicWorld(me.renderer);
    
    let render = () =>
    {
        me.renderer.updateViewIfNeeded(canvas.clientWidth, canvas.clientHeight, false);
        
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight)
        {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }
        
        me.renderer.clear();
        me.renderer.updateCamera();
        
        world.render();
        
        me.renderer.display(ctx);
    };
    
    let animate = () =>
    {
        let nowTime = (new Date()).getTime();
        
        world.tick(nowTime - lastTime);
        
        lastTime = nowTime;
    };
    
    this.mainloop = () =>
    {
        if (!shouldStop)
        {
            render();
            
            requestAnimationFrame(() =>
            {
                me.mainloop.apply(me);
            });
        }
    };
    
    this.stop = () =>
    {
        shouldStop = true;
    };
}
