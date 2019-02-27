//   This program is free software: you can redistribute it and/or modify
//   it under the terms of the GNU General Public License as published by
//   the Free Software Foundation, either version 3 of the License, or
//   (at your option) any later version.
//   This program is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU General Public License for more details.
//   You should have received a copy of the GNU General Public License
//   along with this program.  If not, see <http://www.gnu.org/licenses/>
//
//
// @author : pascal.fautrero@ac-versailles.fr


/*
 *
 * @param {type} imageObj
 * @param {type} detail
 * @param {type} layer
 * @param {type} idText
 * @param {type} baseImage
 * @param {type} iaScene
 * @param {type} backgroundCache_layer
 * @constructor create image active object
 */
function IaObject(params) {
    "use strict";
    var that = this;
    this.path = [];
    this.title = [];
    this.kineticElement = [];
    this.backgroundImage = [];
    this.backgroundImageOwnScaleX = [];
    this.backgroundImageOwnScaleY = [];
    this.persistent = [];
    this.originalX = [];
    this.originalY = [];
    this.options = [];
    this.stroke = [];
    this.strokeWidth = [];
    this.tween = [];
    this.agrandissement = 0;
    this.zoomActive = 0;
    this.minX = 10000;
    this.minY = 10000;
    this.maxX = -10000;
    this.maxY = -10000;
    this.tween_group = 0;
    this.group = 0;

    this.layer = params.layer;
    this.background_layer = params.background_layer;
    this.backgroundCache_layer = params.backgroundCache_layer;
    that.backgroundCache_layer.hide()
    that.backgroundCache_layer.draw()
    this.imageObj = params.imageObj;
    this.idText = params.idText;
    this.myhooks = params.myhooks;
    this.zoomLayer = params.zoomLayer;

    // Create kineticElements and include them in a group

    that.group = new Kinetic.Group();
    that.layer.add(that.group);

    if (typeof(params.detail.path) !== 'undefined') {
        that.includePath(params.detail, 0, that, params.iaScene, params.baseImage, params.idText);
    }
    else if (typeof(params.detail.image) !== 'undefined') {
        var re = /sprite(.*)/i;
        if (params.detail.id.match(re)) {
            console.log('sprite detected')
            that.includeSprite(params.detail, 0, that, params.iaScene, params.baseImage, params.idText);
        }
        else {
            that.includeImage(params.detail, 0, that, params.iaScene, params.baseImage, params.idText);
        }

    }
    else if (typeof(params.detail.group) !== 'undefined') {

        for (var i in params.detail.group) {
            if (typeof(params.detail.group[i].path) !== 'undefined') {
                that.includePath(params.detail.group[i], i, that, params.iaScene, params.baseImage, params.idText);
            }
            else if (typeof(params.detail.group[i].image) !== 'undefined') {
                var re = /sprite(.*)/i;
                if (params.detail.group[i].id.match(re)) {
                    console.log('sprite detected')
                    that.includeSprite(params.detail.group[i], i, that, params.iaScene, params.baseImage, params.idText);
                }
                else {
                    that.includeImage(params.detail.group[i], i, that, params.iaScene, params.baseImage, params.idText);
                }

            }
        }
        that.definePathBoxSize(params.detail, that);

    }
    else {
        console.log(params.detail);
    }


    this.defineTweens(this, params.iaScene);
    this.myhooks.afterIaObjectConstructor(params.iaScene, params.idText, params.detail, this);
}


/*
 *
 * @param {type} detail
 * @param {type} i KineticElement index
 * @returns {undefined}
 */
