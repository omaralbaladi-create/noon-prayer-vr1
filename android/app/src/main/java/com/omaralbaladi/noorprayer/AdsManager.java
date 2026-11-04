package com.omaralbaladi.noorprayer;

import android.app.Activity;
import android.util.DisplayMetrics;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

/**
 * One small banner at the bottom of the main screen, shown only after the user's ad consent is settled.
 *
 * Order matters (Google's rules): ask for consent first (the EEA/UK message is configured in AdMob),
 * and only when canRequestAds() is true start the ads SDK and request an ad.
 * Ads live only in the main screen. The adhan service and notifications never show ads.
 */
final class AdsManager {
    private final Activity activity;
    private final FrameLayout container;
    private final Runnable onConsentChecked;
    private final ConsentInformation consent;

    private AdView adView;
    private boolean sdkStarted = false;
    private boolean bannerRequested = false;
    private boolean adLoaded = false;
    private boolean keyboardOpen = false;

    AdsManager(Activity activity, FrameLayout container, Runnable onConsentChecked) {
        this.activity = activity;
        this.container = container;
        this.onConsentChecked = onConsentChecked;
        this.consent = UserMessagingPlatform.getConsentInformation(activity);
    }

    /** Call on every launch: refresh consent info, show the form if one is required, then start ads. */
    void start() {
        // If consent was already gathered in an earlier session, ads can start right away.
        startAdsIfAllowed();

        ConsentRequestParameters params = new ConsentRequestParameters.Builder().build();
        consent.requestConsentInfoUpdate(
                activity,
                params,
                () -> UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity, formError -> afterConsent()),
                requestError -> afterConsent());
    }

    private void afterConsent() {
        if (activity.isFinishing() || activity.isDestroyed()) return;
        startAdsIfAllowed();
        if (onConsentChecked != null) onConsentChecked.run();
    }

    private void startAdsIfAllowed() {
        if (!consent.canRequestAds() || sdkStarted) {
            if (sdkStarted) requestBanner();
            return;
        }
        sdkStarted = true;
        // Google asks for SDK start-up on a background thread.
        new Thread(() -> {
            MobileAds.initialize(activity.getApplicationContext(), status -> {});
            activity.runOnUiThread(this::requestBanner);
        }).start();
    }

    private void requestBanner() {
        if (bannerRequested || activity.isFinishing() || activity.isDestroyed()) return;
        bannerRequested = true;

        DisplayMetrics dm = activity.getResources().getDisplayMetrics();
        int widthDp = Math.round(dm.widthPixels / dm.density);

        adView = new AdView(activity);
        adView.setAdUnitId(BuildConfig.ADMOB_BANNER_ID);
        adView.setAdSize(AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(activity, widthDp));
        adView.setAdListener(new AdListener() {
            @Override
            public void onAdLoaded() {
                adLoaded = true;
                updateVisibility();
            }

            @Override
            public void onAdFailedToLoad(LoadAdError error) {
                adLoaded = false;
                updateVisibility();
            }
        });

        container.removeAllViews();
        container.addView(adView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT,
                android.view.Gravity.CENTER_HORIZONTAL));
        adView.loadAd(new AdRequest.Builder().build());
    }

    /** The strip stays hidden until an ad has really loaded, and while the keyboard is open. */
    void setKeyboardOpen(boolean open) {
        keyboardOpen = open;
        updateVisibility();
    }

    private void updateVisibility() {
        container.setVisibility(adLoaded && !keyboardOpen ? View.VISIBLE : View.GONE);
    }

    boolean privacyOptionsRequired() {
        return consent.getPrivacyOptionsRequirementStatus()
                == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED;
    }

    void showPrivacyOptions() {
        UserMessagingPlatform.showPrivacyOptionsForm(activity, formError -> afterConsent());
    }

    void pause() {
        if (adView != null) adView.pause();
    }

    void resume() {
        if (adView != null) adView.resume();
    }

    void destroy() {
        if (adView != null) {
            container.removeView(adView);
            adView.destroy();
            adView = null;
        }
    }
}
