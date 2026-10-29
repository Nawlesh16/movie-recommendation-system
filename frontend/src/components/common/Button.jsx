export default function Button({ children, onClick, type = 'button', variant = 'primary', className = '' }) {
  const baseStyle = "px-4 py-2 rounded font-semibold transition-colors duration-200";
  const variants = {
    primary: "bg-primary text-white hover:bg-red-700",
    secondary: "bg-dark-700 text-white hover:bg-gray-600",
    outline: "border border-primary text-primary hover:bg-primary hover:text-white"
  };

  return (
    <button 
      type={type} 
      onClick={onClick} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}