IaObject.prototype.includeSprite = function(detail, i, that, iaScene, baseImage, idText) {
    that.defineImageBoxSize(detail, that);
    var rasterObj = new Image();

    that.title[i] = detail.title;
    that.backgroundImage[i] = rasterObj;
    var timeLine = JSON.parse("[" + detail.timeline + "]")

    var idle = []
    for(k=0;k<timeLine.length;k++) {
        idle.push(timeLine[k] * detail.width, 0, detail.width, detail.height)
    }
    that.kineticElement[i] = new Kinetic.Sprite({
      x: parseFloat(detail.x) * iaScene.coeff,
      y: parseFloat(detail.y) * iaScene.coeff + iaScene.y,
      image: rasterObj,
      animation: 'idle',
      animations: {
        idle: idle,
        hidden : [timeLine.length * detail.width, 0, detail.width, detail.height]
      },
      frameRate: 10,
      frameIndex: 0,
      scale: {x:iaScene.coeff,y:iaScene.coeff}
    });

    rasterObj.onload = function() {

        that.group.add(that.kineticElement[i]);
        zoomable = false
        if ((typeof(detail.options) !== 'undefined')) {
            that.options[i] = detail.options;
        }
        that.persistent[i] = "hiddenSprite";
        that.kineticElement[i].animation('hidden')
        that.kineticElement[i].start();
        if ((typeof(detail.fill) !== 'undefined') &&
            (detail.fill == "#ffffff")) {
            that.persistent[i] = "persistentSprite";
            that.kineticElement[i].animation('idle')
         }
        that.addEventsManagement(i,zoomable, that, iaScene, baseImage, idText);


    };
    rasterObj.src = detail.image;

};

/*
 *
 * @param {type} detail
 * @param {type} i KineticElement index
 * @returns {undefined}
 */
