package cv.fleetcv.condutor;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * A poupança de bateria do Android (e a dos Samsung e Xiaomi, mais
 * agressiva) chega a matar a aplicação em segundo plano, com serviço e
 * notificação e tudo — e o GPS do turno pára. Isto pergunta se a FleetCV
 * está livre dela e, se não estiver, pede ao condutor que a liberte.
 */
@CapacitorPlugin(name = "Bateria")
public class BateriaPlugin extends Plugin {

    @PluginMethod
    public void estado(PluginCall call) {
        JSObject r = new JSObject();
        r.put("semRestricoes", livre());
        r.put("fabricante", Build.MANUFACTURER);
        call.resolve(r);
    }

    @SuppressLint("BatteryLife")
    @PluginMethod
    public void pedir(PluginCall call) {
        Context c = getContext();
        try {
            if (!livre() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                i.setData(Uri.parse("package:" + c.getPackageName()));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                c.startActivity(i);
            }
        } catch (Exception e) {
            abrirDefinicoes(c);
        }
        call.resolve();
    }

    @PluginMethod
    public void definicoes(PluginCall call) {
        abrirDefinicoes(getContext());
        call.resolve();
    }

    private void abrirDefinicoes(Context c) {
        try {
            Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            i.setData(Uri.parse("package:" + c.getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            c.startActivity(i);
        } catch (Exception ignored) { }
    }

    private boolean livre() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        return pm != null && pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
    }
}
