var canvas = document.getElementById("canvas");
var canvasTimeBar = document.getElementById("canvasTimeBar");

var ctx = canvas.getContext("2d");
var ctxTimeBar = canvasTimeBar.getContext("2d");
ctxTimeBar.fillStyle = "#999999";
ctx.fillStyle = "#999999";
ctx.font = "8pt CopperPennyDTP";
ctx.font = "8pt CopperPennyDTP";
ctxTimeBar.font = "8pt CopperPennyDTP";

var img = new Image();
var imgSave = new Image();
imgSave.src = '/static/icons/iconSave.png';

var radius = 4;
var variationRadius = radius;
var str = "" + 1;
var pad = "0000";
var min = "00";
var loaded = false;
var zoom = false;
var zoomX = -1;
var zoomY = -1;
var mouseX = -1;
var mouseY = -1;

var imageIndexToLoad = 0;
var nbImages = 290;
var nbCameras = 18;

var frame = "0227";

var clickerLength = 960;
var clickerHeight = 540;

var referenceLength = 960;
var referenceHeight = 540;

var miniatureLength = 192;
var miniatureHeight = 108;

var nbPoints = 500;

var imgClickIndex = 0;
var imgReferenceIndex = -1;

var chargement = 0;
var chargementTotal = nbCameras;

var pts = new Array(nbCameras);
var realPts = new Array(nbCameras);
var ptIndex = 0;
var colors = ["#FF0000", "#00CC00", "#00CCCC", "#F4DC42", "#9933FF", "#E28D1D", "#99FF33", "#FF66FF", "#FFFFFF", "#33FFFF", "#994C00", "#A0A0A0", "#0066CC", "#D6B78F"]
for (var i = 14; i < nbPoints; i++) {
    colors[i] = getRandomColor();
}


var imgs = new Array(nbCameras);
for (var i = 0; i < nbCameras; i++) {
    realPts[i] = new Array(2*nbPoints);
    realPts[i].fill(-1);
    pts[i] = new Array(2*nbPoints);
    pts[i].fill(-1);
    imgs[i] = new Image();
    imgs[i].src = '/static/textures/imgsF1C'+ parseInt(1+i+7*(i >= 7)) + '/image_' + frame + "_F1C" + parseInt(1+i+7*(i >= 7))  + ".jpeg";
}

for (var i = 0 ; i < nbCameras; i++) {
    imgs[i].onload = function() {
        chargement+= 1;
        loadNextImage();
    };
}

function loadNextImage() {
    if (chargement >= nbCameras) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animate();
    } else {
        loadingBar();
    }
}

/////////////////////////////////
//////// EVENT LISTENERS ////////
/////////////////////////////////

document.onkeydown = checkKey;

canvas.addEventListener("DOMMouseScroll", MouseWheelHandler, false);

document.addEventListener('contextmenu', event => event.preventDefault());

