package com.omaralbaladi.noorprayer;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import androidx.core.content.ContextCompat;

import org.json.JSONObject;

public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            String raw = intent.getStringExtra("row");
            if (raw != null) {
                JSONObject row = new JSONObject(raw);
                long t = row.optLong("t", 0L);
                if (t > Scheduler.lastFired(context)) Scheduler.setLastFired(context, t);
                deliver(context, row);
            }
        } catch (Exception ignored) {
            // never crash from a receiver
        } finally {
            Scheduler.armNext(context);
        }
    }

    /** Plays the adhan and/or shows the notification for one scheduled row. */
    static void deliver(Context c, JSONObject row) {
        String title = row.optString("title", "NoorPrayer");
        String body = row.optString("body", "");
        String voice = row.optString("voice", "makkah");
        String key = row.optString("key", "prayer");
        boolean audio = row.optBoolean("audio", false);
        boolean notify = row.optBoolean("notify", false);

        if (audio) {
            try {
                Intent i = new Intent(c, AdhanService.class);
                i.putExtra("title", title);
                i.putExtra("body", body);
                i.putExtra("voice", voice);
                i.putExtra("key", key);
                ContextCompat.startForegroundService(c, i);
            } catch (Exception e) {
                // Android refused a background audio service: fall back to a notification with the adhan as its sound.
                Notifier.show(c, Notifier.CH_SOUND, title, body, key);
            }
        } else if (notify) {
            Notifier.show(c, Notifier.CH_ALERT, title, body, key);
        }
    }
}