IaObject.prototype.includeImage = function(detail, i, that, iaScene, baseImage, idText) {
    that.defineImageBoxSize(detail, that);
    var rasterObj = new Image();
    rasterObj.src = detail.image;
    that.title[i] = detail.title;
    that.backgroundImage[i] = rasterObj;
    that.kineticElement[i] = new Kinetic.Image({
        name: detail.title,
        x: parseFloat(detail.x) * iaScene.coeff,
        y: parseFloat(detail.y) * iaScene.coeff + iaScene.y,
        width: detail.width,
        height: detail.height,
        scale: {x:iaScene.coeff,y:iaScene.coeff}
    });

    rasterObj.onload = function() {
        that.backgroundImageOwnScaleX[i] = iaScene.scale * detail.width / this.width;
        that.backgroundImageOwnScaleY[i] = iaScene.scale * detail.height / this.height;
        var zoomable = true;
        if ((typeof(detail.fill) !== 'undefined') &&
            (detail.fill === "#000000")) {
            zoomable = false;
        }
        if ((typeof(detail.options) !== 'undefined')) {
            that.options[i] = detail.options;
        }
        if ((typeof(detail.stroke) !== 'undefined') && (detail.stroke != 'none')) {
            that.stroke[i] = detail.stroke;
        }
        else {
            that.stroke[i] = 'rgba(0, 0, 0, 0)';
        }
        if ((typeof(detail.strokewidth) !== 'undefined')) {
            that.strokeWidth[i] = detail.strokewidth;
        }
        else {
            that.strokeWidth[i] = '0';
        }
        that.persistent[i] = "off-image";
        if ((typeof(detail.fill) !== 'undefined') &&
            (detail.fill === "#ffffff")) {
            that.persistent[i] = "onImage";
            that.kineticElement[i].fillPriority('pattern');
            that.kineticElement[i].fillPatternScaleX(that.backgroundImageOwnScaleX[i] * 1/iaScene.scale);
            that.kineticElement[i].fillPatternScaleY(that.backgroundImageOwnScaleY[i] * 1/iaScene.scale);
            that.kineticElement[i].fillPatternImage(that.backgroundImage[i]);
            zoomable = false;
        }

        that.group.add(that.kineticElement[i]);
        that.addEventsManagement(i,zoomable, that, iaScene, baseImage, idText);

        // define hit area excluding transparent pixels
        // =============================================================

        var cropX = Math.max(parseFloat(detail.minX), 0);
        var cropY = Math.max(parseFloat(detail.minY), 0);
        var cropWidth = (Math.min(parseFloat(detail.maxX) - parseFloat(detail.minX), Math.floor(parseFloat(iaScene.originalWidth) * 1)));
        var cropHeight = (Math.min(parseFloat(detail.maxY) - parseFloat(detail.minY), Math.floor(parseFloat(iaScene.originalHeight) * 1)));
        if (cropX + cropWidth > iaScene.originalWidth * 1) {
            cropWidth = iaScene.originalWidth * 1 - cropX * 1;
        }
        if (cropY * 1 + cropHeight > iaScene.originalHeight * 1) {
            cropHeight = iaScene.originalHeight * 1 - cropY * 1;
        }

	var hitCanvas = that.layer.getHitCanvas();
        iaScene.completeImage = hitCanvas.getContext().getImageData(0,0,Math.floor(hitCanvas.width),Math.floor(hitCanvas.height));

        var canvas_source = document.createElement('canvas');
        canvas_source.setAttribute('width', cropWidth * iaScene.coeff);
        canvas_source.setAttribute('height', cropHeight * iaScene.coeff);
        var context_source = canvas_source.getContext('2d');
        context_source.drawImage(rasterObj,0,0, cropWidth * iaScene.coeff, cropHeight * iaScene.coeff);
        imageDataSource = context_source.getImageData(0, 0, cropWidth * iaScene.coeff, cropHeight * iaScene.coeff);
        len = imageDataSource.data.length;
        that.group.zoomActive = 0;

        (function(len, imageDataSource){
        that.kineticElement[i].hitFunc(function(context) {
            if (iaScene.zoomActive == 0) {
               /* rgbColorKey = Kinetic.Util._hexToRgb(this.colorKey);
                //detach from the DOM
                var imageData = imageDataSource.data;
                // just replace scene colors by hit colors - alpha remains unchanged
                for(j = 0; j < len; j += 4) {
                   imageData[j + 0] = rgbColorKey.r;
                   imageData[j + 1] = rgbColorKey.g;
                   imageData[j + 2] = rgbColorKey.b;
                   // imageData[j + 3] = imageDataSource.data[j + 3];
                }
                // reatach to the DOM
                imageDataSource.data = imageData;

                context.putImageData(imageDataSource, cropX * iaScene.coeff, cropY * iaScene.coeff);     */
                var imageData = imageDataSource.data;
                var imageDest = iaScene.completeImage.data;
                var position1 = 0;
                var position2 = 0;
                var maxWidth = Math.floor(cropWidth * iaScene.coeff);
                var maxHeight = Math.floor(cropHeight * iaScene.coeff);
                var startY = Math.floor(cropY * iaScene.coeff);
                var startX = Math.floor(cropX * iaScene.coeff);
                var hitCanvasWidth = Math.floor(that.layer.getHitCanvas().width);
                var rgbColorKey = Kinetic.Util._hexToRgb(this.colorKey);
                for(var varx = 0; varx < maxWidth; varx +=1) {
                    for(var vary = 0; vary < maxHeight; vary +=1) {
                        position1 = 4 * (vary * maxWidth + varx);
                        position2 = 4 * ((vary + startY) * hitCanvasWidth + varx + startX);
                        if (imageData[position1 + 3] > 100) {
                           imageDest[position2 + 0] = rgbColorKey.r;
                           imageDest[position2 + 1] = rgbColorKey.g;
                           imageDest[position2 + 2] = rgbColorKey.b;
                           imageDest[position2 + 3] = 255;
                        }
                    }
                }
                context.putImageData(iaScene.completeImage, 0, 0);
            }
            else {
                context.beginPath();
                context.rect(0,0,this.width(),this.height());
                context.closePath();
                context.fillStrokeShape(this);
            }
        });
        })(len, imageDataSource);
        /*that.kineticElement[i].sceneFunc(function(context) {
            var yo = that.layer.getHitCanvas().getContext().getImageData(0,0,iaScene.width, iaScene.height);
            context.putImageData(yo, 0,0);
        });*/

        // =============================================================
        that.group.draw();
    };

};


/*
 *
 * @param {type} path
 * @param {type} i KineticElement index
 * @returns {undefined}
 */
