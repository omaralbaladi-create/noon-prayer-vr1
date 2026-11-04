package com.omaralbaladi.noorprayer;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.view.ViewGroup;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;

import androidx.core.app.NotificationManagerCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.WebViewAssetLoader;

import org.json.JSONArray;
import org.json.JSONObject;

/** Hosts the NoorPrayer web app (bundled in assets/www) and exposes the native alarm scheduler to it. */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/assets/www/index.html";
    private static final int REQ_LOCATION = 10;
    private static final int REQ_NOTIFICATIONS = 11;
    private static final int REQ_LOCATION_START = 12;

    private WebView web;
    private AdsManager ads;
    private GeolocationPermissions.Callback geoCallback;
    private String geoOrigin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        web = new WebView(this);

        // Android 15+ draws apps edge-to-edge. Lay the screen out explicitly: web app on top, a small ad strip
        // at the bottom, both kept clear of the status bar, the navigation bar, cut-outs and the keyboard.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView()).setAppearanceLightStatusBars(false);

        final LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#0f172a"));

        final FrameLayout adStrip = new FrameLayout(this);
        adStrip.setVisibility(android.view.View.GONE);

        root.addView(web, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        root.addView(adStrip, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        setContentView(root);

        ads = new AdsManager(this, adStrip, this::notifyAdsChanged);

        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            v.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, ime.bottom));
            if (ads != null) ads.setKeyboardOpen(insets.isVisible(WindowInsetsCompat.Type.ime()));
            return WindowInsetsCompat.CONSUMED;
        });

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setGeolocationEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (Exception ignored) {
                }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (hasLocationPermission()) {
                    callback.invoke(origin, true, false);
                } else {
                    geoCallback = callback;
                    geoOrigin = origin;
                    requestPermissions(new String[]{
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION}, REQ_LOCATION);
                }
            }
        });

        web.addJavascriptInterface(new Bridge(), "NoorNative");

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else if (hasLocationPermission() || Build.VERSION.SDK_INT < 23) {
            web.loadUrl(START_URL);
        } else {
            // Ask for location BEFORE the page loads, so the page's GPS request is answered instantly
            // instead of timing out while the system dialog is on screen.
            requestPermissions(new String[]{
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION}, REQ_LOCATION_START);
        }

        ads.start();
    }

    private boolean hasLocationPermission() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private static boolean anyGranted(int[] results) {
        for (int r : results) if (r == PackageManager.PERMISSION_GRANTED) return true;
        return false;
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (web != null) web.saveState(outState);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (ads != null) ads.resume();
        notifyPermissionsChanged();
    }

    @Override
    protected void onPause() {
        if (ads != null) ads.pause();
        super.onPause();
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (ads != null) ads.destroy();
        if (web != null) {
            web.removeJavascriptInterface("NoorNative");
            web.destroy();
        }
        super.onDestroy();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == REQ_LOCATION_START) {
            // Granted or not, start the app; the page shows its own message if GPS is unavailable.
            web.loadUrl(START_URL);
        } else if (requestCode == REQ_LOCATION) {
            // "Approximate" on Android 12+ grants only the coarse permission, which is enough.
            boolean granted = anyGranted(grantResults);
            if (geoCallback != null) geoCallback.invoke(geoOrigin, granted, false);
            geoCallback = null;
            geoOrigin = null;
        } else if (requestCode == REQ_NOTIFICATIONS) {
            askBatteryExemption();
            notifyPermissionsChanged();
        }
    }

    /** Tells the page that the ad-consent state is known, so it can show or hide "Ad privacy choices". */
    private void notifyAdsChanged() {
        if (web == null) return;
        web.evaluateJavascript("window.dispatchEvent(new Event('native-ads'))", null);
    }

    private void notifyPermissionsChanged() {
        if (web == null) return;
        web.evaluateJavascript("window.dispatchEvent(new Event('native-permissions'))", null);
    }

    private boolean notificationsAllowed() {
        return NotificationManagerCompat.from(this).areNotificationsEnabled();
    }

    private boolean batteryUnrestricted() {
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        return pm != null && pm.isIgnoringBatteryOptimizations(getPackageName());
    }

    private void askPermissions() {
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIFICATIONS);
            return;
        }
        if (!notificationsAllowed()) {
            openNotificationSettings();
            return;
        }
        askBatteryExemption();
    }

    private void askBatteryExemption() {
        if (batteryUnrestricted()) return;
        try {
            startActivity(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    Uri.parse("package:" + getPackageName())));
        } catch (Exception e) {
            try {
                startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
            } catch (Exception ignored) {
            }
        }
    }

    private void openNotificationSettings() {
        try {
            Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
            i.putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName());
            startActivity(i);
        } catch (Exception ignored) {
        }
    }

    /** Methods the web app can call as window.NoorNative.xxx(). Strings only, to keep it simple. */
    private class Bridge {
        @JavascriptInterface
        public String version() {
            return "1";
        }

        /** The web app sends the next ~30 days of alerts as JSON; we arm the next alarm. */
        @JavascriptInterface
        public int schedule(String json) {
            try {
                JSONArray arr = new JSONArray(json);
                Scheduler.save(MainActivity.this, arr.toString());
                Scheduler.armNext(MainActivity.this);
                return arr.length();
            } catch (Exception e) {
                return -1;
            }
        }

        @JavascriptInterface
        public String permissions() {
            try {
                JSONObject o = new JSONObject();
                o.put("notifications", notificationsAllowed());
                o.put("battery", batteryUnrestricted());
                return o.toString();
            } catch (Exception e) {
                return "{}";
            }
        }

        @JavascriptInterface
        public void requestPermissions() {
            runOnUiThread(MainActivity.this::askPermissions);
        }

        /** Plays/shows one alert right now so the user can check sound and notification. */
        @JavascriptInterface
        public void test(String rowJson) {
            try {
                final JSONObject row = new JSONObject(rowJson);
                runOnUiThread(() -> AlarmReceiver.deliver(MainActivity.this, row));
            } catch (Exception ignored) {
            }
        }

        /** True when the user must be offered a way to change their ad choices (EEA/UK etc.). */
        @JavascriptInterface
        public boolean privacyOptionsRequired() {
            return ads != null && ads.privacyOptionsRequired();
        }

        @JavascriptInterface
        public void showPrivacyOptions() {
            runOnUiThread(() -> {
                if (ads != null) ads.showPrivacyOptions();
            });
        }

        @JavascriptInterface
        public void stopAdhan() {
            Intent i = new Intent(MainActivity.this, AdhanService.class);
            i.setAction(AdhanService.ACTION_STOP);
            try {
                startService(i);
            } catch (Exception ignored) {
            }
        }

        @JavascriptInterface
        public void openNotificationSettings() {
            runOnUiThread(MainActivity.this::openNotificationSettings);
        }
    }
}
