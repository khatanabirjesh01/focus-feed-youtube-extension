# Keep JavascriptInterface methods for WebView bridge
-keepclassmembers class com.focusfeed.app.FocusFeedJsBridge {
    @android.webkit.JavascriptInterface <methods>;
}
