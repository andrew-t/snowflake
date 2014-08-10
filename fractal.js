var settings = {
    highIterationCount: 4,
    lowIterationCount:  2
};

document.addEventListener('DOMContentLoaded', function() {
    var overallSize = 100;
    var lineSegment = [point(0,0.3333), point(-0.2887,0.5), point(0,0.6667)];
    var underlyingShapeSides = 3;
    var lineSegmentCanvas,  underlyingShapeCanvas,  outputCanvas;
    var lineSegmentContext, underlyingShapeContext, outputContext;
    var lineSegmentTform, lineSegmentImage;
    var draggingPoint = -1;

    function updateSegment() {
        clearCanvas(lineSegmentContext);
        lineSegmentContext.strokeStyle   = 'black';
        lineSegmentContext.lineWidth     = 1;
        lineSegmentContext.lineCap       = 'round';
        drawPath([point(0,0), point(0, overallSize)],        lineSegmentContext,     lineSegmentCanvas,     false, lineSegment, 1);
        lineSegmentImage = lineSegmentContext.getImageData(0, 0, lineSegmentCanvas.width, lineSegmentCanvas.height);
    }
    function updatePolygon() {
        clearCanvas(underlyingShapeContext);
        underlyingShapeContext.fillStyle = 'blue';
        drawPath(polygon(overallSize, underlyingShapeSides), underlyingShapeContext, underlyingShapeCanvas, true,  lineSegment, 0);
    }
    function updateOutput (good) { 
        clearCanvas(outputContext);
        outputContext.fillStyle          = 'blue';
        drawPath(polygon(overallSize, underlyingShapeSides), outputContext,          outputCanvas,          true,  lineSegment, good ? settings.highIterationCount : settings.lowIterationCount);
        document.getElementById('save').href = outputCanvas.toDataURL();
    }
    var someHugeNumber = -overallSize * 100, twiceThatNumber = overallSize * 200;
    function clearCanvas(ctx) { ctx.clearRect(someHugeNumber, someHugeNumber, twiceThatNumber, twiceThatNumber); }

    function drawPath(path, ctx, canvas, closed, lineSegment, iterations) {
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (var i = 1; i < path.length; ++i)
            drawLineSegment(ctx, lineSegment, path[i-1], path[i], iterations);
        if (closed) {
            drawLineSegment(ctx, lineSegment, path[path.length - 1], path[0], iterations);
            ctx.fill();
        } else ctx.stroke();
    }
    function drawLineSegment(ctx, lineSegment, start, end, iterations) {
        var x = end.x - start.x, y = end.y - start.y;
        ctx.save();
        ctx.translate(start.x, start.y);
        ctx.rotate(Math.atan2(-x, y));
        var scale = Math.sqrt(x*x + y*y);
        ctx.scale(scale, scale);
        //ctx.moveTo(0, 0);
        if (iterations > 0) {
            drawLineSegment(ctx, lineSegment, point(0, 0), lineSegment[0], iterations - 1);
            for (var i = 1; i < lineSegment.length; ++i)
                drawLineSegment(ctx, lineSegment, lineSegment[i-1], lineSegment[i], iterations - 1);
            drawLineSegment(ctx, lineSegment, lineSegment[lineSegment.length-1], point(0, 1), iterations - 1);
        } else ctx.lineTo(0, 1);
        ctx.restore();
    }

    function findCursor(e) {
        return {
            x: (e.pageX - lineSegmentCanvas.offsetLeft - lineSegmentTform.xOffset) / lineSegmentTform.scale,
            y: (e.pageY - lineSegmentCanvas.offsetTop  - lineSegmentTform.yOffset) / lineSegmentTform.scale
        }
    }
    var cursorRadius = overallSize * 0.025;
    function drawCursor(ctx, cursor, colour, image) {
        ctx.putImageData(image, 0, 0);
        ctx.strokeStyle = colour;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(cursor.x * overallSize + cursorRadius, cursor.y * overallSize);
        ctx.arc   (cursor.x * overallSize,                cursor.y * overallSize, cursorRadius, 0, Math.PI * 2, true);
        ctx.stroke();
    }
    var hoverRadiusSquared = 0.002;
    function detectHoverPoint(points, cursor) {
        for (var i = 0; i < points.length; ++i) {
            var x = points[i].x - cursor.x, y = points[i].y - cursor.y;
            if (x * x + y * y < hoverRadiusSquared) return i;
        } for (var i = 1; i < points.length; ++i) {
            var x = (points[i - 1].x + points[i].x) * 0.5 - cursor.x,
                y = (points[i - 1].y + points[i].y) * 0.5 - cursor.y;
            if (x * x + y * y < hoverRadiusSquared) return i - 0.5;
        } return -1;
    }

    function polygon(radius, sides) {
        var dTheta = Math.PI * 2 / sides;
        var theta = (sides % 2) ? dTheta / 2 : 0;
        var corners = Array(sides);
        for (var i = 0; i < sides; ++i) corners[i] = polar(radius, theta += dTheta);
        return corners;
    }
    function point(x, y    ) { return { "x": x,                   "y": y                   }; }
    function polar(r, theta) { return { "x": r * Math.sin(theta), "y": r * Math.cos(theta) }; }
    function initCanvas(ctx, canvas, x0, x1, y0, y1) {
        var scale = absMin(canvas.width / (x1 - x0), canvas.height / (y1 - y0));
        var tform = { "scale": scale,
                      "xOffset": (canvas.width  - (x0 + x1) * scale) / 2,
                      "yOffset": (canvas.height - (y0 + y1) * scale) / 2, };
        ctx.translate(tform.xOffset, tform.yOffset);
        ctx.scale(tform.scale / overallSize, tform.scale / overallSize);
        return tform;
    }
    function absMin(a, b) { return Math.abs(a) < Math.abs(b) ? a : b; }

    lineSegmentCanvas      = document.getElementById('line-segment-canvas');
    underlyingShapeCanvas  = document.getElementById('base-shape-canvas'  );
    outputCanvas           = document.getElementById('output'             );
    lineSegmentContext     = lineSegmentCanvas    .getContext('2d');
    underlyingShapeContext = underlyingShapeCanvas.getContext('2d');
    outputContext          = outputCanvas         .getContext('2d');
    
    var h;
    window.addEventListener('resize', h = function() {
        var canvasses = document.getElementsByTagName('canvas');
        for (var i = 0; i < canvasses.length; ++i) {
             canvasses[i].width  = canvasses[i].offsetWidth  * (window.devicePixelRatio || 1);
             canvasses[i].height = canvasses[i].offsetHeight * (window.devicePixelRatio || 1)
        }
        lineSegmentTform       = initCanvas(lineSegmentContext,     lineSegmentCanvas,      0.50, -0.50, -0.25, 1.25);
                                 initCanvas(underlyingShapeContext, underlyingShapeCanvas, -1.25,  1.25, -1.25, 1.25);
                                 initCanvas(outputContext,          outputCanvas,          -1.25,  1.25, -1.25, 1.25);
        updateSegment();
        updatePolygon();
        updateOutput(true);
    }); h();

    lineSegmentCanvas.addEventListener('mousemove', function(e) {
        var cursor = findCursor(e);
        if (draggingPoint >= 0) {
            lineSegment[draggingPoint] = cursor;
            updateSegment();
            drawCursor(lineSegmentContext, cursor, 'red', lineSegmentImage);
            updateOutput(false);
        } else {
            var hoverPoint = detectHoverPoint(lineSegment, cursor);
            if (hoverPoint % 1 == 0.5) {
                cursor.x = (lineSegment[hoverPoint - 0.5].x + lineSegment[hoverPoint + 0.5].x) * 0.5;
                cursor.y = (lineSegment[hoverPoint - 0.5].y + lineSegment[hoverPoint + 0.5].y) * 0.5;
                drawCursor(lineSegmentContext, cursor, 'green', lineSegmentImage);
            } else if (hoverPoint >= 0) {
                cursor.x = lineSegment[hoverPoint].x;
                cursor.y = lineSegment[hoverPoint].y;
                drawCursor(lineSegmentContext, cursor, 'red', lineSegmentImage);
            } //else drawCursor(lineSegmentContext, cursor, 'blue', lineSegmentImage);
        }
    });
    lineSegmentCanvas.addEventListener('mouseout', function() {
        lineSegmentContext.putImageData(lineSegmentImage, 0, 0);
    });
    lineSegmentCanvas.addEventListener('mousedown', function(e) {
        if (e.which != 1) return;
        var cursor = findCursor(e);
        var hoverPoint = detectHoverPoint(lineSegment, cursor);
        if (hoverPoint % 1 == 0.5) {
            draggingPoint = hoverPoint + 0.5;
            lineSegment.push(lineSegment[lineSegment.length - 1]);
            for (var i = lineSegment.length - 1; i > draggingPoint; --i)
                lineSegment[i] = lineSegment[i - 1];
            lineSegment[hoverPoint + 0.5] = cursor;
        } else draggingPoint = hoverPoint;
        updateSegment();
        drawCursor(lineSegmentContext, cursor, 'red', lineSegmentImage);
        updateOutput(false);
    });
    lineSegmentCanvas.addEventListener('contextmenu', function (e) {
        if (lineSegment.length > 2) {
            var hoverPoint = detectHoverPoint(lineSegment, findCursor(e));
            if ((hoverPoint >= 0) && (hoverPoint % 1 == 0)) {
                for (var i = hoverPoint + 1; i < lineSegment.length; ++i)
                    lineSegment[i - 1] = lineSegment[i];
                lineSegment = lineSegment.slice(0, lineSegment.length - 1);
                updateSegment();
                //drawCursor(lineSegmentContext, cursor, 'blue', lineSegmentImage);
                updateOutput(true);
            }
        } return false;
    });
    lineSegmentCanvas.addEventListener('mouseup', function(e) {
        if (e.which != 1) return;
        draggingPoint = -1;
        updateOutput(true);
    });

    underlyingShapeCanvas.addEventListener('click', function (e) {
        if (e.which != 1) return;
        ++underlyingShapeSides;
        updatePolygon();
        updateOutput(true);
    });
    underlyingShapeCanvas.addEventListener('contextmenu', function (e) {
        if (underlyingShapeSides > 3) {
            --underlyingShapeSides;
            updatePolygon();
            updateOutput(true);
        } return false;
    });

    document.getElementById('recalculate').addEventListener('click', function() { updateOutput(true); })
});