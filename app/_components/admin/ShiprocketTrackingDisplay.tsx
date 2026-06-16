'use client';

import { useEffect, useState } from 'react';
import { Loader2, Truck } from 'lucide-react';

// Based on Shiprocket's API response structure
interface ShiprocketTrackingData {
  tracking_data: {
    track_status: number;
    shipment_status: number;
    shipment_track: {
      id: number;
      awb_code: string;
      current_status: string;
      etd: string;
      order_date: string;
      shipped_date: string;
      origin: string;
      destination: string;
      tracking_url: string;
    }[];
    shipment_track_activities: {
      date: string;
      status: string;
      activity: string;
      location: string;
      sr_status_label: string;
    }[];
    track_url: string;
  };
}

interface ShiprocketTrackingDisplayProps {
  awb: string;
}

const ShiprocketTrackingDisplay: React.FC<ShiprocketTrackingDisplayProps> = ({ awb }) => {
  const [trackingData, setTrackingData] = useState<ShiprocketTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrackingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/shiprocket-tracking?awb=${awb}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tracking data');
      }
      const data = await response.json();
      setTrackingData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (awb) {
      fetchTrackingData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awb]);

  if (!awb) {
    return <p className="text-sm text-zinc-500">No tracking number available yet.</p>;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <p>Loading tracking details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm">
        <p>Error: {error}</p>
        <button onClick={fetchTrackingData} className="text-blue-400 hover:underline mt-2">
          Try again
        </button>
      </div>
    );
  }

  if (!trackingData || !trackingData.tracking_data || trackingData.tracking_data.track_status === 0) {
    return (
      <div className="text-zinc-400 text-sm">
        <p>Tracking details not found for AWB: <span className="font-bold text-white">{awb}</span></p>
        <p className="text-xs text-zinc-500 mt-1">It might take some time for the tracking information to become available.</p>
      </div>
    );
  }

  const { shipment_track, shipment_track_activities, track_url } = trackingData.tracking_data;
  const currentStatus = shipment_track[0]?.current_status || 'Status Unavailable';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-zinc-400">Current Status</p>
          <p className="text-lg font-bold text-white">{currentStatus}</p>
          <p className="text-xs text-zinc-500">AWB: {awb}</p>
        </div>
        <a
          href={track_url || `<https://shiprocket.co/tracking/${awb}>`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Truck className="w-3 h-3 mr-1.5" />
          Track on Shiprocket
        </a>
      </div>

      <div className="relative pl-6">
        {shipment_track_activities.map((activity, index) => (
          <div key={index} className="relative pb-6 last:pb-0">
            {index !== shipment_track_activities.length - 1 && (
              <div className="absolute left-[3px] top-1 h-full w-0.5 bg-zinc-700"></div>
            )}
            <div className="relative flex items-start">
              <div className="h-2 w-2 rounded-full bg-zinc-500 mt-1.5 -ml-[5px] ring-4 ring-[#181818]"></div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-white">{activity.activity}</p>
                <p className="text-xs text-zinc-400">{activity.location}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{new Date(activity.date).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShiprocketTrackingDisplay;
