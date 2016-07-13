var canvas,ctx;
var touchlist=new Array();
var touching=false,fingers=0,fpinch=true;
var pinchd=0,tstime=0;
var boxx,boxy,boxsize,boxscale,boxrot;
var chosen=-1,cscale,crot,avx=0,avy=0,sx,sy,sa,sl,cbx,cby,rotid;
var imagesloaded=0,bkgnd,lasttx,lastty,waitdbltap=false,lttime;
var imorder,owidth,oheight;
var timages,webcam;
var camimage=null;
var snapmode=false,snw=0,snh=0,snb=0;
var dls=0;

function init_canvas()
{
  init_arrays();
  webcam=document.getElementById("webcam");
  canvas=document.getElementById("touchcanvas");
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
  owidth=canvas.width;
  oheight=canvas.height;
  ctx=canvas.getContext("2d");
  canvas.addEventListener("touchstart",handleStart,false);
  canvas.addEventListener("touchend",handleEnd,false);
  canvas.addEventListener("touchcancel",handleCancel,false);
  canvas.addEventListener("touchmove",handleMove,false);
  bkgnd=document.getElementById("bkgnd");
  bkgnd.left=canvas.left;
  bkgnd.top=canvas.top;
  bkgnd.width=canvas.width;
  bkgnd.height=canvas.height;
  bkgnd.zOrder=0;
  canvas.zOrder=1;
  clearcanvas();
  preloadimages();
  randomiseimages();
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
  if(navigator.getUserMedia){navigator.getUserMedia({video: true},handleVideo,videoError);}
  draw();
}

function draw()
{
  requestAnimationFrame(draw);
  ctx.beginPath();
  clearcanvas();
  if(camimage!=null) ctx.drawImage(camimage,snb,0,snw,snh);
  drawcards();
  ctx.closePath();
}

function downloadimage()
{
  if(snapmode==true)
  {
    dls++;
    document.getElementById('dl').download='overlays_'+dls+'.jpg';
    var dt=touchcanvas.toDataURL('image/jpeg');
    document.getElementById('dl').href=dt;
  }
}

function dosnapshot()
{
  if(snapmode==false)
  {
    var scanvas=document.createElement('canvas');
    scanvas.width=webcam.videoWidth;
    scanvas.height=webcam.videoHeight;
    var cc=scanvas.getContext('2d');
    cc.drawImage(webcam,0,0,webcam.videoWidth,webcam.videoHeight);
    camimage=new Image();
    camimage.src=scanvas.toDataURL();
    snh=touchcanvas.height;
    snw=snh*(webcam.videoWidth/webcam.videoHeight);
    snb=(canvas.width-snw)/2;
    document.getElementById("snapshot").src="video.png";
    document.getElementById("dlbutt").style.display="block";
    snapmode=true;
  }
  else
  {
    camimage=null;
    document.getElementById("snapshot").src="camera.png";
    document.getElementById("dlbutt").style.display="none";
    snapmode=false;
  }
}

function handleVideo(stream)
{
  webcam.src=window.URL.createObjectURL(stream);
}
 
function videoError(e)
{
}

function init_arrays()
{
  timages=new Array();
  boxx=new Array();
  boxy=new Array();
  boxsize=new Array();
  boxscale=new Array();
  boxrot=new Array();
  imorder=new Array();
}

function clearcanvas()
{
  ctx.clearRect(0,0,canvas.width,canvas.height);
}

function drawcards()
{
  var isx,isy,i;
  for(var c=0;c<timages.length;c++)
  {
    i=imorder[c];
    isx=boxsize[i]*boxscale[i];
    isy=(boxsize[i]*boxscale[i])*(timages[i].height/timages[i].width);
    ctx.save();
    ctx.translate(boxx[i],boxy[i]);
    ctx.rotate(boxrot[i]);
    ctx.drawImage(timages[i],-(isx/2),-(isy/2),isx,isy);
    ctx.restore();
  }
}

