package com.omaralbaladi.noorprayer;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

/** Notification channels and helpers shared by the alarm receiver and the adhan service. */
final class Notifier {
    static final String CH_PLAYBACK = "adhan_playback";   // silent: the service plays the audio itself
    static final String CH_ALERT = "prayer_alert";        // normal sound
    static final String CH_SOUND = "prayer_alert_sound";  // adhan as the notification sound (fallback)

    private Notifier() {}

    static void ensureChannels(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;

        NotificationChannel playback = new NotificationChannel(
                CH_PLAYBACK, c.getString(R.string.channel_playback), NotificationManager.IMPORTANCE_DEFAULT);
        playback.setSound(null, null);
        playback.enableVibration(false);
        nm.createNotificationChannel(playback);

        NotificationChannel alert = new NotificationChannel(
                CH_ALERT, c.getString(R.string.channel_alert), NotificationManager.IMPORTANCE_HIGH);
        nm.createNotificationChannel(alert);

        NotificationChannel sound = new NotificationChannel(
                CH_SOUND, c.getString(R.string.channel_sound), NotificationManager.IMPORTANCE_HIGH);
        int res = c.getResources().getIdentifier("adhan_makkah", "raw", c.getPackageName());
        if (res != 0) {
            Uri uri = Uri.parse("android.resource://" + c.getPackageName() + "/" + res);
            AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
            sound.setSound(uri, attrs);
        }
        nm.createNotificationChannel(sound);
    }

    static PendingIntent openApp(Context c) {
        Intent i = new Intent(c, MainActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(c, 0, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    static NotificationCompat.Builder base(Context c, String channel, String title, String body) {
        return new NotificationCompat.Builder(c, channel)
                .setSmallIcon(R.drawable.ic_stat_prayer)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setContentIntent(openApp(c));
    }

    static int idFor(String key) {
        return 3000 + ((key == null ? 0 : key.hashCode()) & 0xff);
    }

    static void show(Context c, String channel, String title, String body, String key) {
        ensureChannels(c);
        try {
            NotificationManagerCompat nm = NotificationManagerCompat.from(c);
            if (!nm.areNotificationsEnabled()) return;
            nm.notify(idFor(key), base(c, channel, title, body).build());
        } catch (SecurityException ignored) {
            // notification permission not granted
        }
    }
}
