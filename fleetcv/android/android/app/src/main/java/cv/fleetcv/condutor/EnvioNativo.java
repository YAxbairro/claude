package cv.fleetcv.condutor;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.location.Location;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * O GPS do turno sem depender da página.
 *
 * O GPS vem de um serviço do Android (o módulo background-geolocation),
 * mas quem mandava as posições para a base era a página dentro da
 * aplicação. No teste de 10/10 (Samsung Galaxy A02, Android 11, pouca
 * memória) as posições pararam 2 a 3 minutos depois de a aplicação ir
 * para segundo plano: o Android adormece ou mata a página, e com ela o
 * envio.
 *
 * Isto ouve as mesmas posições que o serviço dá à página, e:
 *  · guarda os pontos do percurso num ficheiro, para a página os juntar
 *    ao turno quando voltar (o percurso e os km ficam sem buracos);
 *  · se a página estiver calada há mais de 20 s, manda ela própria a
 *    posição ao vivo para a base, com o mesmo formato que a página
 *    manda, para o patrão continuar a ver o carro a andar.
 *
 * A página dá-lhe, a cada envio dela, o turno, o endereço da base e a
 * chave de acesso da sessão (que dura uma hora; a página renova-a
 * sempre que está viva).
 */
final class EnvioNativo {

    static final String ACCAO_GPS =
        "com.equimaps.capacitor_background_geolocation.broadcast";

    private static EnvioNativo um;

    static synchronized EnvioNativo um(Context c) {
        if (um == null) um = new EnvioNativo(c.getApplicationContext());
        return um;
    }

    /* as mesmas regras da página (painel_condutor.html) */
    private static final double PRECISAO_ACEITE = 120;   // aceitarGps
    private static final double PASSO_M = 20;            // guardarPonto
    private static final long PASSO_MS = 30000;
    private static final long CALADA_MS = 20000;         // a página calada há tanto: manda-se daqui
    private static final long RITMO_MEXER = 4000;
    private static final long RITMO_PARADO = 12000;
    private static final int CAUDA = 40;

    private final Context ctx;
    private final ExecutorService rede = Executors.newSingleThreadExecutor();
    private boolean aOuvir = false;

    /* o que a página dá */
    private String url, chave, token, frota, turno;
    private JSONObject corpo;
    private long batidaPagina = 0;
    private double precisaoMax = 50, velMax = 180;

    /* o que se juntou desde a última vez que a página falou */
    private JSONArray base = new JSONArray();
    private int baseDesde = 0;
    private double kmBase = 0, kmNovos = 0;
    private final List<double[]> novos = new ArrayList<>();
    private double[] ultimoGuardado, ultimoValido, ultimoFicheiro, ondeEnviado;
    private long ultimaSubida = 0;
    private boolean aEnviar = false;
    private int falhas = 0;

    private EnvioNativo(Context c) { ctx = c; }

