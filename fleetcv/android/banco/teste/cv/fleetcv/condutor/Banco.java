package cv.fleetcv.condutor;

import android.content.Context;
import android.content.Intent;
import android.location.Location;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import com.sun.net.httpserver.HttpServer;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

/* Banco de ensaio do EnvioNativo, fora do Android: uma base de mentira
   (servidor HTTP local) e posições de GPS entregues como o serviço as
   entrega. */
public class Banco {
    static int ok = 0, falhas = 0;
    static void ok(String n, boolean c, Object x) {
        System.out.println((c ? " ok   · " : "FALHA · ") + n + (x != null ? "  → " + x : ""));
        if (c) ok++; else falhas++;
    }

    static final List<String[]> pedidos = new ArrayList<>();
    static volatile int responder = 201;

    public static void main(String[] a) throws Exception {
        HttpServer srv = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        srv.createContext("/", t -> {
            String corpo = new String(t.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            synchronized (pedidos) {
                pedidos.add(new String[]{t.getRequestMethod(), t.getRequestURI().toString(),
                    t.getRequestHeaders().getFirst("apikey"), t.getRequestHeaders().getFirst("Authorization"),
                    t.getRequestHeaders().getFirst("Prefer"), corpo});
            }
            t.sendResponseHeaders(responder, -1);
            t.close();
        });
        srv.start();
        String url = "http://127.0.0.1:" + srv.getAddress().getPort();

        File dir = Files.createTempDirectory("banco").toFile();
        Context ctx = new Context() {
            public Context getApplicationContext() { return this; }
            public File getFilesDir() { return dir; }
        };
        EnvioNativo e = EnvioNativo.um(ctx);
        e.ouvir();
        e.ouvir();
        ok("ouve o serviço do GPS uma vez só (mesmo chamado duas vezes)",
           LocalBroadcastManager.receptores.size() == 1, LocalBroadcastManager.receptores.size());

        long T = System.currentTimeMillis() - 60000;
        /* antes de a página dar o turno: não guarda nada */
        gps(ctx, 14.9200, -23.5100, 5, 8, T - 5000);
        ok("sem turno, não guarda nem manda nada", e.pontos("t1", 0).length() == 0 && pedidos.isEmpty(), null);

        JSONObject corpo = new JSONObject()
            .put("id", "t1").put("matricula", "ST-DA-40").put("condutor", "Veiga")
            .put("lat", 14.92).put("lon", -23.51).put("kmGps", 1.5)
            .put("rasto", new JSONArray().put(new JSONArray("[14.92,-23.51," + T + ",5,30]")))
            .put("caudaDesde", 10).put("nPontos", 11).put("momento", T);
        JSONObject cfg = new JSONObject().put("id", "t1").put("url", url).put("chave", "anon-x")
            .put("token", "jwt-1").put("frota", "f9").put("corpo", corpo)
            .put("precisaoMax", 50).put("velMax", 180);
        e.pagina(cfg);

        /* a página está viva: o lado nativo guarda, mas não manda */
        gps(ctx, 14.9209, -23.5100, 5, 36, T + 10000);   // 100 m, 10 s: 36 km/h
        Thread.sleep(300);
        ok("com a página viva, guarda o ponto mas não manda (é ela que manda)",
           e.pontos("t1", 0).length() == 1 && pedidos.isEmpty(), e.pontos("t1", 0));

        /* a página adormece (calada há mais de 20 s) */
        calar(e);
        gps(ctx, 14.9218, -23.5100, 6, 36, T + 20000);
        esperar(1);
        String[] p = pedidos.get(0);
        JSONObject linha = new JSONObject(p[5]);
        JSONObject c = linha.getJSONObject("corpo");
        ok("com a página calada, manda a posição para a base", pedidos.size() == 1, pedidos.size());
        ok("no endereço e com os cabeçalhos do supabase-js (upsert)",
           p[0].equals("POST") && p[1].equals("/rest/v1/docs?on_conflict=frota,coleccao,id") &&
           "anon-x".equals(p[2]) && "Bearer jwt-1".equals(p[3]) && p[4].contains("resolution=merge-duplicates"),
           p[1] + " · " + p[3] + " · " + p[4]);
        ok("a linha certa: vivo, do turno, da frota", "vivo".equals(linha.optString("coleccao")) &&
           "t1".equals(linha.optString("id")) && "f9".equals(linha.optString("frota")) && linha.has("quando"), null);
        ok("com a posição nova", Math.abs(c.getDouble("lat") - 14.9218) < 1e-9 && c.getLong("vel") == 36 &&
           c.getLong("precisao") == 6, c.getDouble("lat"));
        ok("e o resto do turno como a página o deu (matrícula, condutor)",
           "ST-DA-40".equals(c.optString("matricula")) && "Veiga".equals(c.optString("condutor")), null);
        ok("marcado como vindo do lado nativo, e não 'fora da aplicação'",
           c.optBoolean("nativo") && !c.optBoolean("fora"), null);
        JSONArray r = c.getJSONArray("rasto");
        ok("o percurso cose-se à cauda que o patrão já tem (caudaParcial, caudaDesde, nPontos)",
           c.optBoolean("caudaParcial") && r.length() == 3 && c.getInt("caudaDesde") == 10 && c.getInt("nPontos") == 13,
           "rasto " + r.length() + " · desde " + c.getInt("caudaDesde") + " · n " + c.getInt("nPontos"));
        ok("os km somam os do lado nativo (2 × 100 m)", Math.abs(c.getDouble("kmGps") - 1.7) < 0.01, c.getDouble("kmGps"));
        ok("o momento é agora (o patrão vê que está vivo)",
           System.currentTimeMillis() - c.getLong("momento") < 5000, null);

        /* não manda mais do que de 4 em 4 s a andar */
        gps(ctx, 14.9227, -23.5100, 5, 36, T + 30000);
        Thread.sleep(300);
        ok("a andar, não manda outra vez antes de 4 s", pedidos.size() == 1, pedidos.size());

        /* a chave caduca (a página não voltou numa hora) */
        recuar(e);
        responder = 401;
        gps(ctx, 14.9236, -23.5100, 5, 36, T + 40000);
        esperar(2);
        recuar(e);
        gps(ctx, 14.9245, -23.5100, 5, 36, T + 50000);
        Thread.sleep(400);
        ok("com a chave caducada (401), deixa de mandar", pedidos.size() == 2, pedidos.size());
        ok("mas continua a guardar os pontos para a página", e.pontos("t1", 0).length() >= 5, e.pontos("t1", 0).length());

        /* a página volta e dá uma chave nova (e o que ela própria já tem) */
        responder = 201;
        JSONObject corpo2 = new JSONObject(corpo.toString()).put("kmGps", 2.1).put("caudaDesde", 12)
            .put("rasto", new JSONArray().put(new JSONArray("[14.9245,-23.51," + (T + 50000) + ",5,36]")));
        e.pagina(new JSONObject(cfg.toString()).put("token", "jwt-2").put("corpo", corpo2));
        calar(e);
        gps(ctx, 14.9254, -23.5100, 5, 36, T + 60000);
        esperar(3);
        JSONObject c3 = new JSONObject(pedidos.get(2)[5]).getJSONObject("corpo");
        ok("com a chave nova, volta a mandar, a partir do que a página tinha",
           "Bearer jwt-2".equals(pedidos.get(2)[3]) && c3.getInt("caudaDesde") == 12 && c3.getInt("nPontos") == 14 &&
           Math.abs(c3.getDouble("kmGps") - 2.2) < 0.01, pedidos.get(2)[3] + " · km " + c3.getDouble("kmGps"));

        /* pontos maus: precisão pior que 120 m não contam */
        int antes = e.pontos("t1", 0).length();
        gps(ctx, 14.99, -23.6, 300, 0, T + 65000);
        ok("um ponto com 300 m de erro não entra", e.pontos("t1", 0).length() == antes, null);

        /* parado: um ponto de 30 em 30 s, e não um por segundo */
        int a0 = e.pontos("t1", 0).length();
        for (int i = 1; i <= 20; i++) gps(ctx, 14.9254, -23.5100, 5, 0, T + 60000 + i * 1000);
        ok("parado, não enche o ficheiro (um ponto por cada 30 s)", e.pontos("t1", 0).length() - a0 <= 1,
           (e.pontos("t1", 0).length() - a0) + " em 20 s");

        /* a página juntou-os: esquece até ali */
        JSONArray todos = e.pontos("t1", 0);
        long meio = todos.getJSONArray(todos.length() / 2).getLong(2);
        e.esquecer(meio);
        JSONArray depois = e.pontos("t1", 0);
        ok("esquecer deixa só os pontos depois de 'ate'",
           depois.length() > 0 && depois.getJSONArray(0).getLong(2) > meio && depois.length() < todos.length(),
           todos.length() + " → " + depois.length());
        ok("os pontos de outro turno não se dão", e.pontos("outro", 0).length() == 0, null);

        /* turno novo: o ficheiro do anterior vai-se */
        e.pagina(new JSONObject(cfg.toString()).put("id", "t2").put("corpo", new JSONObject(corpo.toString()).put("id", "t2")));
        ok("um turno novo começa com o ficheiro vazio", e.pontos("t2", 0).length() == 0, null);

        /* fecha o turno: nada mais */
        e.fim();
        int n = pedidos.size();
        calar(e);
        gps(ctx, 14.93, -23.52, 5, 36, T + 90000);
        Thread.sleep(300);
        ok("turno fechado: não guarda nem manda mais nada", pedidos.size() == n && e.pontos("t2", 0).length() == 0, null);

        srv.stop(0);
        System.out.println("\n" + ok + " de " + (ok + falhas));
        System.exit(falhas == 0 ? 0 : 1);
    }

    static void gps(Context ctx, double la, double lo, float acc, double kmh, long t) {
        Intent i = new Intent(EnvioNativo.ACCAO_GPS);
        i.putExtra("location", new Location(la, lo, acc, (float) (kmh / 3.6), t));
        i.putExtra("id", "w1");
        LocalBroadcastManager.entregar(ctx, EnvioNativo.ACCAO_GPS, i);
    }

    static void calar(EnvioNativo e) throws Exception {
        var f = EnvioNativo.class.getDeclaredField("batidaPagina");
        f.setAccessible(true);
        f.setLong(e, System.currentTimeMillis() - 30000);
    }

    /* faz de conta que já passaram uns segundos desde o último envio */
    static void recuar(EnvioNativo e) throws Exception {
        var f = EnvioNativo.class.getDeclaredField("ultimaSubida");
        f.setAccessible(true);
        f.setLong(e, 0);
    }

    static void esperar(int n) throws Exception {
        for (int i = 0; i < 50 && pedidos.size() < n; i++) Thread.sleep(100);
        Thread.sleep(200);
    }
}
