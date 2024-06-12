package com.unity3d;
public class JavaPluginPreloader {
    static {
        loadJavaClass(com.unity3d.adaptiveperformance.samsung.GameLoadBooster.class.getName());

    }
    private static void loadJavaClass(String name) {
        try {
            Class.forName(name);
        }
        catch (ClassNotFoundException ex) {
            android.util.Log.e("Unity", "Failed to load class", ex);
        }
        catch (LinkageError err) {
            android.util.Log.e("Unity", "Failed to load class", err);
        }
    }
}
