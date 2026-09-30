package cv.fleetcv.condutor;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // a peça da bateria é nossa (não vem de um módulo): regista-se à mão
        registerPlugin(BateriaPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
