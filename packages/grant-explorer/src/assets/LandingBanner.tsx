import { ReactComponent as LandingBannerLogo } from "./landing-banner.svg";
import { ReactComponent as Check } from "./icons/by-the-numbers-check.svg";
import { ComponentProps } from "react";

export default (props: ComponentProps<"svg">) => (
  <div className="flex items-center gap-16">
    <ByTheNumbers />
    <LandingBannerLogo {...props} />
  </div>
);

const ByTheNumbers = () => {
  // TODO: fetch data (where to get this?)
  const uniqueDonations = "3.8M";
  const raisedFunds = "3,715";
  const fundingDistributed = "$50,000,000+";

  return (
    <div className="w-[520px] h-[609px] flex-shrink-0 flex-col justify-around bg-white/50 hidden md:flex rounded-b-3xl p-8">
      <div className="flex items-center gap-4">
        <Check />
        <div className="font-medium text-3xl">By the numbers…</div>
      </div>

      <Stat value={uniqueDonations} label="Unique donations" />
      <Stat value={raisedFunds} label="Projects raised funds" />
      <Stat value={fundingDistributed} label="In funding distributed" />
    </div>
  );
};

const Stat = ({ value = "", label = "" }) => {
  return (
    <div>
      <div className="font-mono text-5xl text-green-300 font-medium tracking-tight mb-1">
        {value}
      </div>
      <div className="uppercase text-xl tracking-wider">{label}</div>
    </div>
  );
};
