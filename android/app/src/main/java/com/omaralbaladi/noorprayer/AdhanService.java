package com.omaralbaladi.noorprayer;

import android.app.Notification;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.ServiceCompat;

/** Foreground service that plays the full adhan audio and shows a notification with a Stop button. */
public class AdhanService extends Service {
    static final String ACTION_STOP = "com.omaralbaladi.noorprayer.STOP";
    private static final int NOTIF_ID = 1001;
    private static final long MAX_WAKE_MS = 6 * 60 * 1000L;

    private MediaPlayer player;
    private PowerManager.WakeLock wakeLock;
    private String title = "";
    private String body = "";

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        if (ACTION_STOP.equals(intent.getAction())) {
            stopPlayback();
            stopForeground(STOP_FOREGROUND_REMOVE);
            stopSelf();
            return START_NOT_STICKY;
        }

        title = intent.getStringExtra("title") == null ? "NoorPrayer" : intent.getStringExtra("title");
        body = intent.getStringExtra("body") == null ? "" : intent.getStringExtra("body");
        String voice = intent.getStringExtra("voice");
        String key = intent.getStringExtra("key");

        Notifier.ensureChannels(this);

        try {
            int type = Build.VERSION.SDK_INT >= 29 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK : 0;
            ServiceCompat.startForeground(this, NOTIF_ID, playingNotification(), type);
        } catch (Exception e) {
            Notifier.show(this, Notifier.CH_SOUND, title, body, key);
            stopSelf();
            return START_NOT_STICKY;
        }

        acquireWakeLock();
        if (!startPlayback(voice)) finishPlayback();
        return START_NOT_STICKY;
    }

    private Notification playingNotification() {
        Intent stop = new Intent(this, AdhanService.class);
        stop.setAction(ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(this, 1, stop,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        return Notifier.base(this, Notifier.CH_PLAYBACK, title, body)
                .setOngoing(true)
                .setAutoCancel(false)
                .addAction(0, getString(R.string.stop_adhan), stopPi)
                .build();
    }

    private void acquireWakeLock() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "noorprayer:adhan");
                wakeLock.acquire(MAX_WAKE_MS);
            }
        } catch (Exception ignored) {
        }
    }

    private boolean startPlayback(String voice) {
        String name = "madinah".equals(voice) ? "adhan_madinah" : "adhan_makkah";
        int res = getResources().getIdentifier(name, "raw", getPackageName());
        if (res == 0) res = getResources().getIdentifier("adhan_makkah", "raw", getPackageName());
        if (res == 0) return false;

        try {
            AssetFileDescriptor afd = getResources().openRawResourceFd(res);
            MediaPlayer mp = new MediaPlayer();
            mp.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();
            mp.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build());
            mp.setVolume(1f, 1f);
            mp.setOnCompletionListener(m -> finishPlayback());
            mp.setOnErrorListener((m, what, extra) -> {
                finishPlayback();
                return true;
            });
            mp.prepare();
            mp.start();
            player = mp;
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private void stopPlayback() {
        if (player != null) {
            try {
                if (player.isPlaying()) player.stop();
            } catch (Exception ignored) {
            }
            try {
                player.release();
            } catch (Exception ignored) {
            }
            player = null;
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {
            }
        }
    }

    /** Audio is over: keep a normal, dismissible notification and stop the service. */
    private void finishPlayback() {
        stopPlayback();
        stopForeground(STOP_FOREGROUND_DETACH);
        try {
            Notification done = Notifier.base(this, Notifier.CH_PLAYBACK, title, body)
                    .setOngoing(false)
                    .setAutoCancel(true)
                    .build();
            NotificationManagerCompat nm = NotificationManagerCompat.from(this);
            if (nm.areNotificationsEnabled()) nm.notify(NOTIF_ID, done);
        } catch (SecurityException ignored) {
        }
        stopSelf();
    }

    @Override
    public void onDestroy() {
        stopPlayback();
        super.onDestroy();
    }
}
