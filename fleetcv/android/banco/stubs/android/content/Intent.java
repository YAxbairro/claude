package android.content;
public class Intent {
  private final java.util.Map<String,Object> extras=new java.util.HashMap<>();
  public Intent(String a){}
  public Intent putExtra(String k, Object v){ extras.put(k,v); return this; }
  @SuppressWarnings("unchecked") public <T> T getParcelableExtra(String k){ return (T) extras.get(k); }
}