canvas.addEventListener("mousedown", function(e) {
    e.preventDefault();
    var mousePos = getMousePos(canvas,e);
    switch (e.which) {
        case 1: // left click
            if (mousePos.x >= 0 && mousePos.x < 6*miniatureLength && mousePos.y >= 40+clickerHeight && mousePos.y < 40+clickerHeight+3*miniatureHeight) { // click on a miniature
                var indexNewClickerImg = Math.floor(mousePos.x /miniatureLength) + 6*Math.floor((mousePos.y-40-clickerHeight)/miniatureHeight);
                imgClickIndex = indexNewClickerImg;
                zoom = false;
            }
            else if (mousePos.x >= 0 && mousePos.x < clickerLength && mousePos.y >= 0 && mousePos.y < clickerHeight) { // click on the clicker area
                if (!zoom) {
                    pts[imgClickIndex][2*ptIndex] = mousePos.x;
                    pts[imgClickIndex][2*ptIndex+1] = mousePos.y;
                    realPts[imgClickIndex][2*ptIndex] = pts[imgClickIndex][2*ptIndex] * imgs[imgClickIndex].width/clickerLength;
                    realPts[imgClickIndex][2*ptIndex+1] = pts[imgClickIndex][2*ptIndex] * imgs[imgClickIndex].height/clickerHeight;
                } else { // if zoom
                    pts[imgClickIndex][2*ptIndex] = mousePos.x/2 + zoomX - clickerLength/4;
                    pts[imgClickIndex][2*ptIndex+1] = mousePos.y/2 + zoomY - clickerHeight/4;
                    realPts[imgClickIndex][2*ptIndex] = pts[imgClickIndex][2*ptIndex] * imgs[imgClickIndex].width/clickerLength;
                    realPts[imgClickIndex][2*ptIndex+1] = pts[imgClickIndex][2*ptIndex] * imgs[imgClickIndex].height/clickerHeight;
                }
                ptIndex++;
            }
            else if (mousePos.x >= clickerLength && mousePos.x < clickerLength+referenceLength && mousePos.y >= 0 && mousePos.y < referenceHeight && imgReferenceIndex >= 0) { // click on the reference area
                var closestPtIndex = 0;
                var shortestDist = 10000000;
                for (var p = 0; p < colors.length; p++) {
                    if (pts[imgReferenceIndex][2*p] >= 0) {
                        var dist = Math.pow(pts[imgReferenceIndex][2*p]*(clickerLength/referenceLength)-(mousePos.x-clickerLength),2)+Math.pow(pts[imgReferenceIndex][2*p+1]*(clickerHeight/referenceHeight)-mousePos.y,2);
                        if (dist < shortestDist) {
                            shortestDist = dist;
                            closestPtIndex = p;
                        }
                    }
                    ptIndex = closestPtIndex;
                }
            }

            break;
        default: // right click
            if (mousePos.x >= 0 && mousePos.x < 6*miniatureLength && mousePos.y >= 40+clickerHeight && mousePos.y < 40+clickerHeight+3*miniatureHeight) { // click on a miniature
                var indexNewClickerImg = Math.floor(mousePos.x /miniatureLength) + 6*Math.floor((mousePos.y-40-clickerHeight)/miniatureHeight);
                imgReferenceIndex = indexNewClickerImg;
            }
            else if (mousePos.x >= 0 && mousePos.x < clickerLength && mousePos.y >= 0 && mousePos.y < clickerHeight && ptIndex > 0) { // click on the clicker area
                pts[imgClickIndex][2*ptIndex-2] = -1;
                pts[imgClickIndex][2*ptIndex-1] = -1;
                realPts[imgClickIndex][2*ptIndex-2] = -1;
                realPts[imgClickIndex][2*ptIndex-1] = -1;
                ptIndex--;
            }
            break;
    }
}, false);

canvas.addEventListener("mouseout", function(e) {
}, false);

canvas.addEventListener("mouseup", function(e) {
}, false);

canvas.addEventListener("mousemove", function(e) {
    var mousePos = getMousePos(canvas,e);
    if (mousePos.x >= 0 && mousePos.x < clickerLength && mousePos.y >= 0 && mousePos.y < clickerHeight) {
        mouseX = mousePos.x;
        mouseY = mousePos.y;
        document.getElementById('canvas').style.cursor = 'none';
    } else {
        mouseX = -1;
        mouseY = -1;
        document.getElementById('canvas').style.cursor = 'pointer';
    }
}, false);

canvasTimeBar.addEventListener("mousedown", function(e) {
    e.preventDefault();
    var mousePos = getMousePos(canvas,e);
    switch (e.which) {
        case 1: // left click
            if (mousePos.x < clickerLength - 30) {
                ptIndex++;
            } else if (mousePos.x > clickerLength - 23 && mousePos.x < clickerLength - 4) {
                downloadKeypoints();
            }
            break;
        default: // right click
            if (mousePos.x < clickerLength - 30) {
                ptIndex = Math.max(0, ptIndex-1);
            }
            break;
    }
}, false);

