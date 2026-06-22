import React, { useRef } from 'react';
import { Upload, Check, Trash2, Volume2, VolumeX, Cpu, Wifi, Monitor, Zap, Radio } from 'lucide-react';
import { toast } from 'sonner';

// Sound slots wired to the module-level audio functions in TwoWayRadio.jsx
// Keys must match what playCustomSound(key) looks up in localStorage
const SOUND_SLOTS = [
  { key: 'ptt_up',   label: 'PTT Press',         desc: 'Beep-bop when you start transmitting' },
  { key: 'ptt_down', label: 'PTT Release',        desc: 'Bop-beep when you stop transmitting' },
  { key: 'incoming', label: 'Incoming Ring',      desc: 'Loops while an incoming call is ringing' },
  { key: 'call_end', label: 'Call End',           desc: 'Plays when a P2P call is ended' },
];

function Toggle({ value, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold">{label}</p>
        {desc && <p className="text-slate-500 text-xs mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 touch-manipulation ${value ? 'bg-teal-600' : 'bg-slate-700'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-700">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
        {subtitle && <p className="text-slate-600 text-[10px] mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-4 py-3 space-y-3">{children}</div>
    </div>
  );
}

export default function RadioSettingsTab({
  channels,
  silentMode, setSilentMode,
  showAllAreas, setShowAllAreas,
  areaToggles, setAreaToggles,
  customSounds, setCustomSounds,
  // Hardware handset props
  pttKeyCode, keepAwake, setKeepAwake, wakeOnIncoming, setWakeOnIncoming,
  bringToFront, setBringToFront, detectingPTTKey, onDetectPTTKey, onSetPTTKey, onClearPTTKey,
  isControlDevice,
}) {
  const handleSoundUpload = (key, file) => {
    if (!file) return;
    if (!file.type.startsWith('audio/')) { toast.error('Please upload an audio file (MP3, WAV, OGG)'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target.result;
      const next = { ...customSounds, [key]: { name: file.name, url } };
      setCustomSounds(next);
      try { localStorage.setItem('radio_custom_sounds', JSON.stringify(next)); } catch {}
      toast.success(`${file.name} saved`);
      // Preview the uploaded sound
      try { const a = new Audio(url); a.volume = 0.7; a.play().catch(() => {}); } catch {}
    };
    reader.readAsDataURL(file);
  };

  const removeSound = (key) => {
    const next = { ...customSounds };
    delete next[key];
    setCustomSounds(next);
    try { localStorage.setItem('radio_custom_sounds', JSON.stringify(next)); } catch {}
  };

  const toggleArea = (areaId, enabled) => {
    const next = { ...areaToggles, [areaId]: enabled };
    setAreaToggles(next);
    try { localStorage.setItem('radio_area_toggles', JSON.stringify(next)); } catch {}
  };

  return (
    <div className="p-4 space-y-4 pb-32">
      {/* Broadcast settings */}
      <Section title="Broadcast">
        <Toggle
          value={!silentMode}
          onChange={v => { setSilentMode(!v); localStorage.setItem('radio_silent_mode', String(!v)); }}
          label="Audio Tones"
          desc="PTT beeps, ring tones and call-end sounds"
        />
        <Toggle
          value={showAllAreas}
          onChange={v => { setShowAllAreas(v); localStorage.setItem('radio_show_all_areas', String(v)); }}
          label="Show All Areas"
          desc="Display all area channels in the channel list"
        />
      </Section>

      {/* Per-area toggles */}
      {channels.length > 0 && (
        <Section title="Areas" subtitle="Show or hide individual channels">
          {channels.map(ch => (
            <Toggle
              key={ch.id}
              value={areaToggles[ch.id] !== false}
              onChange={v => toggleArea(ch.id, v)}
              label={ch.name}
              desc={null}
            />
          ))}
        </Section>
      )}

      {/* Sound file uploads */}
      <Section
        title="Custom Sounds"
        subtitle="Upload MP3 / WAV / OGG files — stored on this device. Native app will use device storage."
      >
        <div className="-mx-4 divide-y divide-slate-800">
          {SOUND_SLOTS.map(slot => {
            const has = !!customSounds[slot.key];
            return (
              <div key={slot.key} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">{slot.label}</p>
                  <p className="text-xs mt-0.5">
                    {has
                      ? <span className="text-teal-400">{customSounds[slot.key].name}</span>
                      : <span className="text-slate-500">{slot.desc}</span>}
                  </p>
                </div>

                {has && (
                  <button
                    onClick={() => removeSound(slot.key)}
                    className="p-2 text-slate-600 hover:text-red-400 transition-colors shrink-0 touch-manipulation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-colors shrink-0 touch-manipulation ${
                  has
                    ? 'border-teal-700 text-teal-400 hover:border-teal-500'
                    : 'border-slate-600 text-slate-400 hover:border-slate-400'
                }`}>
                  {has ? <Check className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                  {has ? 'Replace' : 'Upload'}
                  <input
                    type="file"
                    accept="audio/*"
                    className="sr-only"
                    onChange={e => handleSoundUpload(slot.key, e.target.files?.[0])}
                  />
                </label>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Hardware PTT key binding */}
      <Section title="Hardware PTT Button" subtitle="Inrico T320 / PoC handset — bind the physical side key">
        <div className="space-y-3">
          {pttKeyCode ? (
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">Key bound</p>
                <p className="text-teal-400 text-[11px] mt-0.5">Keycode {pttKeyCode} — hardware PTT active</p>
              </div>
              <button onClick={onClearPTTKey}
                className="px-3 py-1.5 rounded-full border border-slate-600 text-slate-400 text-xs hover:border-red-700 hover:text-red-400 transition-colors shrink-0">
                Clear
              </button>
            </div>
          ) : (
            <p className="text-slate-500 text-xs py-1">No key bound. Press Detect, then press the physical PTT button on your handset.</p>
          )}
          <button
            onClick={onDetectPTTKey}
            disabled={detectingPTTKey}
            className={`w-full py-3 rounded-xl border text-sm font-bold transition-all touch-manipulation ${
              detectingPTTKey
                ? 'border-amber-600 text-amber-300 bg-amber-950/30 animate-pulse'
                : 'border-slate-600 text-slate-300 hover:border-teal-600 hover:text-teal-400'
            }`}>
            {detectingPTTKey ? 'Waiting — press PTT button now…' : '🎮  Detect PTT Button'}
          </button>
          {!pttKeyCode && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5 space-y-1">
              <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Common key codes</p>
              {[
                { code: 280, label: 'Android KEYCODE_PTT (standard)' },
                { code: 139, label: 'KEYCODE_MENU (some Inrico)' },
                { code: 293, label: 'Custom PTT (Inrico T320)' },
              ].map(k => (
                <button key={k.code} onClick={() => onSetPTTKey(k.code)}
                  className="w-full flex items-center justify-between text-[10px] text-slate-600 hover:text-slate-400 transition-colors py-0.5">
                  <span>{k.label}</span>
                  <span className="font-mono text-slate-700">{k.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Screen control */}
      <Section title="Screen Control" subtitle="For always-on radio handset operation">
        <Toggle
          value={keepAwake}
          onChange={v => { setKeepAwake(v); localStorage.setItem('radio_keep_awake', String(v)); }}
          label="Keep Screen On"
          desc="Use Wake Lock to prevent screen timeout while Radio is open"
        />
        <Toggle
          value={wakeOnIncoming}
          onChange={v => { setWakeOnIncoming(v); localStorage.setItem('radio_wake_on_incoming', String(v)); }}
          label="Wake on Incoming Call"
          desc="Bring app to foreground on incoming PTT or P2P call (native app)"
        />
        <Toggle
          value={bringToFront}
          onChange={v => { setBringToFront(v); localStorage.setItem('radio_bring_to_front', String(v)); }}
          label="Bring to Front on PTT"
          desc="Raise app window when hardware PTT is pressed (native app)"
        />
      </Section>

      {/* Device info */}
      {isControlDevice && (
        <div className="rounded-2xl border border-teal-800/50 bg-teal-950/20 px-4 py-3 flex items-center gap-3">
          <Radio className="w-4 h-4 text-teal-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-teal-300 text-xs font-bold">Control Device Mode</p>
            <p className="text-teal-600 text-[10px] mt-0.5">This handset is registered as a control device. App restricted to Radio functions.</p>
          </div>
        </div>
      )}

      <p className="text-slate-700 text-[10px] text-center pb-2">
        All settings stored on this device · Native Android app integration ready
      </p>
    </div>
  );
}
