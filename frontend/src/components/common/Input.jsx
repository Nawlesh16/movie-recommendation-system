export default function Input({ label, type = 'text', name, value, onChange, placeholder, required = false }) {
  return (
    <div className="flex flex-col mb-4">
      {label && <label className="mb-1 text-sm font-medium text-gray-300">{label}</label>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="px-4 py-2 bg-dark-800 border border-dark-700 rounded text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}