package linkx;

class  Message {
    public var keynum:String;
    public var msg:String;
    public var cat:String;
}

class  Flux {
    public var keynum:String;
    public var id:String;
    public var message:String;
    public var stream:js.html.MediaStream;
    public var connected:Bool;
    public var me:Bool;
}

class  Updates {
    public var infos:Bool;
    public var medias:Bool;
    public var stream:Bool;
    public var data:Bool;
    public var flux:Bool;
    public var messages:Bool;
    public var list_flux_streams_updated:Array<String>;
    public var list_flux_datas_updated:Array<String>;
    public var list_flux_added:Array<String>;
    public var list_flux_deleted:Array<String>;
}

@:native('window.linkx') extern class Linkx {
    static var medias_cam_on:Bool;
    static var medias_mic_on:Bool;
    static var medias_cam_label:String;
    static var medias_mic_label:String;
    static var medias_show_me:Bool;
    static var medias_stream_error:String;

    static var server_message:String;
    static var my_key:String;
    static var my_stream:js.html.MediaStream;
    static var my_message:String;
   // static var my_data

   // static var flux
   static var messages:Array<Message>;

   public static dynamic function on_update():Void;
   public static function get_updates():Updates;
   public static  function stream():Void;
   public static function switch_cam():Void;
   public static function switch_mic():Void;
   public static function swap_cam():Void;
   public static function swap_mic():Void;
   public static function switch_show_me():Void;

   public static function req_hb():Void;
   public static function req_renew():Void;
   public static function req_set(v:String):Void;
   public static function req_add(v:String):Void;
   public static function req_clean(v:String):Void;
 
}



