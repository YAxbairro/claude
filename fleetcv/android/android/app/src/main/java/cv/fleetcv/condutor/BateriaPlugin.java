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

    private PowerManager.WakeLock trava;

    @Override
    public void load() {
        super.load();
        EnvioNativo.um(getContext()).ouvir();
    }

    /**
     * A página está viva e acabou de mandar a posição: dá ao lado nativo
     * o turno, a base e a chave, para ele continuar se ela adormecer
     * (ver EnvioNativo). Desde a 1.2.0.
     */
    @PluginMethod
    public void turno(PluginCall call) {
        EnvioNativo.um(getContext()).pagina(call.getData());
        call.resolve();
    }

    @PluginMethod
    public void fim(PluginCall call) {
        EnvioNativo.um(getContext()).fim();
        call.resolve();
    }

    /** Os pontos do percurso que o lado nativo guardou desde um instante. */
    @PluginMethod
    public void pontos(PluginCall call) {
        JSObject r = new JSObject();
        r.put("pontos", EnvioNativo.um(getContext()).pontos(
            call.getString("turno"), call.getLong("desde", 0L)));
        call.resolve(r);
    }

    @PluginMethod
    public void esquecer(PluginCall call) {
        EnvioNativo.um(getContext()).esquecer(call.getLong("ate", 0L));
        call.resolve();
    }

    @PluginMethod
    public void estado(PluginCall call) {
        JSObject r = new JSObject();
        r.put("semRestricoes", livre());
        r.put("fabricante", Build.MANUFACTURER);
        r.put("modelo", Build.MODEL);
        r.put("android", Build.VERSION.RELEASE);
        r.put("versao", versao());
        call.resolve(r);
    }

    /**
     * Durante o turno, o telemóvel não adormece por baixo do GPS. No teste
     * de 02/10 (Samsung A24, Android 16) o GPS parava 4 a 9 minutos de cada
     * vez que o ecrã apagava. Com a FleetCV livre da poupança de bateria,
     * o Android respeita esta trava; no máximo 16 horas, para um turno
     * esquecido aberto não gastar a bateria até ao fim.
     */
    @PluginMethod
    public void segurar(PluginCall call) {
        try {
            if (trava == null) {
                PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
                trava = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "FleetCV:turno");
                trava.setReferenceCounted(false);
            }
            if (!trava.isHeld()) trava.acquire(16L * 60 * 60 * 1000);
        } catch (Exception ignored) { }
        call.resolve();
    }

    @PluginMethod
    public void largar(PluginCall call) {
        soltar();
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        soltar();
        super.handleOnDestroy();
    }

    private void soltar() {
        try {
            if (trava != null && trava.isHeld()) trava.release();
        } catch (Exception ignored) { }
    }

    private String versao() {
        try {
            return getContext().getPackageManager()
                .getPackageInfo(getContext().getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "";
        }
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
