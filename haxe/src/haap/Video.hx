package haap;
import h2d.Object;
import h2d.Video;

final color_bg_content = 0x445566;

class Video extends h2d.Object {

	var g:h2d.Graphics;
    var w:Float = 320;
    var h:Float =200; 
    public var v:h2d.Video;


    public function new() {
        super();
        g = new h2d.Graphics(this);
        g.clear();
		g.beginFill(color_bg_content );
		g.drawRect(0, 0, w, h);
		g.endFill();

        v = new h2d.Video(this);

        
    } 



    public dynamic function action(){

    }



}