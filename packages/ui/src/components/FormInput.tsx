type FormInputProps = {
  label: string;
  type?: "text" | "number" | "email" | "password";
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  min?: string;
  step?: string;
  disabled?: boolean;
};

export function FormInput({
  label,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder,
  min,
  step,
  disabled = false,
}: FormInputProps) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: 14 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        min={min}
        step={step}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "0.5rem",
          backgroundColor: "var(--bg-base)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-color)",
          borderRadius: "4px",
          fontSize: 14,
        }}
      />
    </div>
  );
}

type FormSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
};

export function FormSelect({ label, value, onChange, options }: FormSelectProps) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: 14 }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "0.5rem",
          backgroundColor: "var(--bg-base)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-color)",
          borderRadius: "4px",
          fontSize: 14,
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

type FormRadioGroupProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
};

export function FormRadioGroup({ label, name, value, onChange, options }: FormRadioGroupProps) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: 14 }}>
        {label}
      </label>
      <div style={{ display: "flex", gap: "1rem" }}>
        {options.map((opt) => (
          <label
            key={opt.value}
            style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}