function getcardatposition(mx,my)
{
  var i,j,ma,dx,dy,px,py,d,hbw,hbh,cc=-1;
  for(j=0;j<imorder.length;j++)
  {
    i=imorder[j];
    dx=mx-boxx[i];
    dy=my-boxy[i];
    ma=Math.atan2(dy,dx);
    d=Math.sqrt(dx*dx+dy*dy);
    px=d*Math.cos(ma-boxrot[i]);
    py=d*Math.sin(ma-boxrot[i]);
    hbw=(boxsize[i]*boxscale[i])/2;
    hbh=((boxsize[i]*boxscale[i])*(timages[i].height/timages[i].width)/2);
    if(Math.abs(px)<=hbw && Math.abs(py)<=hbh) cc=i;
  }
  if(cc!=-1)
  {
    var a=new Array();
    for(j=0;j<imorder.length;j++)
      if(imorder[j]!=cc) a.push(imorder[j]);
    a.push(cc);
    imorder=a;
  }
  return cc;
}

function getposition()
{
  avx=0; avy=0;
  if(touchlist.length==1)
  {
    avx=touchlist[0].pageX;
    avy=touchlist[0].pageY;
  }
  else
  {
    for(var i=0;i<touchlist.length;i++)
    {
      avx+=touchlist[i].pageX;
      avy+=touchlist[i].pageY;
    }
    avx/=touchlist.length;
    avy/=touchlist.length;
  }
}

function processtouches()
{ 
  if(touching==false) return;
  if((new Date().getTime()-tstime)<100) return;
  getposition();
  if(chosen<0) return;
  switch(fingers)
  {
    case 1:   boxx[chosen]=cbx+avx-sx;
              boxy[chosen]=cby+avy-sy;
              break;
    case 2:   case 3: case 4: case 5: case 6: case 7: case 8: case 9:
    case 10:  var dx=touchlist[1].pageX-touchlist[0].pageX;
              var dy=touchlist[1].pageY-touchlist[0].pageY;
              var dist=Math.sqrt(dx*dx+dy*dy);
              if(fpinch==true)
              {
                fpinch=false;
                pinchd=dist;
              }
              else
              {
                boxscale[chosen]=cscale*(dist/pinchd);
                if(boxscale[chosen]<0.3) boxscale[chosen]=0.3;
                if(boxscale[chosen]>10) boxscale[chosen]=10;
                boxrot[chosen]=crot+getrotation()-sa;
                if(boxrot[chosen]<0) boxrot[chosen]+=Math.PI*2;
                if(boxrot[chosen]>(Math.PI*2)) boxrot[chosen]-=Math.PI*2;
              }
              boxx[chosen]=cbx+avx-sx;
              boxy[chosen]=cby+avy-sy;
              break;
    default:  boxx[chosen]=cbx+avx-sx;
              boxy[chosen]=cby+avy-sy;
              break;
  }
  if(boxx[chosen]<0) boxx[chosen]=0;
  if(boxx[chosen]>canvas.width) boxx[chosen]=canvas.width;
  if(boxy[chosen]<0) boxy[chosen]=0;
  if(boxy[chosen]>canvas.height) boxy[chosen]=canvas.height;
}

function getfurthestfinger()
{
  var d=-999,tid=-1;
  for(var i=0;i<touchlist.length;i++)
  {
    var x=touchlist[i].pageX-avx;
    var y=touchlist[i].pageY-avy;
    var dt=Math.sqrt(x*x+y*y);
    if(dt>d)
    {
      d=dt;
      tid=touchlist[i].identifier;
    }
  }
  return tid;
}

function getrotation()
{
  var ang=0;
  for(var i=0;i<touchlist.length;i++)
  {
    if(touchlist[i].identifier==rotid)
      ang=Math.atan2(touchlist[i].pageY-avy,touchlist[i].pageX-avx);
  }
  return ang;
}

function handleTap(tx,ty)
{
  var handled=false;
  if(handled==false) waitdbltap=true;
}

function handleDoubleTap(x,y)
{
  var handled=false;
  if(handled==false)
  {
    var card=getcardatposition(x,y);
    if(card>=0)
    {
      // Do something with double tapped card
    }
  }
}

