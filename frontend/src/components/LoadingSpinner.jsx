import { FaSpinner } from "react-icons/fa";

export default function LoadingSpinner({ size = "text-4xl", text = "Chargement..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <FaSpinner className={`${size} text-brand-red animate-spin`} />
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}