//////////////////////////////////
//////// USEFUL FUNCTIONS ////////
//////////////////////////////////

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctxTimeBar.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#999999";
    ctxTimeBar.fillStyle = "#999999";
    ctxTimeBar.drawImage(imgSave, clickerLength-23, 5);

    variationRadius = radius + (variationRadius-radius+0.1)%radius;

    ////////////////////////
    // Clicker image part //
    ////////////////////////
    if (imgClickIndex >= 0 && imgClickIndex < nbCameras) {
        ctxTimeBar.strokeText("Image à cliquer (Caméra n°" + parseInt(1+imgClickIndex+7*(imgClickIndex>=7))+")", 8, 18);
        ctxTimeBar.fillText("Image à cliquer (Caméra n°" + parseInt(1+imgClickIndex+7*(imgClickIndex>=7))+")", 8, 18);

        ctxTimeBar.fillStyle = colors[ptIndex];
        ctxTimeBar.strokeText("Point n°" + parseInt(ptIndex+1) , 228, 18);
        ctxTimeBar.fillText("Point n°" + parseInt(ptIndex+1) , 228, 18);

        if (!zoom) {
            ctx.drawImage(imgs[imgClickIndex], 0, 0, clickerLength, clickerHeight);
            for (var p = 0; p < colors.length; p++) {
                if (pts[imgClickIndex][2*p] >= 0) {
                    ctx.beginPath();
                    ctx.arc(pts[imgClickIndex][2*p], pts[imgClickIndex][2*p+1], radius, 0, 2*Math.PI);
                    ctx.stroke();
                    ctx.fillStyle = colors[p];
                    ctx.fill();
                    ctx.strokeText(parseInt(p+1), pts[imgClickIndex][2*p]-10*(pts[imgClickIndex][2*p]>clickerLength/2), pts[imgClickIndex][2*p+1]+14-21*(pts[imgClickIndex][2*p+1]>clickerHeight/2));
                    ctx.fillText(parseInt(p+1), pts[imgClickIndex][2*p]-10*(pts[imgClickIndex][2*p]>clickerLength/2), pts[imgClickIndex][2*p+1]+14-21*(pts[imgClickIndex][2*p+1]>clickerHeight/2));
                    if (ptIndex == p) {
                        ctx.beginPath();
                        ctx.arc(pts[imgClickIndex][2*p], pts[imgClickIndex][2*p+1], variationRadius, 0, 2*Math.PI);
                        ctx.stroke();
                    }
                }
            }
        } else {
            ctx.drawImage(imgs[imgClickIndex], (imgs[imgClickIndex].width/clickerLength)*(zoomX-clickerLength/4), (imgs[imgClickIndex].height/clickerHeight)*(zoomY-clickerHeight/4), imgs[imgClickIndex].width/2, imgs[imgClickIndex].height/2, 0, 0, clickerLength, clickerHeight);
            for (var p = 0; p < colors.length; p++) {
                if (pts[imgClickIndex][2*p] >= 0) {
                    ctx.beginPath();
                    ctx.arc(2*pts[imgClickIndex][2*p]-2*zoomX+clickerLength/2, 2*pts[imgClickIndex][2*p+1]-2*zoomY+clickerHeight/2, radius, 0, 2*Math.PI);
                    ctx.stroke();
                    ctx.fillStyle = colors[p];
                    ctx.fill();
                    ctx.strokeText(parseInt(p+1), 2*pts[imgClickIndex][2*p]-10*(pts[imgClickIndex][2*p]>clickerLength/2)-2*zoomX+clickerLength/2, 2*pts[imgClickIndex][2*p+1]+14-21*(pts[imgClickIndex][2*p+1]>clickerHeight/2)-2*zoomY+clickerHeight/2);
                    ctx.fillText(parseInt(p+1), 2*pts[imgClickIndex][2*p]-10*(pts[imgClickIndex][2*p]>clickerLength/2)-2*zoomX+clickerLength/2, 2*pts[imgClickIndex][2*p+1]+14-21*(pts[imgClickIndex][2*p+1]>clickerHeight/2)-2*zoomY+clickerHeight/2);
                    if (ptIndex == p) {
                        ctx.beginPath();
                        ctx.arc(2*pts[imgClickIndex][2*p]-2*zoomX+clickerLength/2, 2*pts[imgClickIndex][2*p+1]-2*zoomY+clickerHeight/2, variationRadius, 0, 2*Math.PI);
                        ctx.stroke();
                    }
                }
            }
        }
    }

    if (mouseX >= 0 && mouseX < clickerLength && mouseY >= 0 && mouseY < clickerHeight) {
        ctx.beginPath();
        ctx.moveTo(mouseX, mouseY);
        ctx.lineTo(0, mouseY);
        ctx.moveTo(mouseX, mouseY);
        ctx.lineTo(clickerLength, mouseY);
        ctx.moveTo(mouseX, mouseY);
        ctx.lineTo(mouseX, 0);
        ctx.moveTo(mouseX, mouseY);
        ctx.lineTo(mouseX, clickerHeight);
        ctx.stroke();
    }

    ctx.fillStyle = "#999999";
    ctxTimeBar.fillStyle = "#999999";
    if (imgReferenceIndex >= 0 && imgReferenceIndex < nbCameras) {
        ctxTimeBar.strokeText("Image de référence (Caméra n°" + parseInt(1+imgReferenceIndex+7*(imgReferenceIndex>=7))+")" , 8+clickerLength, 18);
        ctxTimeBar.fillText("Image de référence (Caméra n°" + parseInt(1+imgReferenceIndex+7*(imgReferenceIndex>=7))+")" , 8+clickerLength, 18);
        ctx.drawImage(imgs[imgReferenceIndex], clickerLength, 0, referenceLength, referenceHeight);

        for (var p = 0; p < colors.length; p++) {
            if (pts[imgReferenceIndex][2*p] >= 0) {
                ctx.beginPath();
                ctx.arc(clickerLength+(referenceLength/clickerLength)*pts[imgReferenceIndex][2*p], (referenceHeight/clickerHeight)*pts[imgReferenceIndex][2*p+1], radius, 0, 2*Math.PI);
                ctx.stroke();
                ctx.fillStyle = colors[p];
                ctx.fill();
                ctx.strokeText(parseInt(p+1), clickerLength-10*(pts[imgReferenceIndex][2*p]>clickerLength/2)+pts[imgReferenceIndex][2*p]*referenceLength/clickerLength, pts[imgReferenceIndex][2*p+1]*referenceHeight/clickerHeight+14-21*(pts[imgReferenceIndex][2*p+1]>clickerHeight/2));
                ctx.fillText(parseInt(p+1), clickerLength-10*(pts[imgReferenceIndex][2*p]>clickerLength/2)+pts[imgReferenceIndex][2*p]*referenceLength/clickerLength, pts[imgReferenceIndex][2*p+1]*referenceHeight/clickerHeight+14-21*(pts[imgReferenceIndex][2*p+1]>clickerHeight/2));
                if (ptIndex == p) {
                    ctx.beginPath();
                    ctx.arc(clickerLength+(referenceLength/clickerLength)*pts[imgReferenceIndex][2*p], (referenceHeight/clickerHeight)*pts[imgReferenceIndex][2*p+1], variationRadius, 0, 2*Math.PI);
                    ctx.stroke();
                }
            }
        }
    }

    ctx.fillStyle = "#999999";
    ctx.strokeText("Autres images :" , 8, 25+clickerHeight);
    ctx.fillText("Autres images :" , 8, 25+clickerHeight);
    for (i = 0; i < nbCameras; i++) {
        ctx.drawImage(imgs[i], miniatureLength*(i%6), 40+clickerHeight+miniatureHeight*Math.floor(i/6), miniatureLength, miniatureHeight);


        for (var p = 0; p < colors.length; p++) {
            if (pts[i][2*p] >= 0) {
                ctx.beginPath();
                ctx.arc((miniatureLength/clickerLength)*pts[i][2*p]+(i%6)*miniatureLength, Math.floor(i/6)*miniatureHeight+clickerHeight+40+(miniatureHeight/clickerHeight)*pts[i][2*p+1], radius/2, 0, 2*Math.PI);
                ctx.stroke();
                ctx.fillStyle = colors[p];
                ctx.fill();
                if (ptIndex == p) {
                    ctx.beginPath();
                    ctx.arc((miniatureLength/clickerLength)*pts[i][2*p]+(i%6)*miniatureLength, Math.floor(i/6)*miniatureHeight+clickerHeight+40+(miniatureHeight/clickerHeight)*pts[i][2*p+1], variationRadius/2, 0, 2*Math.PI);
                    ctx.stroke();
                }
            }
        }
    }
}


