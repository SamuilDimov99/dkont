import dkontLogo from "../assets/images/dkont-logo.png";

export function BrandHeader({ eyebrow, title }) {
  return (
    <div className="brand">
      <img src={dkontLogo} alt="Dkont logo" className="brand-logo" />
    </div>
  );
}
