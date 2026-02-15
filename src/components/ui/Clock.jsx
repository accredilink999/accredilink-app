import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export function useClock(updateInterval = 1000) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, updateInterval);

    return () => clearInterval(timer);
  }, [updateInterval]);

  return {
    currentTime,
    formattedTime: format(currentTime, 'HH:mm:ss'),
    formattedDate: format(currentTime, 'dd MMM yyyy'),
    formattedDateTime: format(currentTime, 'dd MMM yyyy HH:mm:ss'),
    dayOfWeek: format(currentTime, 'EEEE'),
    timestamp: currentTime.getTime(),
  };
}

export default function Clock({ showSeconds = true, showDate = true, className = '' }) {
  const { formattedTime, formattedDate, dayOfWeek } = useClock(1000);

  return (
    <div className={className}>
      {showDate && (
        <div className="text-sm text-slate-600">
          {dayOfWeek}, {formattedDate}
        </div>
      )}
      <div className="text-lg font-semibold text-slate-900">
        {showSeconds ? formattedTime : formattedTime.slice(0, -3)}
      </div>
    </div>
  );
}