function handleStart(evt)
{
  touching=true;
  evt.preventDefault();
  tstime=new Date().getTime();
  var touches=evt.touches;
  fingers=touches.length;
  touchlist=new Array();
  for(var i=0;i<touches.length;i++) touchlist.push(touches[i]);
  tl=touchlist.length;
  getposition();
  sx=avx;
  sy=avy;
  var oc=chosen;
  chosen=getcardatposition(avx,avy);
  if(oc!=-1 && chosen==-1)
  {
    // STOPPED HAVING A CHOSEN CARD
  }
  if(chosen!=oc)
  {
    // CHOSEN CARD HAS CHANGED
  }
  if(chosen>=0)
  {
    cscale=boxscale[chosen];
    if(fingers>1)
    {
      rotid=getfurthestfinger();
      crot=boxrot[chosen];
      sa=getrotation();
    }
    cbx=boxx[chosen];
    cby=boxy[chosen];
    processtouches();
  }
  if(fingers==1)
  {
    lasttx=touches[0].pageX;
    lastty=touches[0].pageY;
  }
}

function handleMove(evt)
{
  evt.preventDefault();
  var touches=evt.touches;
  touchlist=new Array();
  for(var i=0;i<touches.length;i++) touchlist.push(touches[i]);
  if(touchlist.length!=tl) handleStart(evt);
  else processtouches();
  if(fingers==1)
  {
    lasttx=touches[0].pageX;
    lastty=touches[0].pageY;
  }
}

function handleEnd(evt)
{
  touching=false;
  evt.preventDefault();
  var touches=evt.touches;
  touchlist=new Array();
  for(var i=0;i<touches.length;i++) touchlist.push(touches[i]);
  if(fingers==1 && (new Date().getTime()-tstime)>50 && (new Date().getTime()-tstime)<200)
  {
    var x=sx-lasttx;
    var y=sy-lastty;
    if(Math.sqrt(x*x+y*y)<=60)
    {
      if((new Date().getTime()-lttime)>=1000) waitdbltap=false;
      if(waitdbltap==true)
      {
        waitdbltap=false;
        if((new Date().getTime()-lttime)<1000)
        {
          handleDoubleTap(sx,sy);
        }
      }
      else
      {
        handleTap(sx,sy);
        lttime=new Date().getTime();
      }
    }
  }
  else
  {
    processtouches();
  }
  fpinch=true;
}

function handleCancel(evt)
{
  touching=false;
  evt.preventDefault();
  fpinch=true;
}

function preloadimages()
{
  for(var i=0;i<cardlist.length;i++)
  {
    timages[i]=new Image();
    timages[i].src="./"+cardlist[i];
    timages[i].onload=function(){imagesloaded++;};
  }
}

function randomiseimages()
{
  for(var i=0;i<timages.length;i++)
  {
    boxx[i]=Math.random()*(canvas.width*0.6)+(canvas.width*0.2);
    boxy[i]=Math.random()*(canvas.height*0.6)+(canvas.height*0.2);
    boxsize[i]=canvas.height/5;
    boxscale[i]=iscale;
    boxrot[i]=(Math.random()*(Math.PI/2))-(Math.PI/4);
    imorder[i]=i;
  }
}

function moveonresize()
{
  xfactor=window.innerWidth/owidth;
  yfactor=window.innerHeight/oheight;
  for(var i=0;i<boxx.length;i++)
  {
    boxx[i]*=xfactor;
    boxy[i]*=yfactor;
  }
  owidth=window.innerWidth;
  oheight=window.innerHeight;
}

function onWindowResize()
{
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
  bkgnd.left=canvas.left;
  bkgnd.top=canvas.top;
  bkgnd.width=canvas.width;  
  bkgnd.height=canvas.height;
  bkgnd.zOrder=0;
  canvas.zOrder=1;
  camimage=null;
  snapmode=false;
  document.getElementById("snapshot").src="camera.png";
  moveonresize();
}

function getExtension(path)
{
  var basename=path.split(/[\\/]/).pop();
  var pos=basename.lastIndexOf(".");
  if(basename==="" || pos<1)
  return "";
  return basename.slice(pos+1);
}

window.addEventListener('resize',onWindowResize,false);
