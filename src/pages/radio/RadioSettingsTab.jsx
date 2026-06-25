import React, { useRef } from 'react';
import { Upload, Check, Trash2, Volume2, VolumeX, Cpu, Wifi, Monitor, Zap, Radio, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { RADIO_THEMES } from './radioThemes';

// Sound slots wired to the module-level audio functions in TwoWayRadio.jsx
// Keys must match what playCustomSound(key) looks up in localStorage
const SOUND_SLOTS = [
  { key: 'ptt_up',           label: 'PTT Press',        desc: 'Beep-bop when you start transmitting' },
  { key: 'ptt_down',         label: 'PTT Release',      desc: 'Bop-beep when you stop transmitting' },
  { key: 'incoming',         label: 'Incoming Ring',    desc: 'Loops while an incoming call is ringing' },
  { key: 'call_connected',   label: 'Call Connected',   desc: 'Double-beep when a P2P call connects' },
  { key: 'callback_request', label: 'Call Me Back',     desc: 'Alert when someone requests a call back from you' },
  { key: 'call_end',         label: 'Call End',         desc: 'Plays when a P2P call is ended' },
];

const TETRA_SOUNDS = {
  ptt_up:           { name: 'Beep Bop.aac',  url: '/radio-tones/Beep Bop.aac' },
  ptt_down:         { name: 'Bop Beep.aac',  url: '/radio-tones/Bop Beep.aac' },
  incoming:         { name: 'Alert tone.aac', url: '/radio-tones/Alert tone.aac' },
  call_connected:   { name: 'Beep Bop.aac',  url: '/radio-tones/Beep Bop.aac' },
  callback_request: { name: 'Bop Beep.aac',  url: '/radio-tones/Bop Beep.aac' },
};

// Built-in tone packs — files served from /radio-tones/
const TONE_PRESETS = [
  {
    id: 'builtin',
    label: 'Built-in Tones',
    desc: 'Synthesised TETRA-style beeps (default)',
    sounds: null, // null = clear custom sounds, use synthesised fallback
  },
  {
    id: 'tetra',
    label: 'TETRA / Airwave',
    desc: 'Authentic TETRA radio tones',
    sounds: TETRA_SOUNDS,
  },
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
  radioTheme, setRadioTheme,
  toneVolume, setToneVolume,
  callVolume, setCallVolume,
  alerterEnabled, setAlerterEnabled,
}) {
  const saveSound = (key, file) => {
    if (!file) return;
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i)) {
      toast.error('Please select an audio file (MP3, WAV, OGG, M4A…)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target.result;
      const next = { ...customSounds, [key]: { name: file.name, url } };
      setCustomSounds(next);
      try { localStorage.setItem('radio_custom_sounds', JSON.stringify(next)); } catch {}
      toast.success(`${file.name} saved`);
      try { const a = new Audio(url); a.volume = 0.7; a.play().catch(() => {}); } catch {}
    };
    reader.readAsDataURL(file);
  };

  // File System Access API — lets user browse internal storage directly (Android WebView / Chrome)
  const browseStorage = async (key) => {
    if (window.showOpenFilePicker) {
      try {
        const [fileHandle] = await window.showOpenFilePicker({
          types: [{ description: 'Audio files', accept: { 'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.opus'] } }],
          multiple: false,
        });
        const file = await fileHandle.getFile();
        saveSound(key, file);
      } catch (e) {
        if (e.name !== 'AbortError') toast.error('Could not open file picker');
      }
    } else {
      // Fallback: trigger hidden input (standard file dialog)
      fileInputRefs.current[key]?.click();
    }
  };

  const fileInputRefs = useRef({});

  const handleSoundUpload = (key, file) => saveSound(key, file);

  const clearAllSounds = () => {
    setCustomSounds(TETRA_SOUNDS);
    try { localStorage.setItem('radio_custom_sounds', JSON.stringify(TETRA_SOUNDS)); } catch {}
    toast.success('Reset to TETRA tones');
  };

  const removeSound = (key) => {
    const next = { ...customSounds };
    delete next[key];
    setCustomSounds(next);
    try { localStorage.setItem('radio_custom_sounds', JSON.stringify(next)); } catch {}
  };

  const applyPreset = (preset) => {
    if (!preset.sounds) {
      // Built-in — clear TETRA slots but preserve any user-uploaded sounds
      const next = { ...customSounds };
      delete next.ptt_up; delete next.ptt_down; delete next.incoming; delete next.call_connected; delete next.callback_request;
      setCustomSounds(next);
      try { localStorage.setItem('radio_custom_sounds', JSON.stringify(next)); } catch {}
    } else {
      const next = { ...customSounds, ...preset.sounds };
      setCustomSounds(next);
      try { localStorage.setItem('radio_custom_sounds', JSON.stringify(next)); } catch {}
    }
    toast.success(`${preset.label} applied`);
    // Preview the PTT-up tone
    const upUrl = preset.sounds?.ptt_up?.url;
    if (upUrl) { try { new Audio(upUrl).play().catch(() => {}); } catch {} }
  };

  const activePreset = (() => {
    const up  = customSounds.ptt_up?.url;
    const dn  = customSounds.ptt_down?.url;
    const inc = customSounds.incoming?.url;
    const cc  = customSounds.call_connected?.url;
    const cbr = customSounds.callback_request?.url;
    if (up?.includes('Beep Bop') && dn?.includes('Bop Beep') && inc?.includes('Alert tone') && cc?.includes('Beep Bop') && cbr?.includes('Bop Beep')) return 'tetra';
    if (!up && !dn && !inc && !cc && !cbr) return 'builtin';
    return 'custom';
  })();

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
        <div className="flex items-center gap-3 py-2">
          <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">Tone Volume</p>
            <p className="text-slate-400 text-xs">Alert, PTT and ring tones only</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="range" min="0" max="1" step="0.05"
              value={toneVolume ?? 1}
              onChange={e => setToneVolume(parseFloat(e.target.value))}
              className="w-24 accent-teal-500"
            />
            <span className="text-slate-300 text-xs w-8 text-right">{Math.round((toneVolume ?? 1) * 100)}%</span>
          </div>
        </div>
        <div className="flex items-center gap-3 py-2">
          <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">Call Audio Volume</p>
            <p className="text-slate-400 text-xs">Voice volume during live P2P calls</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="range" min="50" max="500" step="10"
              value={callVolume ?? 200}
              onChange={e => setCallVolume(parseInt(e.target.value, 10))}
              className="w-24 accent-teal-500"
            />
            <span className="text-slate-300 text-xs w-8 text-right">{Math.round(((callVolume ?? 200) / 100) * 100)}%</span>
          </div>
        </div>
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

      {/* Preset tone packs */}
      <Section title="Tone Preset" subtitle="Choose a built-in sound pack or upload your own below">
        <div className="-mx-4 divide-y divide-slate-800">
          {TONE_PRESETS.map(preset => {
            const active = activePreset === preset.id;
            return (
              <div key={preset.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">{preset.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{preset.desc}</p>
                </div>
                <button
                  onClick={() => applyPreset(preset)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors touch-manipulation shrink-0 ${
                    active
                      ? 'border-teal-600 text-teal-400 bg-teal-950/30'
                      : 'border-slate-600 text-slate-400 hover:border-teal-700 hover:text-teal-400'
                  }`}>
                  {active && <Check className="w-3 h-3" />}
                  {active ? 'Active' : 'Apply'}
                </button>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Sound file uploads */}
      <Section
        title="Custom Sounds"
        subtitle="Override individual slots — browse device storage or upload your own file."
      >
        <div className="-mx-4 divide-y divide-slate-800">
          {SOUND_SLOTS.map(slot => {
            const has = !!customSounds[slot.key];
            return (
              <div key={slot.key} className="flex items-start gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">{slot.label}</p>
                  <p className="text-xs mt-0.5">
                    {has
                      ? <span className="text-teal-400">{customSounds[slot.key].name}</span>
                      : <span className="text-slate-500">{slot.desc}</span>}
                  </p>
                  {/* Preview button when sound is set */}
                  {has && (
                    <button onClick={() => { try { new Audio(customSounds[slot.key].url).play(); } catch {} }}
                      className="text-[10px] text-teal-600 hover:text-teal-400 mt-0.5 transition-colors">
                      ▶ Preview
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                  {has && (
                    <button onClick={() => removeSound(slot.key)}
                      className="p-1.5 text-slate-600 hover:text-red-400 transition-colors touch-manipulation">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Browse internal storage (File System Access API) */}
                  <button
                    onClick={() => browseStorage(slot.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors touch-manipulation ${
                      has
                        ? 'border-teal-700 text-teal-400 hover:border-teal-500'
                        : 'border-slate-600 text-slate-400 hover:border-slate-400'
                    }`}>
                    <Upload className="w-3.5 h-3.5" />
                    {has ? 'Replace' : 'Browse'}
                  </button>

                  {/* Hidden fallback input for browsers without File System Access */}
                  <input
                    ref={el => { fileInputRefs.current[slot.key] = el; }}
                    type="file"
                    accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.opus"
                    className="sr-only"
                    onChange={e => handleSoundUpload(slot.key, e.target.files?.[0])}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Reset all to built-in defaults */}
        {Object.keys(customSounds).length > 0 && (
          <div className="border-t border-slate-800 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-semibold">Reset to TETRA Tones</p>
              <p className="text-slate-600 text-[10px] mt-0.5">Restore the built-in TETRA / Airwave sound pack</p>
            </div>
            <button
              onClick={clearAllSounds}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-800/60 text-red-400 text-xs font-semibold hover:border-red-600 transition-colors touch-manipulation shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        )}
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

      {/* ── Radio Theme ── */}
      <Section
        title="Radio Theme"
        subtitle="Choose the colour scheme for the Radio pages."
        icon={<Palette className="w-4 h-4 text-slate-400" />}
      >
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(RADIO_THEMES).map(([key, t]) => {
            const active = radioTheme === key;
            return (
              <button key={key}
                onClick={() => { setRadioTheme(key); localStorage.setItem('radio_theme', key); toast.success(`Theme set to ${t.label}`); }}
                className={`flex items-center gap-2.5 rounded-xl p-3 border text-left transition-all touch-manipulation ${
                  active ? 'border-white/40 bg-white/10' : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                }`}
                style={active ? t.bgStyle : undefined}
              >
                <span className="text-lg leading-none">{t.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${active ? 'text-white' : 'text-slate-300'}`}>{t.label}</p>
                  {active && <p className="text-[10px] text-white/60 mt-0.5">Active</p>}
                </div>
                {active && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Alerter settings */}
      {setAlerterEnabled && (
        <Section title="Alerter" subtitle="Motorola-style pager alerts for control operators">
          <Toggle
            value={alerterEnabled}
            onChange={setAlerterEnabled}
            label="Enable Alerter"
            desc="Plays pager tone and shows alerts when staff are late or calls overrun"
          />
          <div className="text-slate-700 text-[10px] space-y-0.5 pt-1 border-t border-slate-800 mt-1">
            <p>Alert thresholds (fixed):</p>
            <p>· Late clock-in: 15 mins after shift start</p>
            <p>· Late client check-in: 15 mins after scheduled time</p>
            <p>· Call overrun: 45 mins after scheduled start</p>
          </div>
        </Section>
      )}

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
