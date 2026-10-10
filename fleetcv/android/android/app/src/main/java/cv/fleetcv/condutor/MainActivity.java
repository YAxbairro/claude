package cv.fleetcv.condutor;

import android.os.Build;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {

    /* a página morreu com a aplicação em segundo plano: volta quando o
       condutor abrir a aplicação */
    private boolean paginaMorta = false;
    private boolean aVista = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // a peça da bateria é nossa (não vem de um módulo): regista-se à mão
        registerPlugin(BateriaPlugin.class);
        super.onCreate(savedInstanceState);
        if (getBridge() == null) return;

        WebView wv = getBridge().getWebView();
        /* A página corre num processo à parte. Por defeito, com a
           aplicação em segundo plano, esse processo passa a ser dos
           primeiros a ir abaixo quando falta memória (num Galaxy A02 é
           logo). Assim fica com a mesma importância da aplicação, que
           tem o serviço do GPS em primeiro plano. */
        if (wv != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            wv.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
        }

        /* Se mesmo assim o processo da página for abaixo, o Android
           fechava a aplicação inteira — com o serviço do GPS. Agora fica
           a aplicação (o GPS continua e o EnvioNativo manda as posições)
           e a página volta a abrir quando o condutor regressar. */
        getBridge().addWebViewListener(new WebViewListener() {
            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                paginaMorta = true;
                try {
                    ViewGroup pai = (ViewGroup) view.getParent();
                    if (pai != null) pai.removeView(view);
                    view.destroy();
                } catch (Exception ignored) { }
                if (aVista) reabrir();
                return true;
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        aVista = true;
        if (paginaMorta) reabrir();
    }

    @Override
    public void onPause() {
        aVista = false;
        super.onPause();
    }

    private void reabrir() {
        paginaMorta = false;
        runOnUiThread(this::recreate);
    }
}
