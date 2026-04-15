// Flow Nodes mark — paths only, no background.
// Place inside a container div with `gradient-primary` class for the gradient bg.
// Simplified to 3 nodes (no top branch) so it reads clearly at small sizes.
export function FlowMonixMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      {/* Connector lines */}
      <line x1="9" y1="16" x2="11.5" y2="16" stroke="white" strokeWidth="2.2" opacity="0.75" />
      <line x1="20.5" y1="16" x2="23" y2="16" stroke="white" strokeWidth="2.2" opacity="0.75" />
      {/* Left node */}
      <circle cx="5.5" cy="16" r="3.5" fill="white" />
      {/* Center hub — ring + filled dot */}
      <circle cx="16" cy="16" r="4.8" fill="none" stroke="white" strokeWidth="2.4" />
      <circle cx="16" cy="16" r="2.1" fill="white" />
      {/* Right node */}
      <circle cx="26.5" cy="16" r="3.5" fill="white" />
    </svg>
  );
}