function getRandomColor() {
    var letters = '0123456789abcdef'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random()*16)];
    }
    return color;
}


function checkKey(e) {
    e = e || window.event;

    if (e.keyCode == '37') { // Left arrow
        frame = Math.max(frame-1, 1);
    }
    if (e.keyCode == '39') { // Right arrow
        frame = Math.min(frame+1, nbImages);
    }
}

function getMousePos(canv, e) {
    var rect = canv.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
            y: e.clientY - rect.top
    };
}

function MouseWheelHandler(e) {
    var e = window.event || e; // old IE support
    var mousePos = getMousePos(canvas,e);
    if (mousePos.x >= 0 && mousePos.x < clickerLength && mousePos.y >= 0 && mousePos.y < clickerHeight) {
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        if (!zoom && delta > 0) {
            zoom = true;
            zoomX = Math.min(Math.max(mousePos.x, clickerLength*0.25), clickerLength*0.75);
            zoomY = Math.min(Math.max(mousePos.y, clickerHeight*0.25), clickerHeight*0.75);
        } else if (zoom && delta < 0) {
            zoom = false;
            zoomX = -1;
            zoomY = -1;
        }
    }
}

function timeBar(x, y, dx, dy) {
    ctxTimeBar.strokeStyle = '#000000';
    ctxTimeBar.beginPath();
    ctxTimeBar.moveTo(x,    y);
    ctxTimeBar.lineTo(x+dx, y);
    ctxTimeBar.lineTo(x+dx, y+dy);
    ctxTimeBar.lineTo(x,    y+dy);
    ctxTimeBar.lineTo(x,    y);
    ctxTimeBar.stroke();
    ctxTimeBar.fillStyle = '#aa0000';
    ctxTimeBar.beginPath();
    ctxTimeBar.moveTo(x+1, y+1);
    ctxTimeBar.lineTo(x+1+1.0*(dx-2)*((frame-1)/(nbImages-1)), y+1);
    ctxTimeBar.lineTo(x+1+1.0*(dx-2)*((frame-1)/(nbImages-1)), y+1+dy-2);
    ctxTimeBar.lineTo(x+1, y+1+dy-2);
    ctxTimeBar.lineTo(x+1, y+1);
    ctxTimeBar.fill();
    ctxTimeBar.fillStyle = '#ffffff';
    ctxTimeBar.strokeText("Chargement : " + Math.round(100.0*chargement/chargementTotal) + "%", 420, 360);
    ctxTimeBar.fillText("Chargement : " + Math.round(100.0*chargement/chargementTotal) + "%", 420, 360);
}

