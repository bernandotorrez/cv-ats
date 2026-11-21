# Musik latar tenang untuk versi ber-narasi (durasi & pergantian scene dari timeline.json), 84 BPM.
# Tanpa drum/perkusi: pad hangat, piano lembut (felt), bass bulat, lonceng
# halus di pergantian scene, reverb panjang. Disintesis sendiri (bebas lisensi).
#
# usage: python3 music.py out.wav timeline-<varian>.json
import sys, json
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 44100
TLJ = json.load(open(sys.argv[2]))   # timeline-<varian>.json
DUR = TLJ['DUR']
CUTS = [a for _, a, _ in TLJ['scenes'][1:]]   # awal tiap scene (setelah scene 1)
LAST = TLJ['scenes'][-1][1]                   # awal scene CTA
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)
BEAT = 60 / 84
BAR = 4 * BEAT


def place(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or i < 0:
        return
    s = sig[: N - i] * gain
    L[i:i + len(s)] += s * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(s)] += s * np.sqrt(0.5 * (1 + pan))


def tt(d): return np.arange(int(d * SR)) / SR
def filt(x, kind, f, order=2): return sosfilt(butter(order, f, btype=kind, fs=SR, output='sos'), x)
def hz(m): return 440 * 2 ** ((m - 69) / 12)


def pad(f, d, bright=1400):
    """pad hangat: 4 osilator sedikit di-detune, attack & release panjang"""
    t = tt(d)
    s = sum(np.sin(2 * np.pi * f * k * t + j * 1.3) * w
            for j, (k, w) in enumerate(((1, 1), (1.003, .9), (.997, .9), (2.001, .35))))
    s = s / 3.2
    s = filt(s, 'lowpass', bright)
    env = np.minimum(1, t / 1.6) * np.clip((d - t) / 1.8, 0, 1)
    # gerak "napas" pelan
    return s * env * (0.85 + 0.15 * np.sin(2 * np.pi * 0.11 * t))


def felt(f, d=3.2, vel=1.0):
    """piano felt: attack lembut, harmonik redup, peluruhan panjang"""
    t = tt(d)
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t * 1.1)
         + .28 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 2.4)
         + .08 * np.sin(2 * np.pi * 3.002 * f * t) * np.exp(-t * 4.0))
    att = np.minimum(1, t / .018)
    rel = np.clip((d - t) / .6, 0, 1)
    s = filt(s * att * rel, 'lowpass', 3800)
    return s * vel


def sub(f, d):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + .15 * np.sin(2 * np.pi * 2 * f * t)
    return s * np.minimum(1, t / .25) * np.clip((d - t) / 1.2, 0, 1)


def chime(f, d=4.0):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 1.4) + .22 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3.2)
    return s * np.minimum(1, t / .004)


def air(d):
    """desir lembut (filtered noise) untuk transisi, tanpa hentakan"""
    t = tt(d); p = t / d
    n = filt(rng.standard_normal(len(t)), 'bandpass', [400, 2400])
    return n * np.sin(np.pi * p) ** 2


# ---- progresi akor (C mayor, hangat & tenang) ----
Cmaj7 = [48, 55, 59, 64]      # C G B E
Am9 = [45, 52, 55, 59]        # A E G B
Fmaj9 = [41, 48, 52, 55]      # F C E G
G6sus = [43, 50, 52, 55]      # G D E G (sus, menggantung lembut)
Em7 = [40, 47, 50, 55]        # E B D G
LOOP = [Cmaj7, Am9, Fmaj9, G6sus]

plan = []
tb = 0.0; k = 0
while tb < LAST - 0.5:
    ch = LOOP[k % 4]
    plan.append((tb, ch)); tb += BAR; k += 1
plan.append((tb, Cmaj7))      # kembali ke rumah di akhir (CTA)

for i, (t0, ch) in enumerate(plan):
    t1 = plan[i + 1][0] if i + 1 < len(plan) else DUR
    d = (t1 - t0) + 2.0
    for j, m in enumerate(ch[1:]):
        place(pad(hz(m + 12), d), t0, .055, -.35 + j * .35)
    place(pad(hz(ch[0] + 24), d, 900), t0, .03, 0)
    place(sub(hz(ch[0]), min(d, BAR + 1.2)), t0, .075)

# ---- piano: arpeggio pelan (1 not per ketukan), mulai setelah intro ----
def chord_at(t):
    cur = plan[0][1]
    for t0, ch in plan:
        if t0 <= t: cur = ch
    return cur

pattern = [0, 2, 1, 3]
beat_t = BAR * 1.0
i = 0
while beat_t < DUR - BAR:
    ch = chord_at(beat_t)
    notes = [ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[1] + 24]
    m = notes[pattern[i % 4]]
    vel = .8 if i % 4 == 0 else .55
    # variasi kecil timing & panning agar terasa dimainkan manusia
    jitter = rng.uniform(-.012, .012)
    place(felt(hz(m), 3.4, vel), beat_t + jitter, .10, -.3 + .2 * (i % 4))
    beat_t += BEAT; i += 1

# ---- intro: dua not piano tunggal yang mengambang ----
place(felt(hz(64), 4.5), 0.25, .09, -.2)
place(felt(hz(67), 4.5), 1.6, .07, .2)
place(felt(hz(71), 4.5), 2.8, .06, 0)

# ---- lonceng halus di setiap pergantian scene ----
BELLS = [84, 79, 81, 79, 84, 81, 79, 84, 81, 88]
for k, t0 in enumerate(CUTS):
    m = BELLS[k % len(BELLS)]
    place(chime(hz(m)), t0 + .3, .035, .3)
    place(air(1.6), t0 - .6, .010, -.2)

# ---- akhir: akor C lebar & lonceng penutup ----
for m in (48, 55, 60, 64, 67, 71, 76):
    place(pad(hz(m), DUR - LAST + 1.0, 1800), LAST + .3, .045)
for j, m in enumerate((72, 76, 79, 84)):
    place(chime(hz(m), 4.5), LAST + .6 + j * .32, .028, -.4 + j * .27)

# ---- reverb hall panjang (stereo terdekorelasi) ----
ir_t = tt(3.2)
irs = []
for _ in range(2):
    ir = filt(rng.standard_normal(len(ir_t)), 'lowpass', 4200) * np.exp(-ir_t * 1.6)
    ir[: int(.02 * SR)] *= np.linspace(0, 1, int(.02 * SR))
    irs.append(ir / np.sqrt(np.sum(ir ** 2)))
wetL = fftconvolve(L, irs[0])[:N]
wetR = fftconvolve(R, irs[1])[:N]
mix = np.stack([L + .42 * wetL, R + .42 * wetR], 1)
mix = filt(mix.T, 'highpass', 35).T
mix = np.tanh(mix * 1.02)
mix /= np.max(np.abs(mix)) * 1.35   # headroom ≈ -2.6 dBFS
fi = int(1.2 * SR); mix[:fi] *= (np.linspace(0, 1, fi) ** 2)[:, None]
fo = int(3.0 * SR); mix[-fo:] *= (np.linspace(1, 0, fo) ** 1.8)[:, None]
wavfile.write(sys.argv[1], SR, (mix * 32767).astype(np.int16))
print('wrote', sys.argv[1])
