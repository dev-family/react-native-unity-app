package com.unity3d.adaptiveperformance.samsung;

import java.io.InputStream;
import java.util.Scanner;
import android.app.Activity;

import com.samsung.android.gamesdk.GameSDKManager;
import com.unity3d.player.UnityPlayer;

public class GameLoadBooster {
    private static GameSDKManager manager = null;
    private static Boolean startupBoostEnabled = null;

    static {
        enableBoost();
    }

    public static boolean enableBoost() {
        try {
            if (!isStartupBoostEnabled())
                return false;
            if (manager == null)
                manager = new GameSDKManager();

            boolean cpuBoost = false;
            boolean gpuBoost = false;
            if(manager.getVersion().equals("3.5"))
            {
                cpuBoost = manager.setCpuBoostMode(1);
                gpuBoost = manager.setGpuBoostMode(1);
            }
            if (cpuBoost && gpuBoost)
                android.util.Log.v("Unity", "Enabled boost mode on launch");
            return cpuBoost && gpuBoost;
        } catch (Exception e) {
            return false;
        }
    }

    private static boolean isStartupBoostEnabled() {
        if (startupBoostEnabled == null)
            startupBoostEnabled = checkStartupBoostEnabled();
        return startupBoostEnabled;
    }

    private static boolean checkStartupBoostEnabled() {
        boolean boostStartup = true;
        Scanner bcLines = null;

        try {
            Activity activity = UnityPlayer.currentActivity;
            if (activity == null)
                return boostStartup;
            InputStream bootConfig = activity.getAssets().open("bin/Data/boot.config");
            bcLines = new Scanner(bootConfig);
            bcLines.useDelimiter("\n");
            while (bcLines.hasNext()) {
                String line = bcLines.next();
                if ("adaptive-performance-samsung-boost-launch=0".equals(line)) {
                    boostStartup = false;
                    break;
                }
            }

            return boostStartup;
        } catch (Exception e) {
            return boostStartup;
        } finally {
            if (bcLines != null)
                bcLines.close();
        }
    }
}
