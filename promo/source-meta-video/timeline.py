# Menyusun timeline scene dari durasi narasi, per varian hook.
#   python3 timeline.py timer|harga|pg
# s1 = hook-<varian>.wav, s2..s6 = vo/s2..s6.wav (dipakai bersama semua varian).
# Menulis timeline-<varian>.json (untuk music.py/mix.py) dan timeline-<varian>.js (untuk index.html).
import json, sys, wave

variant = sys.argv[1]
XF = 0.5          # crossfade antar scene
LEAD = 0.25       # jeda sebelum narasi mulai di tiap scene (scene 1 langsung bicara)
TAIL = 0.20       # jeda setelah narasi selesai
END_HOLD = 1.2    # tahan layar CTA setelah narasi selesai
IDS = ["s1", "s2", "s3", "s4", "s5", "s6"]
EXTRA = {"s5": 0.3}   # kartu harga butuh waktu agar terbaca


def dur(path):
    with wave.open(path) as w:
        return w.getnframes() / w.getframerate()


t = 0.0
scenes, vo = [], []
for k, sid in enumerate(IDS):
    f = f"vo/hook-{variant}.wav" if sid == "s1" else f"vo/{sid}.wav"
    d = dur(f)
    a = t
    v0 = a + (0.15 if k == 0 else LEAD)
    b = v0 + d + TAIL + EXTRA.get(sid, 0) + (END_HOLD - TAIL if k == len(IDS) - 1 else 0)
    scenes.append([sid, round(a, 3), round(b, 3)])
    vo.append([sid, round(v0, 3), round(d, 3), f])
    t = b - XF
DUR = round(scenes[-1][2], 3)

json.dump({"DUR": DUR, "XF": XF, "scenes": scenes, "vo": vo}, open(f"timeline-{variant}.json", "w"), indent=1)
open(f"timeline-{variant}.js", "w").write(
    "window.TL = " + json.dumps({"DUR": DUR, "XF": XF, "SC": scenes, "VO": vo}) + ";\n")
print(variant, "DUR", DUR)
for s, v in zip(scenes, vo):
    print(" ", s, "vo@", v[1], "+", v[2])
