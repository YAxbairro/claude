package android.location;
public class Location {
  public double lat, lon; public float acc=-1, speed=-1; public long time;
  public Location(double la, double lo, float ac, float sp, long t){ lat=la; lon=lo; acc=ac; speed=sp; time=t; }
  public boolean hasAccuracy(){ return acc>=0; } public float getAccuracy(){ return acc; }
  public boolean hasSpeed(){ return speed>=0; } public float getSpeed(){ return speed; }
  public long getTime(){ return time; } public double getLatitude(){ return lat; } public double getLongitude(){ return lon; }
}
