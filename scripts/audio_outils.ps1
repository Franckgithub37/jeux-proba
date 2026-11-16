# Outils audio partages par generer_voix_off.ps1 et mesurer_voix_off.ps1 (a charger avec ". scripts\audio_outils.ps1").
# Mesure d'une piste (hauteur de voix, niveau, debit) et traitement (silences, niveau, vitesse sans changer la hauteur).
# Fichiers attendus : WAV mono 16 bits, comme ceux que renvoie Gemini.
if (-not ("Son" -as [type])) {
Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Collections.Generic;

public class Seg { public double Debut; public double Fin; public double F0; public double Db; }
public class Mesure {
  public double Duree; public double Parole; public double F0; public double F0bas; public double F0haut; public double Db;
  public List<Seg> Segs = new List<Seg>();
}

public static class Son {
  public static short[] Lire(string f, out int rate) {
    byte[] b = File.ReadAllBytes(f); rate = BitConverter.ToInt32(b, 24);
    int p = 12, pos = 44, len = b.Length - 44;
    while (p + 8 <= b.Length) {
      string id = System.Text.Encoding.ASCII.GetString(b, p, 4); int n = BitConverter.ToInt32(b, p + 4);
      if (id == "data") { pos = p + 8; len = Math.Min(n, b.Length - pos); break; }
      p += 8 + n + (n & 1);
    }
    short[] s = new short[len / 2]; Buffer.BlockCopy(b, pos, s, 0, s.Length * 2); return s;
  }

  public static void Ecrire(string f, short[] s, int rate) {
    using (BinaryWriter w = new BinaryWriter(File.Create(f))) {
      int n = s.Length * 2;
      w.Write(System.Text.Encoding.ASCII.GetBytes("RIFF")); w.Write(36 + n); w.Write(System.Text.Encoding.ASCII.GetBytes("WAVEfmt "));
      w.Write(16); w.Write((short)1); w.Write((short)1); w.Write(rate); w.Write(rate * 2); w.Write((short)2); w.Write((short)16);
      w.Write(System.Text.Encoding.ASCII.GetBytes("data")); w.Write(n);
      byte[] b = new byte[n]; Buffer.BlockCopy(s, 0, b, 0, n); w.Write(b);
    }
  }

  // Niveau par trame de 10 ms, puis trames "parlees" (les silences de moins de minSil secondes sont rattaches a la parole).
  static bool[] Activite(short[] x, int rate, double minSil, out double[] rms, out int hop) {
    hop = rate / 100; int n = x.Length / hop; rms = new double[n];
    for (int i = 0; i < n; i++) { double e = 0; int a = i * hop, z = Math.Min(x.Length, a + 2 * hop); for (int j = a; j < z; j++) e += (double)x[j] * x[j]; rms[i] = Math.Sqrt(e / Math.Max(1, z - a)); }
    double[] t = (double[])rms.Clone(); Array.Sort(t); double p95 = n > 0 ? t[(int)(n * 0.95)] : 0; double seuil = Math.Max(60, p95 * 0.05);
    bool[] act = new bool[n]; for (int i = 0; i < n; i++) act[i] = rms[i] > seuil;
    int trou = (int)(minSil * 100), der = -1000000;
    for (int i = 0; i < n; i++) if (act[i]) { if (i - der - 1 > 0 && i - der - 1 < trou && der >= 0) for (int j = der + 1; j < i; j++) act[j] = true; der = i; }
    int deb = -1;
    for (int i = 0; i <= n; i++) {
      bool a = i < n && act[i];
      if (a && deb < 0) deb = i;
      if (!a && deb >= 0) { if (i - deb < 6) for (int j = deb; j < i; j++) act[j] = false; deb = -1; }
    }
    return act;
  }

  static double F0Trame(short[] x, int pos, int rate) {
    int W = (int)(rate * 0.03), lmin = rate / 350, lmax = rate / 70;
    if (pos + W + lmax + 1 >= x.Length) return 0;
    double e0 = 0; for (int i = 0; i < W; i++) e0 += (double)x[pos + i] * x[pos + i];
    if (e0 <= 0) return 0;
    double[] r = new double[lmax + 2]; double best = 0; int bl = 0;
    for (int l = lmin - 1; l <= lmax + 1; l++) {
      double s = 0, e1 = 0;
      for (int i = 0; i < W; i += 2) { double a = x[pos + i], b = x[pos + i + l]; s += a * b; e1 += b * b; }
      r[l] = e1 > 0 ? 2 * s / Math.Sqrt(e0 * 2 * e1) : 0;
      if (l >= lmin && l <= lmax && r[l] > best) { best = r[l]; bl = l; }
    }
    if (best < 0.6) return 0;
    for (int l = lmin; l <= lmax; l++) if (r[l] >= 0.9 * best && r[l] >= r[l - 1] && r[l] >= r[l + 1]) return (double)rate / l;
    return (double)rate / bl;
  }

  static double Mediane(List<double> v, double q) { if (v.Count == 0) return 0; double[] t = v.ToArray(); Array.Sort(t); return t[Math.Min(t.Length - 1, (int)(t.Length * q))]; }

  public static Mesure Mesurer(short[] x, int rate) {
    Mesure m = new Mesure(); double[] rms; int hop; bool[] act = Activite(x, rate, 0.25, out rms, out hop);
    int n = act.Length; m.Duree = (double)x.Length / rate;
    List<double> tout = new List<double>(); double eTot = 0; int nTot = 0; int deb = -1;
    for (int i = 0; i <= n; i++) {
      bool a = i < n && act[i];
      if (a && deb < 0) deb = i;
      if (!a && deb >= 0) {
        Seg s = new Seg(); s.Debut = deb / 100.0; s.Fin = i / 100.0; List<double> f = new List<double>(); double e = 0; int c = 0;
        for (int j = deb; j < i; j++) { e += rms[j] * rms[j]; c++; if ((j & 1) == 0) { double v = F0Trame(x, j * hop, rate); if (v > 0) { f.Add(v); tout.Add(v); } } }
        s.F0 = Mediane(f, 0.5); s.Db = 20 * Math.Log10(Math.Max(1, Math.Sqrt(e / Math.Max(1, c))) / 32768.0);
        eTot += e; nTot += c; m.Segs.Add(s); deb = -1;
      }
    }
    m.Parole = nTot / 100.0; m.F0 = Mediane(tout, 0.5); m.F0bas = Mediane(tout, 0.1); m.F0haut = Mediane(tout, 0.9);
    m.Db = 20 * Math.Log10(Math.Max(1, Math.Sqrt(eTot / Math.Max(1, nTot))) / 32768.0);
    return m;
  }

  // Change la vitesse sans changer la hauteur de la voix (WSOLA). tempo 1.1 = 10 % plus rapide.
  public static short[] Tempo(short[] x, double tempo, int rate) {
    if (Math.Abs(tempo - 1) < 0.001) return x;
    int N = 2 * (int)(rate * 0.02), Hs = N / 2, D = (int)(rate * 0.01), pad = N + D;
    float[] xp = new float[x.Length + 2 * pad + N]; for (int i = 0; i < x.Length; i++) xp[pad + i] = x[i];
    int nOut = (int)(x.Length / tempo); float[] y = new float[nOut + 2 * N];
    double[] w = new double[N]; for (int i = 0; i < N; i++) w[i] = 0.5 - 0.5 * Math.Cos(2 * Math.PI * i / N);
    int prev = pad; for (int i = 0; i < N; i++) y[i] += (float)(w[i] * xp[prev + i]);
    for (int k = 1; ; k++) {
      int nominal = pad + (int)Math.Round(k * Hs * tempo), o = k * Hs;
      if (nominal + N + D >= xp.Length || o + N >= y.Length) break;
      int cible = prev + Hs; if (cible + N >= xp.Length) break;
      double best = double.NegativeInfinity; int bd = 0;
      for (int d = -D; d <= D; d++) { double s = 0; int a = nominal + d; for (int i = 0; i < N; i += 2) s += xp[a + i] * xp[cible + i]; if (s > best) { best = s; bd = d; } }
      int q = nominal + bd; for (int i = 0; i < N; i++) y[o + i] += (float)(w[i] * xp[q + i]);
      prev = q;
    }
    short[] r = new short[nOut]; for (int i = 0; i < nOut; i++) { float v = y[i]; r[i] = (short)Math.Max(-32768, Math.Min(32767, Math.Round(v))); }
    return r;
  }

  // Coupe les silences de debut et de fin, met chaque phrase au meme niveau (dB), applique la vitesse, puis ajoute des silences fixes.
  public static short[] Traiter(short[] x, int rate, double tempo, double cibleDb, double tete, double queue) {
    double[] rms; int hop; bool[] act = Activite(x, rate, 0.25, out rms, out hop); int n = act.Length;
    int a0 = 0; while (a0 < n && !act[a0]) a0++; int a1 = n - 1; while (a1 > a0 && !act[a1]) a1--;
    if (a0 >= n) return x;
    double cible = 32768.0 * Math.Pow(10, cibleDb / 20.0);
    double eTot = 0; int nTot = 0; for (int i = a0; i <= a1; i++) if (act[i]) { eTot += rms[i] * rms[i]; nTot++; }
    double gFichier = cible / Math.Max(1, Math.Sqrt(eTot / Math.Max(1, nTot)));
    double[] g = new double[n]; for (int i = 0; i < n; i++) g[i] = -1;
    int deb = -1;
    for (int i = a0; i <= a1 + 1; i++) {
      bool a = i <= a1 && act[i];
      if (a && deb < 0) deb = i;
      if (!a && deb >= 0) {
        double e = 0; for (int j = deb; j < i; j++) e += rms[j] * rms[j];
        double gs = cible / Math.Max(1, Math.Sqrt(e / (i - deb)));
        if (i - deb < 40) gs = gFichier;
        double lim = Math.Pow(10, 6 / 20.0); gs = Math.Max(gFichier / lim, Math.Min(gFichier * lim, gs));
        for (int j = deb; j < i; j++) g[j] = gs; deb = -1;
      }
    }
    int der = -1;
    for (int i = 0; i < n; i++) if (g[i] > 0) {
      if (der < 0) for (int j = 0; j < i; j++) g[j] = g[i];
      else if (i - der > 1) for (int j = der + 1; j < i; j++) g[j] = g[der] + (g[i] - g[der]) * (j - der) / (double)(i - der);
      der = i;
    }
    for (int j = Math.Max(0, der); j < n; j++) if (g[j] <= 0) g[j] = der >= 0 ? g[der] : gFichier;
    int marge = 6, d0 = Math.Max(0, (a0 - marge) * hop), d1 = Math.Min(x.Length, (a1 + 1 + marge) * hop);
    short[] c = new short[d1 - d0];
    for (int i = d0; i < d1; i++) {
      double pos = (double)i / hop - 0.5; int t = (int)Math.Floor(pos); double fr = pos - t;
      double ga = g[Math.Max(0, Math.Min(n - 1, t))], gb = g[Math.Max(0, Math.Min(n - 1, t + 1))];
      double v = x[i] * (ga + (gb - ga) * fr) / 32768.0, av = Math.Abs(v);
      if (av > 0.8) v = Math.Sign(v) * (0.8 + 0.19 * Math.Tanh((av - 0.8) / 0.19));
      c[i - d0] = (short)Math.Round(v * 32767);
    }
    short[] tps = Tempo(c, tempo, rate);
    int nt = (int)(tete * rate), nq = (int)(queue * rate); short[] r = new short[nt + tps.Length + nq];
    Array.Copy(tps, 0, r, nt, tps.Length); return r;
  }
}
'@
}
