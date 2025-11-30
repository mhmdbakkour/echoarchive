import { useRecordingStore } from "../stores/recordingStore";
import { transformRecordings } from "../utils/transformRecordings";

import SentimentTimeline from "../components/charts/sentimentTimeline";
import DurationVsSentiment from "../components/charts/durationVsSentiment";
import MoodGradient from "../components/charts/moodGradient";

import '../styles/pages/timeline.css';

export default function Timeline() {
  const recordings = useRecordingStore((s) => s.recordings);
  const data = transformRecordings(recordings);

  return (
    <div className="timeline-page">
      <h1>Your timeline</h1>
      <div className="timeline-charts">
        <div className="timeline-top">
          <SentimentTimeline data={data} />
        </div>

        <div className="timeline-lower">
          <div className="chart-col">
            <DurationVsSentiment data={data} />
          </div>
          <div className="chart-col">
            <MoodGradient data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
