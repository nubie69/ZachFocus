export default function ProgressRing({ progress }) {
  return (
    <svg className="progress-ring" viewBox="0 0 340 340" aria-hidden="true">
      <circle className="ring-track" cx="170" cy="170" r="155" />
      <circle
        className="ring-value"
        cx="170"
        cy="170"
        r="155"
        pathLength="100"
        strokeDasharray="100"
        strokeDashoffset={100 * (1 - progress)}
        transform="rotate(-90 170 170)"
      />
    </svg>
  );
}
