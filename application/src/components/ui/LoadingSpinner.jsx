import BRAND from "../../constants/brand";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${BRAND.accent} transparent transparent transparent` }} />
    </div>
  );
}

export default LoadingSpinner;
