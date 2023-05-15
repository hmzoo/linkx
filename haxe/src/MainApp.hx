package;
import haap.*;
import linkx.Linkx;



@:native("window")
extern class Globals {
  static var linkx:Linkx;
}

class  MainApp  extends hxd.App {

    var infos:h2d.Text;
    var button:haap.Button;
    var video:haap.MyVideo;
    
    

    

    override  function  init() {

        hxd.Res.initEmbed();
        
        //



        trace("cool");
        trace(Linkx.my_key);
       
        trace("cool2");
        
        trace("L",Linkx);
        //trace(linkx.get('my_key'));

        infos = new h2d.Text(hxd.res.DefaultFont.get());
        //infos.text = linkx.my_key;
        infos.text = "ok";
        infos.x =400;
        button = new haap.Button("BTN",50,20);
        button.x=400;
        button.y=100;
        button.action = function(){ok();};

        video = new haap.MyVideo();
         trace("video",video);
         

        s2d.scaleMode = Resize;
        s2d.addChild(infos); 
        s2d.addChild(button);   
        s2d.addChild(video);  
        
        Linkx.on_update=function(){
            var u=Linkx.get_updates();
            if(u.stream){
                trace("STREAM A",Linkx.my_stream);
                
                video.srcObject(Linkx.my_stream);
   
                trace("STREAM B",video.v.srcObject);
            }
        
        };

    }

    function ok(){
       
        Linkx.stream();
       trace(Linkx.my_stream);
    }

    override function update(dt:Float) {
        var w = hxd.Window.getInstance().width;
		var h = hxd.Window.getInstance().height;
        //infos.text="Size :"+w+" X "+h;
           
        
    }

    override function onResize() {
        super.onResize();
        var w = hxd.Window.getInstance().width;
		var h = hxd.Window.getInstance().height;
        infos.text="Size :"+w+" X "+h;
        
    }


    public static var inst : MainApp;
 

    static  function  main() {
        inst=new  MainApp();
        trace("L",Linkx);
       //Linkx.on_update=function(){trace("YES");};

        

    }
  }