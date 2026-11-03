package com.omaralbaladi.noorprayer;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** After a reboot, an app update or a clock/time-zone change, arm the next prayer alarm again. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            Scheduler.armNext(context);
        } catch (Exception ignored) {
        }
    }
}
