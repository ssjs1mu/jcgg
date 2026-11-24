package app.joshiscorner.care;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Window;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** JCGG Care: thin shell around https://ssjs1mu.github.io/jcgg/care/ — the web app is always the latest release. */
public class MainActivity extends Activity {
    private static final String HOME = "https://ssjs1mu.github.io/jcgg/care/";
    private WebView web;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        Window w = getWindow();
        w.setStatusBarColor(Color.parseColor("#B23A0B"));
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMediaPlaybackRequiresUserGesture(true);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                String h = u.getHost() == null ? "" : u.getHost();
                boolean mine = "https".equals(u.getScheme()) && (h.equals("ssjs1mu.github.io") || h.endsWith("firebaseapp.com") || h.endsWith("googleapis.com") || h.endsWith("gstatic.com") || h.endsWith("google.com"));
                if (mine) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { /* no handler */ }
                return true; // wa.me, tel:, mailto: and other links open in their own apps
            }
        });
        if (b != null) web.restoreState(b); else web.loadUrl(HOME);
    }
    @Override protected void onSaveInstanceState(Bundle o) { super.onSaveInstanceState(o); web.saveState(o); }
    @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
}