    /** Ouve as posições do serviço do GPS, uma vez por processo. */
    synchronized void ouvir() {
        if (aOuvir) return;
        aOuvir = true;
        LocalBroadcastManager.getInstance(ctx).registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                Location l = intent.getParcelableExtra("location");
                if (l != null) ponto(l);
            }
        }, new IntentFilter(ACCAO_GPS));
    }

    /** A página está viva e acabou de mandar a posição dela. */
    synchronized void pagina(JSONObject o) {
        String id = o.optString("id", null);
        if (id == null) return;
        if (!id.equals(turno)) {
            /* turno novo: o ficheiro do anterior já não serve */
            apagarFicheiros();
            ultimoFicheiro = null;
        }
        turno = id;
        url = o.optString("url", url);
        chave = o.optString("chave", chave);
        String t = o.optString("token", null);
        if (t != null && !t.isEmpty()) token = t;
        frota = o.optString("frota", frota);
        precisaoMax = o.optDouble("precisaoMax", precisaoMax);
        velMax = o.optDouble("velMax", velMax);
        JSONObject c = o.optJSONObject("corpo");
        if (c != null) {
            corpo = c;
            base = c.optJSONArray("rasto");
            if (base == null) base = new JSONArray();
            baseDesde = c.optInt("caudaDesde", 0);
            kmBase = c.optDouble("kmGps", 0);
            if (Double.isNaN(kmBase)) kmBase = 0;
            kmNovos = 0;
            novos.clear();
            ultimoGuardado = base.length() > 0 ? ponto(base.optJSONArray(base.length() - 1)) : null;
            ultimoValido = null;
            for (int i = base.length() - 1; i >= 0; i--) {
                double[] x = ponto(base.optJSONArray(i));
                if (x != null && x[3] <= precisaoMax) { ultimoValido = x; break; }
            }
        }
        batidaPagina = System.currentTimeMillis();
        falhas = 0;
    }

    /** O turno fechou: não se guarda nem se manda mais nada. */
    synchronized void fim() {
        turno = null; token = null; corpo = null;
        novos.clear();
        apagarFicheiros();
        ultimoFicheiro = null;
    }

    /** Os pontos guardados no ficheiro, depois de um instante. */
    synchronized JSONArray pontos(String id, long desde) {
        JSONArray r = new JSONArray();
        if (id == null || !id.equals(turno)) return r;
        File f = ficheiro();
        if (!f.exists()) return r;
        try (BufferedReader b = new BufferedReader(new FileReader(f))) {
            String linha;
            while ((linha = b.readLine()) != null) {
                try {
                    JSONArray x = new JSONArray(linha);
                    if (x.optLong(2) > desde) r.put(x);
                } catch (Exception ignored) { }
            }
        } catch (Exception ignored) { }
        return r;
    }

    /** A página já juntou estes: o ficheiro fica só com os depois. */
    synchronized void esquecer(long ate) {
        if (turno == null) return;
        JSONArray resto = pontos(turno, ate);
        File f = ficheiro();
        try (FileWriter w = new FileWriter(f, false)) {
            for (int i = 0; i < resto.length(); i++) w.write(resto.optJSONArray(i).toString() + "\n");
        } catch (Exception ignored) { }
    }

    /* ─── cada posição do GPS ─────────────────────────────── */
    private synchronized void ponto(Location l) {
        if (turno == null) return;
        double acc = l.hasAccuracy() ? l.getAccuracy() : 999;
        if (acc > PRECISAO_ACEITE) return;
        double kmh = l.hasSpeed() && l.getSpeed() >= 0 ? l.getSpeed() * 3.6 : 0;
        double[] x = {
            Math.round(l.getLatitude() * 1e6) / 1e6,
            Math.round(l.getLongitude() * 1e6) / 1e6,
            l.getTime() > 0 ? l.getTime() : System.currentTimeMillis(),
            Math.round(acc), Math.round(kmh)
        };

        /* para o ficheiro (a página junta-os ao percurso quando voltar) */
        if (fica(ultimoFicheiro, x)) {
            ultimoFicheiro = x;
            try (FileWriter w = new FileWriter(ficheiro(), true)) {
                w.write(texto(x).toString() + "\n");
            } catch (Exception ignored) { }
        }

        long agora = System.currentTimeMillis();
        if (corpo == null) return;
        if (fica(ultimoGuardado, x)) {
            /* os km, como a página os conta (kmRasto) */
            if (x[3] <= precisaoMax) {
                if (ultimoValido != null) {
                    double s = (x[2] - ultimoValido[2]) / 1000.0;
                    double d = dist(ultimoValido, x);
                    if (s > 0 && (d / s) * 3.6 <= velMax) kmNovos += d / 1000.0;
                }
                ultimoValido = x;
            }
            novos.add(x);
            ultimoGuardado = x;
        }

        /* a página está viva: é ela que manda */
        if (agora - batidaPagina < CALADA_MS) return;
        if (token == null || url == null || aEnviar) return;
        boolean mexeu = ondeEnviado == null || dist(ondeEnviado, x) > 13 || x[4] > 3;
        if (agora - ultimaSubida < (mexeu ? RITMO_MEXER : RITMO_PARADO)) return;
        enviar(x, agora);
    }

    private void enviar(double[] x, long agora) {
        try {
            JSONObject c = new JSONObject(corpo.toString());
            JSONArray todos = new JSONArray();
            for (int i = 0; i < base.length(); i++) todos.put(base.get(i));
            for (double[] n : novos) todos.put(texto(n));
            int total = baseDesde + todos.length();
            JSONArray cauda = new JSONArray();
            for (int i = Math.max(0, todos.length() - CAUDA); i < todos.length(); i++) cauda.put(todos.get(i));
            c.put("lat", x[0]); c.put("lon", x[1]);
            c.put("precisao", (long) x[3]); c.put("vel", (long) x[4]);
            c.put("kmGps", Math.round((kmBase + kmNovos) * 100) / 100.0);
            c.put("rasto", cauda);
            c.put("caudaDesde", total - cauda.length());
            c.put("nPontos", total);
            c.put("caudaParcial", true);
            c.put("fora", false);
            c.put("nativo", true);
            c.put("momento", agora);

            JSONObject linha = new JSONObject();
            linha.put("coleccao", "vivo");
            linha.put("id", turno);
            linha.put("corpo", c);
            linha.put("quando", iso(agora));
            if (frota != null) linha.put("frota", frota);

            final String corpoPedido = linha.toString();
            final String endereco = url.replaceAll("/+$", "") + "/rest/v1/docs?on_conflict=frota,coleccao,id";
            final String k = chave, t = token;
            aEnviar = true;
            ultimaSubida = agora;
            ondeEnviado = x;
            rede.execute(() -> {
                int estado = 0;
                try {
                    HttpURLConnection h = (HttpURLConnection) new URL(endereco).openConnection();
                    h.setConnectTimeout(15000);
                    h.setReadTimeout(15000);
                    h.setRequestMethod("POST");
                    h.setDoOutput(true);
                    h.setRequestProperty("apikey", k);
                    h.setRequestProperty("Authorization", "Bearer " + t);
                    h.setRequestProperty("Content-Type", "application/json");
                    h.setRequestProperty("Prefer", "resolution=merge-duplicates,return=minimal");
                    try (OutputStream o = h.getOutputStream()) {
                        o.write(corpoPedido.getBytes(StandardCharsets.UTF_8));
                    }
                    estado = h.getResponseCode();
                    h.disconnect();
                } catch (Exception ignored) { }
                acabou(estado, t);
            });
        } catch (Exception e) {
            aEnviar = false;
        }
    }

    private synchronized void acabou(int estado, String tokenUsado) {
        aEnviar = false;
        if (estado >= 200 && estado < 300) { falhas = 0; return; }
        /* a chave caducou (a página não voltou numa hora): pára-se de
           mandar até ela voltar e dar outra; o ficheiro continua */
        if ((estado == 401 || estado == 403) && tokenUsado != null && tokenUsado.equals(token)) token = null;
        /* sem rede: tenta-se outra vez no ponto seguinte, mas mais devagar */
        falhas++;
        ultimaSubida = System.currentTimeMillis() + Math.min(60000, falhas * 5000L);
    }

    /* ─── pequenas ajudas ─────────────────────────────────── */
    private boolean fica(double[] u, double[] x) {
        if (u == null) return true;
        return x[2] - u[2] >= PASSO_MS || dist(u, x) >= Math.max(PASSO_M, x[3]);
    }

    private static double dist(double[] a, double[] b) {
        double R = 6371000, g = Math.PI / 180;
        double s1 = Math.sin((b[0] - a[0]) * g / 2), s2 = Math.sin((b[1] - a[1]) * g / 2);
        return 2 * R * Math.asin(Math.sqrt(s1 * s1 + Math.cos(a[0] * g) * Math.cos(b[0] * g) * s2 * s2));
    }

    private static double[] ponto(JSONArray a) {
        if (a == null || a.length() < 4) return null;
        return new double[]{a.optDouble(0), a.optDouble(1), a.optDouble(2),
            a.isNull(3) ? 999 : a.optDouble(3), a.optDouble(4, 0)};
    }

    private static JSONArray texto(double[] x) {
        JSONArray a = new JSONArray();
        try {
            a.put(x[0]); a.put(x[1]); a.put((long) x[2]); a.put((long) x[3]); a.put((long) x[4]);
        } catch (Exception ignored) { }
        return a;
    }

    private static String iso(long t) {
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        f.setTimeZone(TimeZone.getTimeZone("UTC"));
        return f.format(new Date(t));
    }

    private File pasta() {
        File d = new File(ctx.getFilesDir(), "turno-gps");
        if (!d.exists()) d.mkdirs();
        return d;
    }

    private File ficheiro() { return new File(pasta(), turno + ".txt"); }

    private void apagarFicheiros() {
        File[] fs = pasta().listFiles();
        if (fs != null) for (File f : fs) f.delete();
    }
}
