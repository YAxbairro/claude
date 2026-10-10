package androidx.localbroadcastmanager.content;
import android.content.*;
public class LocalBroadcastManager {
  private static final LocalBroadcastManager um=new LocalBroadcastManager();
  public static final java.util.List<Object[]> receptores=new java.util.ArrayList<>();
  public static LocalBroadcastManager getInstance(Context c){ return um; }
  public void registerReceiver(BroadcastReceiver r, IntentFilter f){ receptores.add(new Object[]{r,f}); }
  public static void entregar(Context c, String accao, Intent i){
    for(Object[] x: receptores) if(((IntentFilter)x[1]).accao.equals(accao)) ((BroadcastReceiver)x[0]).onReceive(c,i); }
}
