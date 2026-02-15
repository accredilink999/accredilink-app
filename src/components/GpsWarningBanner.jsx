import { useEffect, useState } from 'react';
import { MapPin, X } from 'lucide-react';

export default function GpsWarningBanner() {
  const [gpsAvailable, setGpsAvailable] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkGps = () => {
      if (!navigator.geolocation) {
        setGpsAvailable(false);
        setChecked(true);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          setGpsAvailable(true);
          setChecked(true);
        },
        (error) => {
          if (error.code === 1 || error.code === 2) {
            setGpsAvailable(false);
          }
          setChecked(true);
        },
        { timeout: 5000 }
      );
    };

    checkGps();

    const handleVisibility = () => {
      if (!document.hidden) checkGps();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  if (!checked || gpsAvailable || dismissed) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mx-2 mb-3 flex items-start gap-3">
      <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-amber-900">GPS Not Available</p>
        <p className="text-xs text-amber-700 mt-1">
          Location services are disabled. Without GPS, fuel mileage cannot be automatically calculated.
        </p>
        <p className="text-xs text-amber-600 mt-1">
          <strong>To enable:</strong> Go to your device Settings &gt; Privacy &gt; Location Services &gt; enable for this browser/app.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-400 hover:text-amber-600 flex-shrink-0 p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