function loadingBar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(279, 339);
    ctx.lineTo(279+402, 339);
    ctx.lineTo(279+402, 339+42);
    ctx.lineTo(279, 339+42);
    ctx.lineTo(279, 339);
    ctx.stroke();
    ctx.fillStyle = '#006600';
    ctx.beginPath();
    ctx.moveTo(280, 340);
    ctx.lineTo(280+400.0*(chargement/chargementTotal), 340);
    ctx.lineTo(280+400.0*(chargement/chargementTotal), 340+40);
    ctx.lineTo(280, 340+40);
    ctx.lineTo(280, 340);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.strokeText("Chargement : " + Math.round(100.0*chargement/chargementTotal) + "%", 420, 360);
    ctx.fillText("Chargement : " + Math.round(100.0*chargement/chargementTotal) + "%", 420, 360);
}

function download(strData, strFileName, strMimeType) {
    var D = document,
        A = arguments,
        a = D.createElement("a"),
        d = A[0],
        n = A[1],
        t = A[2] || "text/plain";

    //build download link:
    a.href = "data:" + strMimeType + "charset=utf-8," + escape(strData);


    if (window.MSBlobBuilder) { // IE10
        var bb = new MSBlobBuilder();
        bb.append(strData);
        return navigator.msSaveBlob(bb, strFileName);
    } /* end if(window.MSBlobBuilder) */

    if ('download' in a) { //FF20, CH19
        a.setAttribute("download", n);
        a.innerHTML = "downloading...";
        D.body.appendChild(a);
        setTimeout(function() {
            var e = D.createEvent("MouseEvents");
            e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            a.dispatchEvent(e);
            D.body.removeChild(a);
        }, 66);
        return true;
    }; /* end if('download' in a) */

    //do iframe dataURL download: (older W3)
    var f = D.createElement("iframe");
    D.body.appendChild(f);
    f.src = "data:" + (A[2] ? A[2] : "application/octet-stream") + (window.btoa ? ";base64" : "") + "," + (window.btoa ? window.btoa : escape)(strData);
    setTimeout(function() {
        D.body.removeChild(f);
    }, 333);
    return true;
}

function highestIndex() {
    var highestIdx = 0;
    var finished = false;
    while (!finished) {
        var keepGoing = false;
        for (var i = 0; i < nbCameras; i++) {
            if (pts[i][2*highestIdx] >= 0) {
                keepGoing = true;
            }
        }
        if (keepGoing) {
            highestIdx++;
        } else {
            finished = true;
        }
    }
    return highestIdx;
}

function downloadKeypoints() {
    var str = "";
    for (var i = 0; i < nbCameras; i++) {
        str = str + "pts(:,:," + parseInt(i+1) + ") = [\n";
        for (var j = 0; j < highestIndex(); j++) {
            str = str + pts[i][2*j] + "," + pts[i][2*j+1] + ";\n"
        }
        str = str + "];\n";
    }
    download(str, 'keypoints.txt', 'text/plain');
}
