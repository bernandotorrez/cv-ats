# Menyusun narasi (vo/s*.wav) sesuai timeline.json lalu mencampurnya dengan musik.
# Musik otomatis "ducking" (mengecil) saat narasi berbicara.
#
# usage: python3 mix.py music.wav out_mix.wav timeline-<varian>.json
import sys, json
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, resample_poly

SR = 44100
TL = json.load(open(sys.argv[3]))
N = int(TL['DUR'] * SR)


def load(p):
    sr, x = wavfile.read(p)
    x = x.astype(np.float64) / (32768.0 if x.dtype == np.int16 else 1.0)
    if sr != SR:
        x = resample_poly(x, SR, sr, axis=0)
    return x


def filt(x, kind, f, order=2):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output='sos'), x, axis=0)


# ---- narasi ----
vo = np.zeros(N)
for sid, t0, _, vofile in TL['vo']:
    x = load(vofile)
    if x.ndim > 1:
        x = x.mean(1)
    # samakan kerasnya tiap kalimat (RMS bagian bersuara), bukan puncaknya
    voiced = x[np.abs(x) > 0.02 * np.max(np.abs(x))]
    x = x * (0.12 / (np.sqrt((voiced ** 2).mean()) + 1e-9))
    i = int(t0 * SR)
    vo[i:i + len(x)] += x[: N - i]
vo = filt(vo, 'highpass', 80)
# sedikit "hangat" + presence agar suara jelas di HP
vo = vo + 0.18 * filt(vo, 'bandpass', [2500, 5500]) + 0.10 * filt(vo, 'lowpass', 300)
# kompresi lembut (soft-knee) supaya volume narasi rata
env = np.sqrt(filt(vo ** 2, 'lowpass', 12) .clip(0))
gain = np.minimum(1.0, (0.35 / (env + 1e-6)) ** 0.35)
vo = vo * gain
vo /= np.max(np.abs(vo)) + 1e-9

# ---- ducking musik ----
act = np.zeros(N)
for sid, t0, d, _ in TL['vo']:
    a, b = int((t0 - .35) * SR), int((t0 + d + .25) * SR)
    act[max(a, 0):b] = 1
# haluskan (attack ±0,35 s, release ±0,6 s)
k = int(.5 * SR)
win = np.hanning(k); win /= win.sum()
act = np.convolve(act, win, mode='same')
duck = 1.0 - 0.62 * act          # ≈ -8,4 dB saat narasi

music = load(sys.argv[1])
if music.ndim == 1:
    music = np.stack([music, music], 1)
music = music[:N]
if len(music) < N:
    music = np.pad(music, ((0, N - len(music)), (0, 0)))

mix = music * 0.55 * duck[:, None] + vo[:, None] * 0.80
mix /= np.max(np.abs(mix)) * 1.12
wavfile.write(sys.argv[2], SR, (mix * 32767).astype(np.int16))
print('wrote', sys.argv[2], f'{N / SR:.2f}s')
