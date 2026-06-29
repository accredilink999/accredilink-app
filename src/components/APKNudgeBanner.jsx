import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { X, Smartphone, Download, ChevronRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

const DISMISSED_KEY = 'apk_nudge_dismissed';
const SESSION_KEY   = 'apk_nudge_snoozed';

function isAndroidBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (!/Android/i.test(ua)) return false;                          // not Android (rules out iOS + desktop)
  if (/iPad|iPhone|iPod/.test(ua)) return false;                   // never iOS
  if (document.referrer?.startsWith('android-app://')) return false; // TWA/APK launch
  if (window.__CARECALL_NATIVE__) return false;                    // native wrapper flag
  // PWA standalone users DO see the banner — they're the upgrade target
  // Exclude desktop browsers — Android UA won't be on desktop but belt-and-braces
  if (!/Mobi|Mobile/i.test(ua)) return false;
  return true;
}

export default function APKNudgeBanner() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [apkUrl, setApkUrl] = useState(null);
  const [apkVersion, setApkVersion] = useState(null);

  useEffect(() => {
    if (!isAndroidBrowser()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'app_download_android')
      .limit(1)
      .single()
      .then(({ data }) => {
        try {
          const val = data?.setting_value
            ? (typeof data.setting_value === 'string' ? JSON.parse(data.setting_value) : data.setting_value)
            : null;
          if (val?.file_url) setApkUrl(val.file_url);
          if (val?.version)  setApkVersion(val.version);
        } catch {}
        setVisible(true);
      })
      .catch(() => setVisible(true));
  }, []);

  const dismiss = (permanent) => {
    if (permanent) localStorage.setItem(DISMISSED_KEY, '1');
    else           sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-teal-700 to-teal-600 text-white px-4 py-2.5 flex items-center gap-3 shadow-md z-50">
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        <Smartphone className="w-4 h-4 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">
          Get the CareCall AI app
          {apkVersion && <span className="text-teal-200 font-normal"> v{apkVersion}</span>}
        </p>
        <p className="text-xs text-teal-100 leading-tight mt-0.5">
          Better performance, offline support &amp; push notifications
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {apkUrl ? (
          <a
            href={apkUrl}
            download="CareCallAI.apk"
            onClick={() => dismiss(true)}
            className="flex items-center gap-1 bg-white text-teal-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        ) : (
          <button
            onClick={() => { navigate(createPageUrl('AppDownloads')); dismiss(true); }}
            className="flex items-center gap-1 bg-white text-teal-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors active:scale-95"
          >
            Get app
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => dismiss(false)}
          title="Remind me later"
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function resetAPKNudge() {
  localStorage.removeItem(DISMISSED_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
