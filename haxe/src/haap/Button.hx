package haap;
import h2d.Object;

final color_bg_content = 0x7A8FEC;

class Button extends h2d.Object {

	var g:h2d.Graphics;
	var itv:h2d.Interactive;
    var label:h2d.Text;

    public function new(text,w,h) {
        super();
        g = new h2d.Graphics(this);
        g.clear();
		g.beginFill(color_bg_content );
		g.drawRect(0, 0, w, h);
		g.endFill();

        label=new h2d.Text(hxd.res.DefaultFont.get(),this);
        label.text=text;

        itv = new h2d.Interactive(w, h, this);
        itv.onRelease = this.onRelease;

    } 

    function onRelease(e:hxd.Event) {
		trace("onRelease");
        this.action();
	}

    public dynamic function action(){

    }



}