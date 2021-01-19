package com.imnirdst.iireactnativeandroidlocalnotification;

import android.app.ActivityManager;
import android.app.ActivityManager.RunningAppProcessInfo;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import java.util.List;

/**
 * Handles user's interaction on notifications.
 *
 * Sends broadcast to the application, launches the app if needed.
 */
public class NotificationEventReceiver extends BroadcastReceiver {
    final static String NOTIFICATION_ID = "id";
    final static String ACTION = "action";
    final static String PAYLOAD = "payload";

    public void onReceive(Context context, Intent intent) {
        Bundle extras = intent.getExtras();

        assert extras != null;
        Log.i("ReactSystemNotification", "NotificationEventReceiver: Received: " + extras.getString(ACTION)
                + ", Notification ID: " + extras.getInt(NOTIFICATION_ID) + ", payload: " + extras.getString(PAYLOAD));

        // If the application is not running or is not in foreground, start it with the
        // notification
        // passed in
        if (!applicationIsRunning(context)) {
            String packageName = context.getApplicationContext().getPackageName();
            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(packageName);

            assert launchIntent != null;
            launchIntent.putExtra("initialSysNotificationId", extras.getInt(NOTIFICATION_ID));
            launchIntent.putExtra("initialSysNotificationAction", extras.getString(ACTION));
            launchIntent.putExtra("initialSysNotificationPayload", extras.getString(PAYLOAD));
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);

            context.startActivity(launchIntent);
            Log.i("ReactSystemNotification", "NotificationEventReceiver: Launching: " + packageName);
        } else {
            sendBroadcast(context, extras); // If the application is already running in foreground, send a broadcast too
        }
    }

    private void sendBroadcast(Context context, Bundle extras) {
        Intent broadcastIntent = new Intent("NotificationEvent");

        broadcastIntent.putExtra("id", extras.getInt(NOTIFICATION_ID));
        broadcastIntent.putExtra("action", extras.getString(ACTION));
        broadcastIntent.putExtra("payload", extras.getString(PAYLOAD));

        context.sendBroadcast(broadcastIntent);
        Log.v("ReactSystemNotification",
                "NotificationEventReceiver: Broadcast Sent: NotificationEvent: " + extras.getString(ACTION)
                        + ", Notification ID: " + extras.getInt(NOTIFICATION_ID) + ", payload: "
                        + extras.getString(PAYLOAD));
    }

    private boolean applicationIsRunning(Context context) {
        ActivityManager activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);

        assert activityManager != null;
        List<RunningAppProcessInfo> processInfoList = activityManager.getRunningAppProcesses();
        for (RunningAppProcessInfo processInfo : processInfoList) {
            if (processInfo.processName.equals(context.getApplicationContext().getPackageName())) {
                if (processInfo.importance == RunningAppProcessInfo.IMPORTANCE_FOREGROUND) {
                    for (String d : processInfo.pkgList) {
                        Log.v("ReactSystemNotification", "NotificationEventReceiver: ok: " + d);
                        return true;
                    }
                }
            }
        }

        return false;
    }
}
