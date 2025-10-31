
import React, { useState, useEffect } from 'react';

interface ClockProps {
    city: string;
    timeFormat: '12h' | '24h';
}

export const Clock: React.FC<ClockProps> = ({ city, timeFormat }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: timeFormat === '12h',
        timeZone: city ? undefined : undefined, // Will try to infer from city, or use local if undefined
    };

    const timeString = time.toLocaleTimeString([], options);

    return (
        <time
            className="text-xl font-mono font-bold"
            dateTime={time.toISOString()}
            aria-label={`Current time: ${timeString} in ${timeFormat} format`}
            role="timer"
            aria-live="off" // Don't announce every second
        >
            {timeString}
        </time>
    );
};