IaObject.prototype.includePath = function(detail, i, that, iaScene, baseImage, idText) {
    that.path[i] = detail.path;
    that.title[i] = detail.title;
    // if detail is out of background, hack maxX and maxY
    if ((parseFloat(detail.maxX) < 0) || (parseFloat(detail.maxY) < 0)) return
    that.kineticElement[i] = new Kinetic.Path({
        name: detail.title,
        data: detail.path,
        x: parseFloat(detail.x) * iaScene.coeff,
        y: parseFloat(detail.y) * iaScene.coeff + iaScene.y,
        scale: {x:iaScene.coeff,y:iaScene.coeff},
        fill: 'rgba(0, 0, 0, 0)'
    });
    that.definePathBoxSize(detail, that);
    // crop background image to suit shape box

    var cropperCanvas = document.createElement('canvas')
    cropperCanvas.setAttribute('width', (parseFloat(detail.maxX) - parseFloat(detail.minX)) * iaScene.coeff)
    cropperCanvas.setAttribute('height', (parseFloat(detail.maxY) - parseFloat(detail.minY)) * iaScene.coeff)

    source = {
     'x' : Math.max(parseFloat(detail.minX), 0) * iaScene.originalRatio,
     'y' : Math.max(parseFloat(detail.minY), 0) * iaScene.originalRatio,
     'width' : (parseFloat(detail.maxX) - Math.max(parseFloat(detail.minX), 0)) * iaScene.originalRatio,
     'height' : (parseFloat(detail.maxY) - Math.max(parseFloat(detail.minY), 0)) * iaScene.originalRatio
    }
    target = {
     'x' : Math.max(detail.minX * (-1), 0),
     'y' : Math.max(detail.minY * (-1), 0),
     'width' : (parseFloat(detail.maxX) - Math.max(parseFloat(detail.minX), 0)) * iaScene.coeff,
     'height' : (parseFloat(detail.maxY) - Math.max(parseFloat(detail.minY), 0)) * iaScene.coeff
    }
    cropperCanvas.getContext('2d').drawImage(
        that.imageObj,
        source.x,
        source.y,
        source.width,
        source.height,
        target.x,
        target.y,
        target.width,
        target.height
    )
    var cropedImage = new Image()
    cropedImage.src = cropperCanvas.toDataURL()
    cropedImage.onload = function() {
        that.backgroundImage[i] = cropedImage
        that.backgroundImageOwnScaleX[i] = 1 / iaScene.coeff
        that.backgroundImageOwnScaleY[i] = 1 / iaScene.coeff
        that.kineticElement[i].fillPatternRepeat('no-repeat')
        that.kineticElement[i].fillPatternX(detail.minX)
        that.kineticElement[i].fillPatternY(detail.minY)
    }

    var zoomable = true;
    if ((typeof(detail.fill) !== 'undefined') &&
        (detail.fill === "#000000")) {
        zoomable = false;
    }
    if ((typeof(detail.options) !== 'undefined')) {
        that.options[i] = detail.options;
    }
    if ((typeof(detail.stroke) !== 'undefined') && (detail.stroke != 'none')) {
        that.stroke[i] = detail.stroke;
    }
    else {
        that.stroke[i] = 'rgba(0, 0, 0, 0)';
    }
    if ((typeof(detail.strokewidth) !== 'undefined')) {
        that.strokeWidth[i] = detail.strokewidth;
    }
    else {
        that.strokeWidth[i] = '0';
    }
    that.persistent[i] = "off";
    if ((typeof(detail.fill) !== 'undefined') &&
        (detail.fill === "#ffffff")) {
        that.persistent[i] = "onPath";
        that.kineticElement[i].fill('rgba(' + iaScene.colorPersistent.red + ',' + iaScene.colorPersistent.green + ',' + iaScene.colorPersistent.blue + ',' + iaScene.colorPersistent.opacity + ')');
    }
    that.addEventsManagement(i, zoomable, that, iaScene, baseImage, idText);

    that.group.add(that.kineticElement[i]);
    that.group.draw();
};

/*
 *
 * @param {type} index
 * @returns {undefined}
 */
