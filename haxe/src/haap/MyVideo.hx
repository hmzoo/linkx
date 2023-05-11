package haap;
import h2d.Object;
import h2d.Drawable;
import h2d.Object;
import h2d.RenderContext;



/**
	A video file playback Drawable. Due to platform specifics, each target have their own limitations.

	* <span class="label">Hashlink</span>: Playback ability depends on `https://github.com/HeapsIO/hlvideo` library. It support only video with the AV1 codec packed into a WEBM container.

	* <span class="label">JavaScript</span>: HTML Video element will be used. Playback is restricted by content-security policy and browser decoder capabilities.
**/
class MyVideo extends Drawable {


	public var v : js.html.VideoElement;
	var videoPlaying : Bool;
	var videoTimeupdate : Bool;
	var onReady : Void->Void;
	
	var texture : h3d.mat.Texture;
	var tile : h2d.Tile;
	var playTime : Float;
	var videoTime : Float;
	var frameReady : Bool;
	var loopVideo : Bool;

	/**
		Video width. Value is undefined until video is ready to play.
	**/
	public var videoWidth(default, null) : Int;
	/**
		Video height. Value is undefined until video is ready to play.
	**/
	public var videoHeight(default, null) : Int;
	/**
		Tells if video currently playing.
	**/
	public var playing : Bool;
	/**
		Tells current timestamp of the video.
	**/
	public var time(get, null) : Float;
	/**
		When enabled, video will loop indefinitely.
	**/
	public var loop(get, set) : Bool;

	/**
		Create a new Video instance.
		@param parent An optional parent `h2d.Object` instance to which Video adds itself if set.
		@param cacheSize <span class="label">Hashlink</span>: async precomputing up to `cache` frame. If 0, synchronized computing
	**/
	public function new(?parent) {
		super(parent);
		smooth = true;
	}

	/**
		Sent when there is an error with the decoding or playback of the video.
	**/
	public dynamic function onError( msg : String ) {
	}

	/**
		Sent when video playback is finished.
	**/
	public dynamic function onEnd() {
	}

	@:dox(hide) @:noCompletion
	public function get_time() {
	
		return playing ? v.currentTime : 0;
	
	}

	@:dox(hide) @:noCompletion
	public inline function get_loop() {
		return loopVideo;
	}

	@:dox(hide) @:noCompletion
	public function set_loop(value : Bool) : Bool {
	
		loopVideo = value;
		if(v != null)
			v.loop = loopVideo;
		return loopVideo;

	}

	/**
		Disposes of the currently playing Video and frees GPU memory.
	**/
	public function dispose() {

		if ( v != null ) {
			v.removeEventListener("ended", endHandler, true);
			v.removeEventListener("error", errorHandler, true);
			if (!v.paused) v.pause();
			v = null;
		}
	
		if( texture != null ) {
			texture.dispose();
			texture = null;
		}
		tile = null;
		videoWidth = 0;
		videoHeight = 0;
		time = 0;
		playing = false;
		frameReady = false;
	}

	/**
		Loads and starts the video playback by specified `path` and calls `onReady` when playback becomes possible.

		* <span class="label">Hashlink</span>: Playback being immediately after `loadFile`, unless video was not being able to initialize.
		* <span class="label">JavaScript</span>: There won't be any video output until video is properly buffered enough data by the browser, in which case `onReady` is called.

		@param path The video path. Have to be valid file-system path for HL or valid URL (full or relative) for JS.
		@param onReady An optional callback signalling that video is initialized and began the video playback.
	**/
	public function loadFile( path : String, ?onReady : Void -> Void ) {
		dispose();

	
		v = js.Browser.document.createVideoElement();
		v.autoplay = true;
		v.muted = true;
		v.loop = loopVideo;

		videoPlaying = false;
		videoTimeupdate = false;
		this.onReady = onReady;

		v.addEventListener("playing", checkReady, true);
		v.addEventListener("timeupdate", checkReady, true);
		v.addEventListener("ended", endHandler, true);
		v.addEventListener("error", errorHandler, true);
		v.src = path;
		v.play();
	
		start();
		if( onReady != null ) onReady();
	}

	public function srcObject( stream:js.html.MediaStream  ) {
		dispose();

	
		v = js.Browser.document.createVideoElement();
		v.autoplay = true;
		v.muted = true;
		v.loop = loopVideo;

		videoPlaying = false;
		videoTimeupdate = false;
		//this.onReady = onReady;

		v.addEventListener("playing", checkReady, true);
		v.addEventListener("timeupdate", checkReady, true);
		v.addEventListener("ended", endHandler, true);
		v.addEventListener("error", errorHandler, true);
		v.srcObject=stream;
		trace("src",v);
		v.play();
	
		start();
		//if( onReady != null ) onReady();
	}

	/**
		Loads and starts the video playback by specified `res` and calls `onReady` when playback becomes possible.

		* <span class="label">Hashlink</span>: Playback being immediately after `loadResource`, unless video was not being able to initialize.
		* <span class="label">JavaScript</span>: Not implemented

		@param res The heaps resource of a valid video file
		@param onReady An optional callback signalling that video is initialized and began the video playback.
	**/
	public function loadResource( res : hxd.res.Resource, ?onReady : Void -> Void ) {

		onError("Video from resource not supported on this platform");
		
	}

	function start() {
		
	}



	function errorHandler(e : js.html.Event) {

		onError(v.error.code + ": " + v.error.message);
	
	}

	function endHandler(e : js.html.Event) {
		onEnd();
	}

	function checkReady(e : js.html.Event) {
		trace("e",e);
		if (e.type == "playing") {
			videoPlaying = true;
			v.removeEventListener("playing", checkReady, true);
		} else {
			videoTimeupdate = true;
			v.removeEventListener("timeupdate", checkReady, true);
		}

		if (videoPlaying && videoTimeupdate) {
			frameReady = true;
			videoWidth = v.videoWidth;
			videoHeight = v.videoHeight;
			texture = new h3d.mat.Texture(videoWidth, videoHeight);
			tile = h2d.Tile.fromTexture(texture);
			playing = true;
			playTime = haxe.Timer.stamp();
			videoTime = 0.0;
			if ( onReady != null )
			{
				onReady();
				onReady = null;
			}
			loadNextFrame();
		}
	}


	override function draw(ctx:RenderContext) {
		if( tile != null )
			ctx.drawTile(this, tile);
	}

	function loadNextFrame() {

	}


	@:access(h3d.mat.Texture)

	override function sync(ctx:RenderContext) {
		trace("playing sync " , playing);
		if( !playing )
			return;


		if( frameReady && time >= videoTime ) {
			texture.alloc();
			texture.checkSize(videoWidth, videoHeight, 0);
			@:privateAccess cast (@:privateAccess texture.mem.driver, h3d.impl.GlDriver).uploadTextureVideoElement(texture, v, 0, 0);
			texture.flags.set(WasCleared);
			texture.checkMipMapGen(0, 0);
		}
		
	}

	

    override function getBoundsRec( relativeTo : Object, out : h2d.col.Bounds, forSize : Bool ) {
        super.getBoundsRec(relativeTo, out, forSize);
        if( tile != null ) addBounds(relativeTo, out, tile.dx, tile.dy, tile.width, tile.height);
    }
}