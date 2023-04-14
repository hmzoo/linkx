package haap;

import js.html.MediaDevices;
import js.html.MediaStream;
import js.Browser.document;

class Medias {
	
    public static var  md : MediaDevices;

	public function new() {
   
        trace("ok");
        md = new MediaDevices();
	}

	public function startmedia() {
		md.getUserMedia({video: true, audio: false}).then((s:js.html.MediaStream) -> {
			trace(s);
		});
	}
}
