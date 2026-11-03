package com.omaralbaladi.noorprayer;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Keeps the list of upcoming prayer alerts (sent by the web app) and always arms ONE exact
 * alarm for the next one. When it fires, the receiver arms the next. A reboot re-arms it.
 */
final class Scheduler {
    private static final String PREFS = "noor_native";
    private static final String KEY_ROWS = "rows";
    private static final String KEY_LAST = "last_fired";
    static final String ACTION_FIRE = "com.omaralbaladi.noorprayer.PRAYER";
    private static final long LATE_GRACE_MS = 2 * 60 * 1000L;

    private Scheduler() {}

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static void save(Context c, String json) {
        prefs(c).edit().putString(KEY_ROWS, json).apply();
    }

    static JSONArray load(Context c) {
        try {
            return new JSONArray(prefs(c).getString(KEY_ROWS, "[]"));
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    static long lastFired(Context c) {
        return prefs(c).getLong(KEY_LAST, 0L);
    }

    static void setLastFired(Context c, long t) {
        prefs(c).edit().putLong(KEY_LAST, t).apply();
    }

    private static PendingIntent firePending(Context c, String rowJson) {
        Intent i = new Intent(c, AlarmReceiver.class);
        i.setAction(ACTION_FIRE);
        if (rowJson != null) i.putExtra("row", rowJson);
        return PendingIntent.getBroadcast(c, 77, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void armNext(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        long now = System.currentTimeMillis();
        long last = lastFired(c);
        JSONArray rows = load(c);
        JSONObject best = null;
        long bestT = Long.MAX_VALUE;

        for (int i = 0; i < rows.length(); i++) {
            JSONObject o = rows.optJSONObject(i);
            if (o == null) continue;
            long t = o.optLong("t", 0L);
            if (t <= last || t < now - LATE_GRACE_MS) continue;
            if (t < bestT) {
                bestT = t;
                best = o;
            }
        }

        if (best == null) {
            am.cancel(firePending(c, null));
            return;
        }

        long when = Math.max(bestT, now + 1000L);
        PendingIntent pi = firePending(c, best.toString());
        // setAlarmClock is the most reliable exact alarm: it fires in Doze and needs no special permission.
        am.setAlarmClock(new AlarmManager.AlarmClockInfo(when, Notifier.openApp(c)), pi);
    }

    static void cancelAll(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(firePending(c, null));
    }
}