IaObject.prototype.defineImageBoxSize = function(detail, that) {
    "use strict";

    if (that.minX === -1)
        that.minX = (parseFloat(detail.x));
    if (that.maxY === 10000)
        that.maxY = parseFloat(detail.y) + parseFloat(detail.height);
    if (that.maxX === -1)
        that.maxX = (parseFloat(detail.x) + parseFloat(detail.width));
    if (that.minY === 10000)
        that.minY = (parseFloat(detail.y));

    if (parseFloat(detail.x) < that.minX) that.minX = parseFloat(detail.x);
    if (parseFloat(detail.x) + parseFloat(detail.width) > that.maxX)
        that.maxX = parseFloat(detail.x) + parseFloat(detail.width);
    if (parseFloat(detail.y) < that.minY)
        that.miny = parseFloat(detail.y);
    if (parseFloat(detail.y) + parseFloat(detail.height) > that.maxY)
        that.maxY = parseFloat(detail.y) + parseFloat(detail.height);
};


/*
 *
 * @param {type} index
 * @returns {undefined}
 */
IaObject.prototype.definePathBoxSize = function(detail, that) {
    "use strict";
    if (  (typeof(detail.minX) !== 'undefined') &&
          (typeof(detail.minY) !== 'undefined') &&
          (typeof(detail.maxX) !== 'undefined') &&
          (typeof(detail.maxY) !== 'undefined')) {
        that.minX = detail.minX;
        that.minY = detail.minY;
        that.maxX = detail.maxX;
        that.maxY = detail.maxY;
    }
    else {
        console.log('definePathBoxSize failure');
    }
};



/*
 * Define zoom rate and define tween effect for each group
 * @returns {undefined}
 */
IaObject.prototype.defineTweens = function(that, iaScene) {

    that.minX = that.minX * iaScene.coeff;
    that.minY = that.minY * iaScene.coeff;
    that.maxX = that.maxX * iaScene.coeff;
    that.maxY = that.maxY * iaScene.coeff;

    var largeur = that.maxX - that.minX;
    var hauteur = that.maxY - that.minY;
    that.agrandissement1  = (iaScene.height - iaScene.y) / hauteur;   // beta
    that.agrandissement2  = iaScene.width / largeur;    // alpha

    if (hauteur * that.agrandissement2 > iaScene.height) {
        that.agrandissement = that.agrandissement1;
        that.tweenX = (0 - (that.minX)) * that.agrandissement + (iaScene.width - largeur * that.agrandissement) / 2;
        that.tweenY = (0 - iaScene.y - (that.minY)) * that.agrandissement + iaScene.y;
    }
    else {
        that.agrandissement = that.agrandissement2;
        that.tweenX = (0 - (that.minX)) * that.agrandissement;
        that.tweenY = 1 * ((0 - iaScene.y - (that.minY)) * that.agrandissement + iaScene.y + (iaScene.height - hauteur * that.agrandissement) / 2);
    }
};

/*
 * Define mouse events on the current KineticElement
 * @param {type} i KineticElement index
 * @returns {undefined}
 */

