export function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="switch__track" aria-hidden="true">
        <span className="switch__knob" />
      </span>
      {label}
    </label>
  );
}
