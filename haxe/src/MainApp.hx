package;
import haap.*;
import js.Browser;
import js.lib.Object;

var window:haxe.DynamicAccess<Dynamic> = untyped js.Browser.window;

class  MainApp  extends hxd.App {

    var infos:h2d.Text;
    var button:haap.Button;
    public var medias:haap.Medias;
    var linkx:js.lib.Object;
    

    override  function  init() {

        hxd.Res.initEmbed();
        
        linkx = window.get('linkx');
        trace(linkx);
        //trace(linkx.get('my_key'));

        infos = new h2d.Text(hxd.res.DefaultFont.get());
        //infos.text = linkx.my_key;
        infos.text = "yes";

        button = new haap.Button("BTN",50,20);
        button.x=100;
        button.y=100;
        button.action = function(){ok();};

        s2d.scaleMode = Resize;
        s2d.addChild(infos); 
        s2d.addChild(button);       

    }

    function ok(){
        trace("oketo",window.get('linkx'));
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

    }
  }