IaObject.prototype.addEventsManagement = function(i, zoomable, that, iaScene, baseImage, idText) {

    if (that.options[i].indexOf("disable-click") !== -1) return;
    /*
     * if mouse is over element, fill the element with semi-transparency
     */
    that.kineticElement[i].on('mouseover', function() {
        if (iaScene.cursorState.indexOf("ZoomOut.cur") !== -1) {

        }
        else if ((iaScene.cursorState.indexOf("ZoomIn.cur") !== -1) ||
           (iaScene.cursorState.indexOf("ZoomFocus.cur") !== -1)) {

        }
        else if (iaScene.cursorState.indexOf("HandPointer.cur") === -1) {
            //document.body.style.cursor = "url(img/HandPointer.cur),auto";
            document.body.style.cursor = "pointer";
            iaScene.cursorState = "url(img/HandPointer.cur),auto";
            for (var i in that.kineticElement) {
                if (that.persistent[i] == "off") {
                    that.kineticElement[i].fillPriority('color');
                    that.kineticElement[i].fill(iaScene.overColor);
                    that.kineticElement[i].scale(iaScene.coeff);
                    //that.kineticElement[i].stroke(iaScene.overColorStroke);
                    //that.kineticElement[i].strokeWidth(2);
                    that.kineticElement[i].stroke(that.stroke[i]);
                    that.kineticElement[i].strokeWidth(that.strokeWidth[i]);
                }
                else if (that.persistent[i] == "onPath") {
                    that.kineticElement[i].fillPriority('color');
                    that.kineticElement[i].fill('rgba(' + iaScene.colorPersistent.red + ',' + iaScene.colorPersistent.green + ',' + iaScene.colorPersistent.blue + ',' + iaScene.colorPersistent.opacity + ')');
                }
                else if ((that.persistent[i] == "onImage") || (that.persistent[i] == "off-image")) {
                    that.kineticElement[i].fillPriority('pattern');
                    that.kineticElement[i].fillPatternScaleX(that.backgroundImageOwnScaleX[i] * 1/iaScene.scale);
                    that.kineticElement[i].fillPatternScaleY(that.backgroundImageOwnScaleY[i] * 1/iaScene.scale);
                    that.kineticElement[i].fillPatternImage(that.backgroundImage[i]);
                }
                else if ((that.persistent[i] == "hiddenSprite") || (that.persistent[i] == "persistentSprite")) {
                    that.kineticElement[i].animation('idle')
                    that.kineticElement[i].frameIndex(0)
                }
            }
            that.layer.batchDraw();
            //this.draw();
        }
    });
    /*
     * if we click in this element, manage zoom-in, zoom-out
     */
    if (that.options[i].indexOf("direct-link") !== -1) {
        that.kineticElement[i].on('click touchstart', function(e) {
            location.href = that.title[i];
        });
    }
    else {
        that.kineticElement[i].on('click touchstart', function(evt) {
            var i = 0;
            iaScene.noPropagation = true;
            // let's zoom
            if ((iaScene.cursorState.indexOf("ZoomIn.cur") !== -1) &&
                (iaScene.element === that)) {

               iaScene.zoomActive = 1;
                //document.body.style.cursor = "url(img/ZoomOut.cur),auto";
                document.body.style.cursor = "zoom-out";
                iaScene.cursorState = "url(img/ZoomOut.cur),auto";
                this.moveToTop();
                that.group.moveToTop();
                that.layer.moveToTop();
                that.group.zoomActive = 1;
                that.originalX[0] = that.group.x();
                that.originalY[0] = that.group.y();

                that.alpha = 0;
                that.step = 0.1;
                var personalTween = function(anim, thislayer) {
                    // linear
                    var tempX = that.originalX[0] + that.alpha.toFixed(2) * (that.tweenX - that.originalX[0]);
                    var tempY = that.originalY[0] + that.alpha.toFixed(2) * (that.tweenY - that.originalY[0]);
                    var tempScale = 1 + that.alpha.toFixed(2) * (that.agrandissement - 1);
                    var t = null;
                    if (that.alpha.toFixed(2) <= 1) {
                        that.alpha = that.alpha + that.step;
                        that.group.setPosition({x:tempX, y:tempY});
                        that.group.scale({x:tempScale,y:tempScale});
                    }
                    else {
                        that.zoomLayer.hitGraphEnabled(true);
                        anim.stop();
                    }
                };
                that.zoomLayer.moveToTop();
                that.group.moveTo(that.zoomLayer);
                that.layer.draw();
                var anim = new Kinetic.Animation(function(frame) {
                    personalTween(this, that.layer);
                }, that.zoomLayer);
                that.zoomLayer.hitGraphEnabled(false);
                anim.start();

                that.myhooks.afterIaObjectZoom(iaScene, idText, that);
            }
            // let's unzoom
            else if (iaScene.cursorState.indexOf("ZoomOut.cur") != -1) {

                if ((that.group.zoomActive == 1)) {
                    iaScene.zoomActive = 0;
                    that.group.zoomActive = 0;
                    that.group.scaleX(1);
                    that.group.scaleY(1);
                    that.group.x(that.originalX[0]);
                    that.group.y(that.originalY[0]);

                    $('#' + that.idText + " audio").each(function(){
                        $(this)[0].pause();
                    });
                    $('#' + that.idText + " video").each(function(){
                        $(this)[0].pause();
                    });

                    that.backgroundCache_layer.moveToBottom();
                    that.backgroundCache_layer.hide();
                    document.body.style.cursor = "default";
                    iaScene.cursorState = "default";

                    for (i in that.kineticElement) {
                        if (that.persistent[i] == "off") {
                            that.kineticElement[i].fillPriority('color');
                            that.kineticElement[i].fill('rgba(0, 0, 0, 0)');
                            that.kineticElement[i].setStroke('rgba(0, 0, 0, 0)');
                            that.kineticElement[i].setStrokeWidth(0);
                        }
                        else if (that.persistent[i] == "onPath") {
                            that.kineticElement[i].fillPriority('color');
                            that.kineticElement[i].fill('rgba(' + iaScene.colorPersistent.red + ',' + iaScene.colorPersistent.green + ',' + iaScene.colorPersistent.blue + ',' + iaScene.colorPersistent.opacity + ')');
                            that.kineticElement[i].setStroke('rgba(0, 0, 0, 0)');
                            that.kineticElement[i].setStrokeWidth(0);
                        }
                        else if (that.persistent[i] == "onImage") {
                            that.kineticElement[i].fillPriority('pattern');
                            that.kineticElement[i].fillPatternScaleX(that.backgroundImageOwnScaleX[i] * 1/iaScene.scale);
                            that.kineticElement[i].fillPatternScaleY(that.backgroundImageOwnScaleY[i] * 1/iaScene.scale);
                            that.kineticElement[i].fillPatternImage(that.backgroundImage[i]);
                            that.kineticElement[i].setStroke('rgba(0, 0, 0, 0)');
                            that.kineticElement[i].setStrokeWidth(0);
                        }
                    }
                    that.group.moveTo(that.layer);
                    that.zoomLayer.moveToBottom();
                    that.zoomLayer.draw();
                    that.layer.draw();
                    that.backgroundCache_layer.draw();
                }
            }
            // let's focus
            else {
                if (iaScene.zoomActive === 0) {
                    if ((iaScene.element !== 0) &&
                        (typeof(iaScene.element) !== 'undefined')) {

                        for (i in iaScene.element.kineticElement) {
                            if (iaScene.element.persistent[i] == "onImage") {
                                iaScene.element.kineticElement[i].fillPriority('pattern');
                                iaScene.element.kineticElement[i].fillPatternScaleX(iaScene.element.backgroundImageOwnScaleX[i] * 1/iaScene.scale);
                                iaScene.element.kineticElement[i].fillPatternScaleY(iaScene.element.backgroundImageOwnScaleY[i] * 1/iaScene.scale);
                                iaScene.element.kineticElement[i].fillPatternImage(iaScene.element.backgroundImage[i]);
                                iaScene.element.kineticElement[i].stroke('rgba(0, 0, 0, 0)');
                                iaScene.element.kineticElement[i].strokeWidth(0);
                            }
                            else if (iaScene.element.persistent[i] == "hiddenSprite") {
                                iaScene.element.kineticElement[i].animation('hidden')
                            }
                            else {
                                iaScene.element.kineticElement[i].fillPriority('color');
                                iaScene.element.kineticElement[i].fill('rgba(0,0,0,0)');
                                iaScene.element.kineticElement[i].setStroke('rgba(0, 0, 0, 0)');
                                iaScene.element.kineticElement[i].setStrokeWidth(0);
                            }
                        }
                        iaScene.element.layer.draw();
                        $('#' + iaScene.element.idText + " audio").each(function(){
                            $(this)[0].pause();
                        });
                        $('#' + iaScene.element.idText + " video").each(function(){
                            $(this)[0].pause();
                        });
                    }
                    if (zoomable === true) {
                        //document.body.style.cursor = 'url("img/ZoomIn.cur"),auto';
                        document.body.style.cursor = 'zoom-in';
                        iaScene.cursorState = 'url("img/ZoomIn.cur"),auto';
                    }
                    else {
                        iaScene.cursorState = 'url("img/ZoomFocus.cur"),auto';
                    }
                    var cacheBackground = true;
                    for (i in that.kineticElement) {
                        if (that.persistent[i] === "onImage") cacheBackground = false;

                        if ((that.persistent[i] == "hiddenSprite") || (that.persistent[i] == "persistentSprite")) {
                            that.kineticElement[i].animation('idle')
                            that.kineticElement[i].frameIndex(0)
                        }
                        else {

                            that.kineticElement[i].fillPriority('pattern');
                            that.kineticElement[i].fillPatternScaleX(that.backgroundImageOwnScaleX[i] * 1/iaScene.scale);
                            that.kineticElement[i].fillPatternScaleY(that.backgroundImageOwnScaleY[i] * 1/iaScene.scale);
                            that.kineticElement[i].fillPatternImage(that.backgroundImage[i]);
                            //that.kineticElement[i].stroke(iaScene.overColorStroke);
                            //that.kineticElement[i].strokeWidth(2);
                            that.kineticElement[i].stroke(that.stroke[i]);
                            that.kineticElement[i].strokeWidth(that.strokeWidth[i]);
                        }
                        that.kineticElement[i].moveToTop();
                    }
                    if (cacheBackground === true) {
                      that.backgroundCache_layer.moveToTop()
                      that.backgroundCache_layer.show()
                    }
                    //that.group.moveToTop();
                    that.layer.moveToTop();
                    that.layer.draw();
                    if (cacheBackground === true) {
                      that.backgroundCache_layer.draw();
                    }

                    iaScene.element = that;
                    that.myhooks.afterIaObjectFocus(iaScene, idText, that);


                }
            }

        });
    }
    /*
     * if we leave this element, just clear the scene
     */
    that.kineticElement[i].on('mouseleave', function() {
        //iaScene.noPropagation = true;
        if ((iaScene.cursorState.indexOf("ZoomOut.cur") !== -1) ||
          (iaScene.cursorState.indexOf("ZoomIn.cur") !== -1) ||
           (iaScene.cursorState.indexOf("ZoomFocus.cur") !== -1)) {

        }
        else {
            var mouseXY = that.layer.getStage().getPointerPosition();
            if (typeof(mouseXY) == "undefined") {
		        mouseXY = {x:0,y:0};
            }
            if ((that.layer.getStage().getIntersection(mouseXY) != this)) {
                that.backgroundCache_layer.moveToBottom();
                that.backgroundCache_layer.hide();
                for (var i in that.kineticElement) {
                    if ((that.persistent[i] == "off") || (that.persistent[i] == "off-image")) {
                        that.kineticElement[i].fillPriority('color');
                        that.kineticElement[i].fill('rgba(0, 0, 0, 0)');
                        that.kineticElement[i].stroke('rgba(0, 0, 0, 0)');
                        that.kineticElement[i].strokeWidth(0);
                    }
                    else if (that.persistent[i] == "onPath") {
                        that.kineticElement[i].fillPriority('color');
                        that.kineticElement[i].fill('rgba(' + iaScene.colorPersistent.red + ',' + iaScene.colorPersistent.green + ',' + iaScene.colorPersistent.blue + ',' + iaScene.colorPersistent.opacity + ')');
                        that.kineticElement[i].stroke('rgba(0, 0, 0, 0)');
                        that.kineticElement[i].strokeWidth(0);

                    }
                    else if (that.persistent[i] == "onImage") {
                        that.kineticElement[i].fillPriority('pattern');
                        that.kineticElement[i].fillPatternScaleX(that.backgroundImageOwnScaleX[i] * 1/iaScene.scale);
                        that.kineticElement[i].fillPatternScaleY(that.backgroundImageOwnScaleY[i] * 1/iaScene.scale);
                        that.kineticElement[i].fillPatternImage(that.backgroundImage[i]);
                        that.kineticElement[i].stroke('rgba(0, 0, 0, 0)');
                        that.kineticElement[i].strokeWidth(0);

                    }
                    else if (that.persistent[i] == "hiddenSprite") {
                        that.kineticElement[i].animation('hidden')
                    }

                }
                document.body.style.cursor = "default";
                iaScene.cursorState = "default";
                that.layer.draw();
            }
        }
    });
};
