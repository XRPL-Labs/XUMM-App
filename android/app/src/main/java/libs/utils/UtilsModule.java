package libs.utils;

import java.io.File;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import android.os.Debug;
import android.content.pm.ApplicationInfo;
import android.app.Activity;
import android.view.WindowManager;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.Context;


import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;


public class UtilsModule extends ReactContextBaseJavaModule {

    protected final ReactApplicationContext reactContext;

    public UtilsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "UtilsModule";
    }


    /** @author kristiansorens */
   @ReactMethod
    public void flagSecure(Boolean enable, Promise promise) {
        final Activity activity = getCurrentActivity();

        if (activity != null) {
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if(enable){
                        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
                    }else{
                        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
                    }
                    
                }
            });
        }
    }


    /** @author jail-monkey */
   @ReactMethod
    public void isDebugged(Promise promise) {
        if (Debug.isDebuggerConnected()) {
            promise.resolve(true);
        }

        boolean isDebug = (reactContext.getApplicationContext().getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0 ;
        promise.resolve(isDebug);
    }



    /** @author Kevin Kowalewski */
    @ReactMethod
    public void isRooted(Promise promise) {
        try {
			boolean isRooted = checkRootMethod1() || checkRootMethod2() || checkRootMethod3();
			promise.resolve(isRooted);
		}
		catch (Exception e) {
			promise.reject(e);
		}
    }


    @ReactMethod
    public void restartBundle() {
           Intent mStartActivity = reactContext.getPackageManager().getLaunchIntentForPackage(reactContext.getPackageName());
        int mPendingIntentId = 123456;
        PendingIntent mPendingIntent = PendingIntent.getActivity(reactContext, mPendingIntentId,    mStartActivity, PendingIntent.FLAG_CANCEL_CURRENT);
        AlarmManager mgr = (AlarmManager)reactContext.getSystemService(Context.ALARM_SERVICE);
        mgr.set(AlarmManager.RTC, System.currentTimeMillis() + 100, mPendingIntent);
        System.exit(0);
    }

    @ReactMethod
    public void exitApp() {
        android.os.Process.killProcess(android.os.Process.myPid());
        System.exit(1);
    }

    private static boolean checkRootMethod1() {
        String buildTags = android.os.Build.TAGS;
        return buildTags != null && buildTags.contains("test-keys");
    }

    private static boolean checkRootMethod2() {
        String[] paths = { "/system/app/Superuser.apk", "/sbin/su", "/system/bin/su", "/system/xbin/su", "/data/local/xbin/su", "/data/local/bin/su", "/system/sd/xbin/su",
                "/system/bin/failsafe/su", "/data/local/su" };
        for (String path : paths) {
            if (new File(path).exists()) return true;
        }
        return false;
    }

    private static boolean checkRootMethod3() {
        Process process = null;
        try {
            process = Runtime.getRuntime().exec(new String[] { "/system/xbin/which", "su" });
            BufferedReader in = new BufferedReader(new InputStreamReader(process.getInputStream()));
            return in.readLine() != null;
        } catch (Throwable t) {
            return false;
        } finally {
            if (process != null) process.destroy();
        }
    }
}